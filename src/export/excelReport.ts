import type ExcelJS from 'exceljs'
import { calculateProjection } from '../domain/calculator'
import { CATEGORIES, TERRITORIES, type CalculatorProject, type ProjectionResult, type TerritoryId } from '../domain/model'
import { downloadBlob } from '../storage/projectStore'

const COLORS = {
  teal: '0F766E',
  darkTeal: '115E59',
  paleTeal: 'CCFBF1',
  amber: 'FBBF24',
  paleAmber: 'FEF3C7',
  slate: '334155',
  paleSlate: 'E2E8F0',
  white: 'FFFFFF',
}

const moneyFormat = 'RM #,##0.00'
const countFormat = '#,##0'

function titleRow(sheet: ExcelJS.Worksheet, title: string, endColumn = 8): void {
  sheet.mergeCells(1, 1, 1, endColumn)
  const cell = sheet.getCell(1, 1)
  cell.value = title
  cell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 28
}

function styleHeader(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkTeal } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = { bottom: { style: 'thin', color: { argb: COLORS.white } } }
  })
}

function styleSection(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, color: { argb: COLORS.slate } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleAmber } }
}

function setUsefulWidths(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((column, index) => {
    if (index === 0) column.width = 20
    else column.width = Math.min(22, Math.max(12, column.width ?? 12))
  })
}

function addMetadata(sheet: ExcelJS.Worksheet, project: CalculatorProject): number {
  sheet.getCell('A3').value = 'Tahun permohonan'
  sheet.getCell('B3').value = project.applicationYear
  sheet.getCell('A4').value = 'Dijana pada'
  sheet.getCell('B4').value = new Date()
  sheet.getCell('B4').numFmt = 'dd/mm/yyyy hh:mm'
  ;['A3', 'A4'].forEach((address) => {
    sheet.getCell(address).font = { bold: true, color: { argb: COLORS.slate } }
  })
  return 6
}

function addSummarySheet(workbook: ExcelJS.Workbook, project: CalculatorProject, result: ProjectionResult): void {
  const sheet = workbook.addWorksheet('RINGKASAN', { views: [{ state: 'frozen', ySplit: 1 }] })
  titleRow(sheet, 'RINGKASAN BANTUAN AM PERSEKOLAHAN', 10)
  let rowIndex = addMetadata(sheet, project)

  sheet.getCell(rowIndex, 1).value = 'Petunjuk utama'
  styleSection(sheet.getCell(rowIndex, 1))
  rowIndex += 1
  const metrics = [
    ['Bilangan pemohon asal', result.originalApplicants, countFormat],
    ['Jumlah kumulatif tahun-pelajar', result.cumulativeStudentYears, countFormat],
    ['Jumlah keseluruhan peruntukan', result.totalAllocation, moneyFormat],
  ] as const
  metrics.forEach(([label, value, format]) => {
    sheet.getCell(rowIndex, 1).value = label
    sheet.getCell(rowIndex, 2).value = value
    sheet.getCell(rowIndex, 2).numFmt = format
    rowIndex += 1
  })

  rowIndex += 1
  sheet.getCell(rowIndex, 1).value = 'Ringkasan tahunan keseluruhan dan WP'
  styleSection(sheet.getCell(rowIndex, 1))
  rowIndex += 1
  const annualHeader = sheet.getRow(rowIndex)
  annualHeader.values = ['Tahun', 'Pelajar Keseluruhan', 'Peruntukan Keseluruhan', 'Pelajar KL', 'Peruntukan KL', 'Pelajar Labuan', 'Peruntukan Labuan', 'Pelajar Putrajaya', 'Peruntukan Putrajaya']
  styleHeader(annualHeader)
  rowIndex += 1

  result.years.forEach((year) => {
    const values: (string | number)[] = [year.year, year.totalCount, year.totalAllocation]
    TERRITORIES.forEach((territory) => {
      const cells = Object.values(year.territories[territory.id])
      values.push(cells.reduce((sum, cell) => sum + cell.count, 0))
      values.push(cells.reduce((sum, cell) => sum + cell.allocation, 0))
    })
    const row = sheet.getRow(rowIndex)
    row.values = values
    for (let column = 2; column <= 9; column += 1) {
      row.getCell(column).numFmt = column % 2 === 0 ? countFormat : moneyFormat
    }
    rowIndex += 1
  })

  const firstAnnualRow = rowIndex - result.years.length
  const totalRow = sheet.getRow(rowIndex)
  totalRow.getCell(1).value = 'JUMLAH'
  for (let column = 2; column <= 9; column += 1) {
    const letter = sheet.getColumn(column).letter
    const resultValue = result.years.reduce((sum, year) => {
      if (column === 2) return sum + year.totalCount
      if (column === 3) return sum + year.totalAllocation
      const territoryIndex = Math.floor((column - 4) / 2)
      const territory = TERRITORIES[territoryIndex]
      const cells = territory ? Object.values(year.territories[territory.id]) : []
      return sum + cells.reduce((cellSum, cell) => cellSum + (column % 2 === 0 ? cell.count : cell.allocation), 0)
    }, 0)
    totalRow.getCell(column).value = { formula: `SUM(${letter}${firstAnnualRow}:${letter}${rowIndex - 1})`, result: resultValue }
    totalRow.getCell(column).numFmt = column % 2 === 0 ? countFormat : moneyFormat
  }
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } }
  const annualTotalRow = rowIndex

  rowIndex += 3
  sheet.getCell(rowIndex, 1).value = 'Jumlah mengikut kategori'
  styleSection(sheet.getCell(rowIndex, 1))
  rowIndex += 1
  const categoryHeader = sheet.getRow(rowIndex)
  categoryHeader.values = ['Kategori', 'Tahun-pelajar', 'Peruntukan']
  styleHeader(categoryHeader)
  rowIndex += 1
  CATEGORIES.forEach((category) => {
    const total = result.byCategory[category.id]
    const row = sheet.getRow(rowIndex)
    row.values = [category.label, total.count, total.allocation]
    row.getCell(2).numFmt = countFormat
    row.getCell(3).numFmt = moneyFormat
    rowIndex += 1
  })

  setUsefulWidths(sheet)
  sheet.getColumn(1).width = 30
  sheet.getColumn(3).width = 24
  sheet.autoFilter = { from: { row: firstAnnualRow - 1, column: 1 }, to: { row: annualTotalRow, column: 9 } }
}

