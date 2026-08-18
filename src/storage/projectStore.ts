import { MAX_APPLICATION_YEAR, MIN_APPLICATION_YEAR, createNewProject } from '../domain/defaults'
import { STAGES, TERRITORIES, type CalculatorProject } from '../domain/model'

export const STORAGE_KEY = 'bap-calculator-project-v1'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeProject(value: unknown): CalculatorProject {
  if (!isPlainObject(value) || value.schemaVersion !== 1) {
    throw new Error('Fail sandaran bukan versi kalkulator yang disokong.')
  }

  const year = Number(value.applicationYear)
  if (!Number.isInteger(year) || year < MIN_APPLICATION_YEAR || year > MAX_APPLICATION_YEAR) {
    throw new Error('Tahun permohonan dalam fail sandaran tidak sah.')
  }

  const base = createNewProject(year)
  const countsValue = isPlainObject(value.counts) ? value.counts : {}
  for (const territory of TERRITORIES) {
    const rawTerritoryCounts = countsValue[territory.id]
    const territoryCounts: Record<string, unknown> = isPlainObject(rawTerritoryCounts) ? rawTerritoryCounts : {}
    for (const stage of STAGES) {
      const amount = Number(territoryCounts[stage.id] ?? 0)
      base.counts[territory.id][stage.id] = Number.isFinite(amount) && amount >= 0 ? Math.floor(amount) : 0
    }
  }

  const ratesValue = isPlainObject(value.rates) ? value.rates : {}
  for (const [yearKey, yearRates] of Object.entries(ratesValue)) {
    const rateYear = Number(yearKey)
    if (!Number.isInteger(rateYear) || !isPlainObject(yearRates) || !base.rates[rateYear]) continue
    for (const stage of STAGES) {
      const rate = Number(yearRates[stage.id] ?? base.rates[rateYear][stage.id])
      base.rates[rateYear][stage.id] = Number.isFinite(rate) && rate >= 0 ? Math.round(rate * 100) / 100 : 0
    }
  }

  base.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  return base
}

export function loadProject(): CalculatorProject {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? normalizeProject(JSON.parse(saved)) : createNewProject()
  } catch {
    return createNewProject()
  }
}

export function saveProject(project: CalculatorProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function clearSavedProject(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function downloadJsonBackup(project: CalculatorProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `Sandaran_Kalkulator_BAP_${project.applicationYear}.json`)
}

export async function readJsonBackup(file: File): Promise<CalculatorProject> {
  const text = await file.text()
  return normalizeProject(JSON.parse(text))
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
