import { describe, expect, it } from 'vitest'
import { calculateProjection } from './calculator'
import { createNewProject } from './defaults'

function projectWith(stageId: string, count = 1) {
  const project = createNewProject(2026)
  project.counts.kl[stageId] = count
  return project
}

describe('calculateProjection', () => {
  it('projects Darjah 1 through six approved years', () => {
    const result = calculateProjection(projectWith('primary-d1'))
    expect(result.years.map((year) => year.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031])
    expect(result.cumulativeStudentYears).toBe(6)
    expect(result.totalAllocation).toBe(3300)
  })

  it('projects Tingkatan 2 in 2026 only through Tingkatan 5 in 2029', () => {
    const result = calculateProjection(projectWith('secondary-f2'))
    expect(result.years.map((year) => year.year)).toEqual([2026, 2027, 2028, 2029])
    expect(result.cumulativeStudentYears).toBe(4)
    expect(result.totalAllocation).toBe(3200)
  })

  it('does not progress Tingkatan 5 into Tingkatan 6 Bawah', () => {
    const result = calculateProjection(projectWith('secondary-f5'))
    expect(result.years).toHaveLength(1)
    expect(result.cumulativeStudentYears).toBe(1)
    expect(result.totalAllocation).toBe(900)
  })

  it('projects Tingkatan 6 Bawah to Tingkatan 6 Atas only', () => {
    const result = calculateProjection(projectWith('secondary-l6'))
    expect(result.years).toHaveLength(2)
    expect(result.cumulativeStudentYears).toBe(2)
    expect(result.totalAllocation).toBe(2400)
  })

  it('uses editable rates by projection year', () => {
    const project = projectWith('primary-d1', 2)
    project.rates[2027]['primary-d2'] = 750
    const result = calculateProjection(project)
    expect(result.years[1].totalAllocation).toBe(1500)
  })

  it('reconciles overall totals to the three territories', () => {
    const project = createNewProject(2026)
    project.counts.kl['primary-d6'] = 2
    project.counts.labuan['primary-d6'] = 3
    project.counts.putrajaya['primary-d6'] = 5
    const result = calculateProjection(project)
    expect(result.originalApplicants).toBe(10)
    expect(result.totalAllocation).toBe(6000)
    expect(Object.values(result.byTerritory).reduce((sum, item) => sum + item.allocation, 0)).toBe(result.totalAllocation)
  })

  it('matches reference totals and corrects Kelas Khas to Darjah 6', () => {
    const primary = createNewProject(2026)
    ;[3504, 1027, 767, 710, 617, 495].forEach((count, index) => {
      primary.counts.kl[`primary-d${index + 1}`] = count
    })
    expect(calculateProjection(primary).totalAllocation).toBe(18_518_300)

    const kafa = createNewProject(2026)
    ;[345, 45, 40, 40, 40, 25].forEach((count, index) => {
      kafa.counts.kl[`kafa-d${index + 1}`] = count
    })
    expect(calculateProjection(kafa).totalAllocation).toBe(536_000)

    const secondary = createNewProject(2026)
    ;[3802, 827, 468, 380, 242].forEach((count, index) => {
      secondary.counts.kl[`secondary-f${index + 1}`] = count
    })
    secondary.counts.kl['secondary-l6'] = 116
    secondary.counts.kl['secondary-u6'] = 52
    expect(calculateProjection(secondary).totalAllocation).toBe(19_886_800)

    const special = createNewProject(2026)
    Array.from({ length: 6 }, (_, index) => index + 1).forEach((level) => {
      special.counts.kl[`special-d${level}`] = 448
    })
    expect(calculateProjection(special).totalAllocation).toBe(5_644_800)
  })
})