function territoryStageCells(result: ProjectionResult, territoryId: TerritoryId, year: number, stageIds: readonly string[]) {
  const projectionYear = result.years.find((item) => item.year === year)
  return stageIds.map((stageId) => projectionYear?.territories[territoryId][stageId] ?? { count: 0, allocation: 0 })
}

function addTerritorySheet(
  workbook: ExcelJS.Workbook,
  project: CalculatorProject,
  result: ProjectionResult,
  territoryId: TerritoryId,
  sheetName: string,
): void {
  const territory = TERRITORIES.find((item) => item.id === territoryId)!
  const maxColumns = Math.max(...CATEGORIES.map((category) => category.stages.length)) + 2
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] })
  titleRow(sheet, `BUTIRAN ${territory.label.toUpperCase()}`, maxColumns)
  let rowIndex = addMetadata(sheet, project)

  CATEGORIES.forEach((category) => {
    sheet.getCell(rowIndex, 1).value = category.label
    styleSection(sheet.getCell(rowIndex, 1))
    rowIndex += 1

    const countHeaderRow = sheet.getRow(rowIndex)
    countHeaderRow.values = ['Bilangan Pelajar', ...category.stages.map((stage) => stage.label), 'Jumlah']
    styleHeader(countHeaderRow)
    rowIndex += 1
    const countStart = rowIndex
    result.years.forEach((year) => {
      const cells = territoryStageCells(result, territoryId, year.year, category.stages.map((stage) => stage.id))
      const row = sheet.getRow(rowIndex)
      row.getCell(1).value = year.year
      cells.forEach((cell, index) => {
        row.getCell(index + 2).value = cell.count
        row.getCell(index + 2).numFmt = countFormat
      })
      const totalColumn = category.stages.length + 2
      const firstLetter = sheet.getColumn(2).letter
      const lastLetter = sheet.getColumn(totalColumn - 1).letter
      row.getCell(totalColumn).value = {
        formula: `SUM(${firstLetter}${rowIndex}:${lastLetter}${rowIndex})`,
        result: cells.reduce((sum, cell) => sum + cell.count, 0),
      }
      row.getCell(totalColumn).numFmt = countFormat
      rowIndex += 1
    })
    const countTotalRow = sheet.getRow(rowIndex)
    countTotalRow.getCell(1).value = 'JUMLAH'
    for (let column = 2; column <= category.stages.length + 2; column += 1) {
      const letter = sheet.getColumn(column).letter
      countTotalRow.getCell(column).value = {
        formula: `SUM(${letter}${countStart}:${letter}${rowIndex - 1})`,
        result: result.years.reduce((sum, year) => {
          const cells = territoryStageCells(result, territoryId, year.year, category.stages.map((stage) => stage.id))
          return sum + (column === category.stages.length + 2 ? cells.reduce((inner, cell) => inner + cell.count, 0) : cells[column - 2].count)
        }, 0),
      }
      countTotalRow.getCell(column).numFmt = countFormat
    }
    countTotalRow.font = { bold: true }
    countTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } }
    rowIndex += 2

    const allocationHeaderRow = sheet.getRow(rowIndex)
    allocationHeaderRow.values = ['Jumlah Peruntukan', ...category.stages.map((stage) => stage.label), 'Jumlah']
    styleHeader(allocationHeaderRow)
    rowIndex += 1
    const allocationStart = rowIndex
    result.years.forEach((year) => {
      const cells = territoryStageCells(result, territoryId, year.year, category.stages.map((stage) => stage.id))
      const row = sheet.getRow(rowIndex)
      row.getCell(1).value = year.year
      cells.forEach((cell, index) => {
        row.getCell(index + 2).value = cell.allocation
        row.getCell(index + 2).numFmt = moneyFormat
      })
      const totalColumn = category.stages.length + 2
      const firstLetter = sheet.getColumn(2).letter
      const lastLetter = sheet.getColumn(totalColumn - 1).letter
      row.getCell(totalColumn).value = {
        formula: `SUM(${firstLetter}${rowIndex}:${lastLetter}${rowIndex})`,
        result: cells.reduce((sum, cell) => sum + cell.allocation, 0),
      }
      row.getCell(totalColumn).numFmt = moneyFormat
      rowIndex += 1
    })
    const allocationTotalRow = sheet.getRow(rowIndex)
    allocationTotalRow.getCell(1).value = 'JUMLAH'
    for (let column = 2; column <= category.stages.length + 2; column += 1) {
      const letter = sheet.getColumn(column).letter
      allocationTotalRow.getCell(column).value = {
        formula: `SUM(${letter}${allocationStart}:${letter}${rowIndex - 1})`,
        result: result.years.reduce((sum, year) => {
          const cells = territoryStageCells(result, territoryId, year.year, category.stages.map((stage) => stage.id))
          return sum + (column === category.stages.length + 2 ? cells.reduce((inner, cell) => inner + cell.allocation, 0) : cells[column - 2].allocation)
        }, 0),
      }
      allocationTotalRow.getCell(column).numFmt = moneyFormat
    }
    allocationTotalRow.font = { bold: true }
    allocationTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleAmber } }
    rowIndex += 3
  })

  setUsefulWidths(sheet)
  sheet.getColumn(1).width = 24
}

