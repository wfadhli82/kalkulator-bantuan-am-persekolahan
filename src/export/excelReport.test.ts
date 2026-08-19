import type ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { createNewProject } from '../domain/defaults'
import { buildExcelWorkbook } from './excelReport'
import { buildExcelWorkbookV2 } from './excelReportV2'

function numericResult(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'result' in value && typeof value.result === 'number') return value.result
  return Number.NaN
}

describe('Excel report', () => {
  it('creates five sheets with auditable formulas and no broken references', async () => {
    const project = createNewProject(2026)
    project.counts.kl['secondary-f2'] = 10
    const workbook = await buildExcelWorkbook(project)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'RINGKASAN',
      'KUALA LUMPUR',
      'LABUAN',
      'PUTRAJAYA',
      'INPUT & KADAR',
    ])

    let formulaCount = 0
    workbook.eachSheet((sheet) => {
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === 'object' && cell.value && 'formula' in cell.value) {
            formulaCount += 1
            expect(String(cell.value.formula)).not.toContain('#REF!')
          }
        })
      })
    })
    expect(formulaCount).toBeGreaterThan(20)
    const buffer = await workbook.xlsx.writeBuffer()
    expect(buffer.byteLength).toBeGreaterThan(10_000)
  })

  it('recreates the Word-style yearly tables without moving Tingkatan 5 to Tingkatan 6', async () => {
    const project = createNewProject(2026)
    Object.assign(project.counts.kl, {
      'secondary-f1': 2853,
      'secondary-f2': 676,
      'secondary-f3': 379,
      'secondary-f4': 304,
      'secondary-f5': 169,
      'secondary-l6': 12,
      'secondary-u6': 27,
    })

    const workbook = await buildExcelWorkbookV2(project)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['RINGKASAN V2', '2026', '2027', '2028', '2029', '2030'])

    const year2027 = workbook.getWorksheet('2027')!
    const rows = new Map<string, ExcelJS.Row>()
    year2027.eachRow((row) => {
      if (typeof row.getCell(1).value === 'string') rows.set(row.getCell(1).value as string, row)
    })
    expect(rows.get('Tingkatan 2')?.getCell(2).value).toBe(2853)
    expect(rows.get('Tingkatan 3')?.getCell(2).value).toBe(676)
    expect(rows.get('Tingkatan 4')?.getCell(2).value).toBe(379)
    expect(rows.get('Tingkatan 5')?.getCell(2).value).toBe(304)
    expect(rows.get('Tingkatan 6 Atas')?.getCell(2).value).toBe(12)
    expect(rows.get('Tingkatan 6 Bawah')).toBeUndefined()
    expect(numericResult(rows.get('JUMLAH KESELURUHAN')?.getCell(8).value)).toBe(4224)

    let formulaCount = 0
    workbook.eachSheet((sheet) => {
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (typeof cell.value === 'object' && cell.value && 'formula' in cell.value) {
            formulaCount += 1
            expect(String(cell.value.formula)).not.toContain('#REF!')
          }
        })
      })
    })
    expect(formulaCount).toBeGreaterThan(40)
  })

  it('includes every Word table category when that category has active recipients', async () => {
    const project = createNewProject(2026)
    project.counts.kl['primary-d6'] = 1
    project.counts.labuan['secondary-f5'] = 2
    project.counts.putrajaya['kafa-d6'] = 3
    project.counts.kl['special-d6'] = 4

    const workbook = await buildExcelWorkbookV2(project)
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['RINGKASAN V2', '2026'])
    const labels: string[] = []
    workbook.getWorksheet('2026')!.eachRow((row) => {
      if (typeof row.getCell(1).value === 'string') labels.push(row.getCell(1).value as string)
    })
    expect(labels).toEqual(expect.arrayContaining(['SEKOLAH RENDAH', 'KELAS KHAS', 'SEKOLAH MENENGAH', 'SRA KAFA']))
  })
})
