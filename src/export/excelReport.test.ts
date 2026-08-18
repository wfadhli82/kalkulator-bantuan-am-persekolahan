import { describe, expect, it } from 'vitest'
import { createNewProject } from '../domain/defaults'
import { buildExcelWorkbook } from './excelReport'

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
})