function addInputsAndRatesSheet(workbook: ExcelJS.Workbook, project: CalculatorProject): void {
  const sheet = workbook.addWorksheet('INPUT & KADAR', { views: [{ state: 'frozen', ySplit: 1 }] })
  titleRow(sheet, 'INPUT ASAL DAN KADAR BANTUAN', 8)
  let rowIndex = addMetadata(sheet, project)
  sheet.getCell(rowIndex, 1).value = 'Input bilangan pelajar'
  styleSection(sheet.getCell(rowIndex, 1))
  rowIndex += 1
  const inputHeader = sheet.getRow(rowIndex)
  inputHeader.values = ['WP', 'Kategori', 'Tahap', 'Bilangan']
  styleHeader(inputHeader)
  rowIndex += 1
  TERRITORIES.forEach((territory) => {
    CATEGORIES.forEach((category) => {
      category.stages.forEach((stage) => {
        const row = sheet.getRow(rowIndex)
        row.values = [territory.label, category.label, stage.label, project.counts[territory.id][stage.id] ?? 0]
        row.getCell(4).numFmt = countFormat
        rowIndex += 1
      })
    })
  })

  rowIndex += 2
  sheet.getCell(rowIndex, 1).value = 'Kadar bantuan mengikut tahun'
  styleSection(sheet.getCell(rowIndex, 1))
  rowIndex += 1
  const rateHeader = sheet.getRow(rowIndex)
  rateHeader.values = ['Tahun', 'Kategori', 'Tahap', 'Kadar']
  styleHeader(rateHeader)
  rowIndex += 1
  Object.keys(project.rates)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((year) => {
      CATEGORIES.forEach((category) => {
        category.stages.forEach((stage) => {
          const row = sheet.getRow(rowIndex)
          row.values = [year, category.label, stage.label, project.rates[year][stage.id]]
          row.getCell(4).numFmt = moneyFormat
          rowIndex += 1
        })
      })
    })
  setUsefulWidths(sheet)
  sheet.getColumn(1).width = 20
  sheet.getColumn(2).width = 25
  sheet.getColumn(3).width = 24
}

export async function buildExcelWorkbook(project: CalculatorProject): Promise<ExcelJS.Workbook> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Kalkulator Bantuan Am Persekolahan'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true
  const result = calculateProjection(project)

  addSummarySheet(workbook, project, result)
  addTerritorySheet(workbook, project, result, 'kl', 'KUALA LUMPUR')
  addTerritorySheet(workbook, project, result, 'labuan', 'LABUAN')
  addTerritorySheet(workbook, project, result, 'putrajaya', 'PUTRAJAYA')
  addInputsAndRatesSheet(workbook, project)
  return workbook
}

export async function downloadExcelReport(project: CalculatorProject): Promise<void> {
  const workbook = await buildExcelWorkbook(project)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `Laporan_Bantuan_Am_Persekolahan_${project.applicationYear}.xlsx`)
}
