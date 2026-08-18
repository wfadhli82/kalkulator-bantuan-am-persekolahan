import {
  CATEGORIES,
  STAGES,
  TERRITORIES,
  type CalculatorProject,
  type CategoryId,
  type CategoryTotal,
  type ProjectionCell,
  type ProjectionResult,
  type ProjectionYear,
  type ScopeId,
  type TerritoryId,
} from './model'

const stageIndex = new Map(STAGES.map((stage) => [stage.id, stage]))

function emptyCellMap(): Record<string, ProjectionCell> {
  return Object.fromEntries(STAGES.map((stage) => [stage.id, { count: 0, allocation: 0 }]))
}

function emptyTerritoryMap(): ProjectionYear['territories'] {
  return Object.fromEntries(TERRITORIES.map((territory) => [territory.id, emptyCellMap()])) as ProjectionYear['territories']
}

function emptyCategoryTotals(): Record<CategoryId, CategoryTotal> {
  return Object.fromEntries(CATEGORIES.map((category) => [category.id, { count: 0, allocation: 0 }])) as Record<
    CategoryId,
    CategoryTotal
  >
}

export function sanitizeWholeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

export function sanitizeRate(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100) / 100
}

export function calculateProjection(project: CalculatorProject): ProjectionResult {
  const projected = new Map<number, ProjectionYear>()
  const originalApplicants = TERRITORIES.reduce(
    (total, territory) => total + STAGES.reduce((sum, stage) => sum + sanitizeWholeNumber(project.counts[territory.id][stage.id] ?? 0), 0),
    0,
  )

  const ensureYear = (year: number): ProjectionYear => {
    const existing = projected.get(year)
    if (existing) return existing
    const created: ProjectionYear = {
      year,
      territories: emptyTerritoryMap(),
      totalCount: 0,
      totalAllocation: 0,
    }
    projected.set(year, created)
    return created
  }

  ensureYear(project.applicationYear)

  for (const territory of TERRITORIES) {
    for (const startingStage of STAGES) {
      const count = sanitizeWholeNumber(project.counts[territory.id][startingStage.id] ?? 0)
      if (count === 0) continue

      let currentStageId: string | undefined = startingStage.id
      let year = project.applicationYear
      while (currentStageId) {
        const stage = stageIndex.get(currentStageId)
        if (!stage) break
        const rate = sanitizeRate(project.rates[year]?.[currentStageId] ?? 0)
        const yearProjection = ensureYear(year)
        const cell = yearProjection.territories[territory.id][currentStageId]
        cell.count += count
        cell.allocation += count * rate
        yearProjection.totalCount += count
        yearProjection.totalAllocation += count * rate
        currentStageId = stage.next
        year += 1
      }
    }
  }

  const years = [...projected.values()]
    .sort((a, b) => a.year - b.year)
    .filter((year, index) => index === 0 || year.totalCount > 0)

  const byTerritory = Object.fromEntries(TERRITORIES.map((territory) => [territory.id, { count: 0, allocation: 0 }])) as Record<
    TerritoryId,
    CategoryTotal
  >
  const byCategory = emptyCategoryTotals()

  for (const year of years) {
    for (const territory of TERRITORIES) {
      for (const stage of STAGES) {
        const cell = year.territories[territory.id][stage.id]
        byTerritory[territory.id].count += cell.count
        byTerritory[territory.id].allocation += cell.allocation
        byCategory[stage.categoryId].count += cell.count
        byCategory[stage.categoryId].allocation += cell.allocation
      }
    }
  }

  return {
    years,
    originalApplicants,
    cumulativeStudentYears: years.reduce((sum, year) => sum + year.totalCount, 0),
    totalAllocation: years.reduce((sum, year) => sum + year.totalAllocation, 0),
    byTerritory,
    byCategory,
  }
}

export function totalsForScope(project: CalculatorProject, result: ProjectionResult, scope: ScopeId) {
  const years = result.years.map((year) => {
    if (scope === 'overall') {
      return { year: year.year, count: year.totalCount, allocation: year.totalAllocation }
    }
    const cells = Object.values(year.territories[scope])
    return {
      year: year.year,
      count: cells.reduce((sum, cell) => sum + cell.count, 0),
      allocation: cells.reduce((sum, cell) => sum + cell.allocation, 0),
    }
  })

  const originalApplicants = scope === 'overall'
    ? result.originalApplicants
    : STAGES.reduce((sum, stage) => sum + sanitizeWholeNumber(project.counts[scope][stage.id] ?? 0), 0)

  const byCategory = emptyCategoryTotals()
  for (const year of result.years) {
    const territories = scope === 'overall' ? TERRITORIES.map((territory) => territory.id) : [scope]
    for (const territoryId of territories) {
      for (const stage of STAGES) {
        const cell = year.territories[territoryId][stage.id]
        byCategory[stage.categoryId].count += cell.count
        byCategory[stage.categoryId].allocation += cell.allocation
      }
    }
  }

  return {
    years,
    originalApplicants,
    cumulativeStudentYears: years.reduce((sum, year) => sum + year.count, 0),
    totalAllocation: years.reduce((sum, year) => sum + year.allocation, 0),
    byCategory,
  }
}
