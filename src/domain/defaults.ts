import {
  CATEGORIES,
  STAGES,
  TERRITORIES,
  type CalculatorProject,
  type CountsByTerritory,
  type RatesByYear,
} from './model'

export const RATE_HORIZON_YEARS = 6

export function defaultRateForStage(stageId: string): number {
  if (/^primary-d[1-3]$/.test(stageId)) return 500
  if (/^primary-d[4-6]$/.test(stageId)) return 600
  if (/^secondary-f[1-3]$/.test(stageId)) return 700
  if (/^secondary-f[4-5]$/.test(stageId)) return 900
  if (/^secondary-(l6|u6)$/.test(stageId)) return 1200
  if (stageId.startsWith('kafa-')) return 200
  if (stageId.startsWith('special-')) return 600
  return 0
}

export function createEmptyCounts(): CountsByTerritory {
  return Object.fromEntries(
    TERRITORIES.map((territory) => [
      territory.id,
      Object.fromEntries(STAGES.map((stage) => [stage.id, 0])),
    ]),
  ) as CountsByTerritory
}

export function createDefaultRates(applicationYear: number): RatesByYear {
  return Object.fromEntries(
    Array.from({ length: RATE_HORIZON_YEARS }, (_, offset) => {
      const year = applicationYear + offset
      return [year, Object.fromEntries(STAGES.map((stage) => [stage.id, defaultRateForStage(stage.id)]))]
    }),
  ) as RatesByYear
}

export function createNewProject(applicationYear = new Date().getFullYear()): CalculatorProject {
  const safeYear = Math.min(2100, Math.max(2020, applicationYear))
  return {
    schemaVersion: 1,
    reportName: `Kalkulator Bantuan Am Persekolahan ${safeYear}`,
    applicationYear: safeYear,
    counts: createEmptyCounts(),
    rates: createDefaultRates(safeYear),
    updatedAt: new Date().toISOString(),
  }
}

export function resetRates(project: CalculatorProject): CalculatorProject {
  return { ...project, rates: createDefaultRates(project.applicationYear), updatedAt: new Date().toISOString() }
}

export function allStageIdsForCategory(categoryId: string): string[] {
  return CATEGORIES.find((category) => category.id === categoryId)?.stages.map((stage) => stage.id) ?? []
}
