import type ExcelJS from 'exceljs'
import { calculateProjection } from '../domain/calculator'
import {
  CATEGORIES,
  TERRITORIES,
  type CalculatorProject,
  type CategoryDefinition,
  type ProjectionCell,
  type ProjectionResult,
  type ProjectionYear,
  type TerritoryId,
} from '../domain/model'
import { downloadBlob } from '../storage/projectStore'

const COLORS = {
  teal: '0F766E',
  darkTeal: '115E59',
  paleTeal: 'CCFBF1',
  paleAmber: 'FEF3C7',
  slate: '334155',
  paleSlate: 'E2E8F0',
  white: 'FFFFFF',
}

const countFormat = '#,##0'
const moneyFormat = '#,##0.00'
const categoryOrder = ['primary', 'special', 'secondary', 'kafa'] as const
const summaryOrder = ['primary', 'secondary', 'kafa', 'special'] as const
const summaryLabels: Record<(typeof summaryOrder)[number], string> = {
  primary: 'SK',
  secondary: 'SM',
  kafa: 'SRA',
  special: 'KELAS KHAS',
}

function categoryById(id: string): CategoryDefinition {
  return CATEGORIES.find((category) => category.id === id)!
}

function styleTitle(sheet: ExcelJS.Worksheet, title: string, endColumn: number): void {
  sheet.mergeCells(1, 1, 1, endColumn)
  const cell = sheet.getCell(1, 1)
  cell.value = title
  cell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } }
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
  sheet.getRow(1).height = 30
}

function styleHeader(row: ExcelJS.Row, startColumn = 1, endColumn = row.cellCount): void {
  for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = row.getCell(column)
    cell.font = { bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkTeal } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.white } },
      bottom: { style: 'thin', color: { argb: COLORS.white } },
    }
  }
}

function styleSectionRow(sheet: ExcelJS.Worksheet, rowIndex: number, label: string): void {
  sheet.mergeCells(rowIndex, 1, rowIndex, 9)
  const cell = sheet.getCell(rowIndex, 1)
  cell.value = label.toUpperCase()
  cell.font = { bold: true, color: { argb: COLORS.slate } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleAmber } }
  cell.alignment = { horizontal: 'left', vertical: 'middle' }
  sheet.getRow(rowIndex).height = 22
}

function categoryCells(year: ProjectionYear, category: CategoryDefinition, territoryId: TerritoryId): ProjectionCell[] {
  return category.stages.map((stage) => year.territories[territoryId][stage.id])
}

function categoryTotal(year: ProjectionYear, category: CategoryDefinition): ProjectionCell {
  return TERRITORIES.reduce(
    (total, territory) => categoryCells(year, category, territory.id).reduce(
      (inner, cell) => ({ count: inner.count + cell.count, allocation: inner.allocation + cell.allocation }),
      total,
    ),
    { count: 0, allocation: 0 },
  )
}

function stageTotal(year: ProjectionYear, stageId: string): ProjectionCell {
  return TERRITORIES.reduce(
    (total, territory) => {
      const cell = year.territories[territory.id][stageId]
      return { count: total.count + cell.count, allocation: total.allocation + cell.allocation }
    },
    { count: 0, allocation: 0 },
  )
}

function formulaValue(cell: ExcelJS.Cell, formula: string, result: number, format: string): void {
  cell.value = { formula, result }
  cell.numFmt = format
}

function configureSheet(sheet: ExcelJS.Worksheet): void {
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }]
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  }
  sheet.properties.defaultRowHeight = 20
}

function addSummarySheet(workbook: ExcelJS.Workbook, project: CalculatorProject, result: ProjectionResult): void {
  const endColumn = 1 + (result.years.length * 2)
  const sheet = workbook.addWorksheet('RINGKASAN V2')
  configureSheet(sheet)
  sheet.views = [{ state: 'frozen', ySplit: 7, xSplit: 1, showGridLines: false }]
  styleTitle(sheet, 'RINGKASAN JADUAL BANTUAN AM PERSEKOLAHAN - EXCEL V2', endColumn)
  sheet.getCell('A3').value = 'Tahun permohonan'
  sheet.getCell('B3').value = project.applicationYear
  sheet.getCell('A4').value = 'Dijana pada'
  sheet.getCell('B4').value = new Date()
  sheet.getCell('B4').numFmt = 'dd/mm/yyyy hh:mm'
  sheet.getCell('A3').font = sheet.getCell('A4').font = { bold: true, color: { argb: COLORS.slate } }

  sheet.mergeCells(6, 1, 7, 1)
  sheet.getCell(6, 1).value = 'Kategori'
  result.years.forEach((year, index) => {
    const countColumn = 2 + (index * 2)
    sheet.mergeCells(6, countColumn, 6, countColumn + 1)
    sheet.getCell(6, countColumn).value = year.year
    sheet.getCell(7, countColumn).value = 'Bil. Pelajar'
    sheet.getCell(7, countColumn + 1).value = 'Perbelanjaan (RM)'
  })
  styleHeader(sheet.getRow(6), 1, endColumn)
  styleHeader(sheet.getRow(7), 1, endColumn)

  const categoryStartRow = 8
  summaryOrder.forEach((categoryId, categoryIndex) => {
    const category = categoryById(categoryId)
    const row = sheet.getRow(categoryStartRow + categoryIndex)
    row.getCell(1).value = summaryLabels[categoryId]
    result.years.forEach((year, yearIndex) => {
      const total = categoryTotal(year, category)
      row.getCell(2 + (yearIndex * 2)).value = total.count
      row.getCell(2 + (yearIndex * 2)).numFmt = countFormat
      row.getCell(3 + (yearIndex * 2)).value = total.allocation
      row.getCell(3 + (yearIndex * 2)).numFmt = moneyFormat
    })
  })

  const categoryTotalRow = categoryStartRow + summaryOrder.length
  sheet.getCell(categoryTotalRow, 1).value = 'JUMLAH'
  for (let column = 2; column <= endColumn; column += 1) {
    const letter = sheet.getColumn(column).letter
    const value = result.years.reduce((sum, year, index) => {
      if (column !== 2 + (index * 2) && column !== 3 + (index * 2)) return sum
      return sum + (column % 2 === 0 ? year.totalCount : year.totalAllocation)
    }, 0)
    formulaValue(
      sheet.getCell(categoryTotalRow, column),
      `SUM(${letter}${categoryStartRow}:${letter}${categoryTotalRow - 1})`,
      value,
      column % 2 === 0 ? countFormat : moneyFormat,
    )
  }
  for (let column = 1; column <= endColumn; column += 1) {
    sheet.getCell(categoryTotalRow, column).font = { bold: true }
    sheet.getCell(categoryTotalRow, column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } }
  }

  const annualTitleRow = categoryTotalRow + 3
  sheet.mergeCells(annualTitleRow, 1, annualTitleRow, 3)
  sheet.getCell(annualTitleRow, 1).value = 'RINGKASAN TAHUNAN'
  sheet.getCell(annualTitleRow, 1).font = { bold: true, color: { argb: COLORS.slate } }
  sheet.getCell(annualTitleRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleAmber } }
  const annualHeaderRow = annualTitleRow + 1
  sheet.getRow(annualHeaderRow).values = ['Tahun', 'Bil. Penerima', 'Perbelanjaan (RM)']
  styleHeader(sheet.getRow(annualHeaderRow), 1, 3)
  const annualStartRow = annualHeaderRow + 1
  result.years.forEach((year, index) => {
    const row = sheet.getRow(annualStartRow + index)
    row.values = [year.year, year.totalCount, year.totalAllocation]
    row.getCell(2).numFmt = countFormat
    row.getCell(3).numFmt = moneyFormat
  })
  const annualTotalRow = annualStartRow + result.years.length
  sheet.getCell(annualTotalRow, 1).value = 'JUMLAH'
  formulaValue(sheet.getCell(annualTotalRow, 2), `SUM(B${annualStartRow}:B${annualTotalRow - 1})`, result.cumulativeStudentYears, countFormat)
  formulaValue(sheet.getCell(annualTotalRow, 3), `SUM(C${annualStartRow}:C${annualTotalRow - 1})`, result.totalAllocation, moneyFormat)
  for (let column = 1; column <= 3; column += 1) {
    sheet.getCell(annualTotalRow, column).font = { bold: true }
    sheet.getCell(annualTotalRow, column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } }
  }

  sheet.getColumn(1).width = 22
  for (let column = 2; column <= endColumn; column += 1) sheet.getColumn(column).width = column % 2 === 0 ? 14 : 19
  sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: categoryTotalRow, column: endColumn } }
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(endColumn).letter}${annualTotalRow}`
}

function addYearSheet(workbook: ExcelJS.Workbook, project: CalculatorProject, year: ProjectionYear): void {
  const sheet = workbook.addWorksheet(String(year.year))
  configureSheet(sheet)
  styleTitle(sheet, `PERINCIAN BANTUAN AM PERSEKOLAHAN TAHUN ${year.year}`, 9)
  sheet.getCell('A3').value = 'Tahun permohonan'
  sheet.getCell('B3').value = project.applicationYear
  sheet.getCell('D3').value = 'Tahun unjuran'
  sheet.getCell('E3').value = year.year
  sheet.getCell('A3').font = sheet.getCell('D3').font = { bold: true, color: { argb: COLORS.slate } }

  const headerRow = sheet.getRow(5)
  headerRow.values = [
    'Tahap',
    'Kuala Lumpur',
    'Perbelanjaan (RM)',
    'Labuan',
    'Perbelanjaan (RM)',
    'Putrajaya',
    'Perbelanjaan (RM)',
    'Bil. Pelajar',
    'Jumlah Perbelanjaan',
  ]
  styleHeader(headerRow, 1, 9)
  headerRow.height = 34

  let rowIndex = 6
  const subtotalRows: number[] = []
  categoryOrder.forEach((categoryId) => {
    const category = categoryById(categoryId)
    const activeStages = category.stages.filter((stage) => stageTotal(year, stage.id).count > 0)
    if (activeStages.length === 0) return

    styleSectionRow(sheet, rowIndex, category.label)
    rowIndex += 1
    const detailStartRow = rowIndex
    activeStages.forEach((stage) => {
      const row = sheet.getRow(rowIndex)
      row.getCell(1).value = stage.label
      TERRITORIES.forEach((territory, territoryIndex) => {
        const cell = year.territories[territory.id][stage.id]
        const countColumn = 2 + (territoryIndex * 2)
        row.getCell(countColumn).value = cell.count
        row.getCell(countColumn).numFmt = countFormat
        row.getCell(countColumn + 1).value = cell.allocation
        row.getCell(countColumn + 1).numFmt = moneyFormat
      })
      const total = stageTotal(year, stage.id)
      formulaValue(row.getCell(8), `SUM(B${rowIndex},D${rowIndex},F${rowIndex})`, total.count, countFormat)
      formulaValue(row.getCell(9), `SUM(C${rowIndex},E${rowIndex},G${rowIndex})`, total.allocation, moneyFormat)
      rowIndex += 1
    })

    const subtotal = categoryTotal(year, category)
    const subtotalRow = sheet.getRow(rowIndex)
    subtotalRow.getCell(1).value = 'JUMLAH'
    for (let column = 2; column <= 9; column += 1) {
      const letter = sheet.getColumn(column).letter
      formulaValue(
        subtotalRow.getCell(column),
        `SUM(${letter}${detailStartRow}:${letter}${rowIndex - 1})`,
        column === 8 ? subtotal.count : column === 9 ? subtotal.allocation : activeStages.reduce((sum, stage) => {
          const stageCell = year.territories[TERRITORIES[Math.floor((column - 2) / 2)].id][stage.id]
          return sum + (column % 2 === 0 ? stageCell.count : stageCell.allocation)
        }, 0),
        column % 2 === 0 ? countFormat : moneyFormat,
      )
    }
    for (let column = 1; column <= 9; column += 1) {
      subtotalRow.getCell(column).font = { bold: true }
      subtotalRow.getCell(column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleSlate } }
    }
    subtotalRows.push(rowIndex)
    rowIndex += 2
  })

  const totalRow = sheet.getRow(rowIndex)
  totalRow.getCell(1).value = 'JUMLAH KESELURUHAN'
  for (let column = 2; column <= 9; column += 1) {
    const letter = sheet.getColumn(column).letter
    const territory = column >= 2 && column <= 7 ? TERRITORIES[Math.floor((column - 2) / 2)] : undefined
    const territoryCells = territory ? Object.values(year.territories[territory.id]) : []
    const result = column === 8
      ? year.totalCount
      : column === 9
        ? year.totalAllocation
        : territoryCells.reduce((sum, cell) => sum + (column % 2 === 0 ? cell.count : cell.allocation), 0)
    formulaValue(totalRow.getCell(column), `SUM(${subtotalRows.map((row) => `${letter}${row}`).join(',') || '0'})`, result, column % 2 === 0 ? countFormat : moneyFormat)
  }
  for (let column = 1; column <= 9; column += 1) {
    totalRow.getCell(column).font = { bold: true, color: { argb: COLORS.slate } }
    totalRow.getCell(column).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } }
  }

  rowIndex += 2
  sheet.mergeCells(rowIndex, 1, rowIndex, 9)
  sheet.getCell(rowIndex, 1).value = `BILANGAN KESELURUHAN PELAJAR = ${year.totalCount.toLocaleString('en-US')}   JUMLAH KESELURUHAN PERBELANJAAN = RM${year.totalAllocation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  sheet.getCell(rowIndex, 1).font = { bold: true, color: { argb: COLORS.white } }
  sheet.getCell(rowIndex, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } }
  sheet.getCell(rowIndex, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  sheet.getRow(rowIndex).height = 28

  const widths = [24, 14, 19, 14, 19, 14, 19, 14, 21]
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width })
  sheet.pageSetup.printArea = `A1:I${rowIndex}`
  sheet.pageSetup.printTitlesRow = '1:5'
}

export async function buildExcelWorkbookV2(project: CalculatorProject): Promise<ExcelJS.Workbook> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Kalkulator Bantuan Am Persekolahan'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true
  const result = calculateProjection(project)

  addSummarySheet(workbook, project, result)
  result.years.forEach((year) => addYearSheet(workbook, project, year))
  return workbook
}

export async function downloadExcelReportV2(project: CalculatorProject): Promise<void> {
  const workbook = await buildExcelWorkbookV2(project)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `Jadual_Bantuan_Am_Persekolahan_V2_${project.applicationYear}.xlsx`)
}
