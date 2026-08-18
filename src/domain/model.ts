export const TERRITORIES = [
  { id: 'kl', label: 'Kuala Lumpur', shortLabel: 'KL' },
  { id: 'labuan', label: 'Labuan', shortLabel: 'Labuan' },
  { id: 'putrajaya', label: 'Putrajaya', shortLabel: 'Putrajaya' },
] as const

export type TerritoryId = (typeof TERRITORIES)[number]['id']
export type ScopeId = TerritoryId | 'overall'

export type CategoryId = 'primary' | 'secondary' | 'kafa' | 'special'

export interface StageDefinition {
  id: string
  label: string
  shortLabel: string
  next?: string
}

export interface CategoryDefinition {
  id: CategoryId
  label: string
  shortLabel: string
  description: string
  stages: readonly StageDefinition[]
}

const primaryStages: StageDefinition[] = Array.from({ length: 6 }, (_, index) => ({
  id: `primary-d${index + 1}`,
  label: `Darjah ${index + 1}`,
  shortLabel: `D${index + 1}`,
  next: index < 5 ? `primary-d${index + 2}` : undefined,
}))

const kafaStages: StageDefinition[] = Array.from({ length: 6 }, (_, index) => ({
  id: `kafa-d${index + 1}`,
  label: `Darjah ${index + 1}`,
  shortLabel: `D${index + 1}`,
  next: index < 5 ? `kafa-d${index + 2}` : undefined,
}))

const specialStages: StageDefinition[] = Array.from({ length: 6 }, (_, index) => ({
  id: `special-d${index + 1}`,
  label: `Darjah ${index + 1}`,
  shortLabel: `D${index + 1}`,
  next: index < 5 ? `special-d${index + 2}` : undefined,
}))

const secondaryStages: StageDefinition[] = [
  { id: 'secondary-f1', label: 'Tingkatan 1', shortLabel: 'T1', next: 'secondary-f2' },
  { id: 'secondary-f2', label: 'Tingkatan 2', shortLabel: 'T2', next: 'secondary-f3' },
  { id: 'secondary-f3', label: 'Tingkatan 3', shortLabel: 'T3', next: 'secondary-f4' },
  { id: 'secondary-f4', label: 'Tingkatan 4', shortLabel: 'T4', next: 'secondary-f5' },
  { id: 'secondary-f5', label: 'Tingkatan 5', shortLabel: 'T5' },
  { id: 'secondary-l6', label: 'Tingkatan 6 Bawah', shortLabel: 'T6B', next: 'secondary-u6' },
  { id: 'secondary-u6', label: 'Tingkatan 6 Atas', shortLabel: 'T6A' },
]

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: 'primary',
    label: 'Sekolah Rendah',
    shortLabel: 'Rendah',
    description: 'Kohort bergerak dari Darjah 1 hingga Darjah 6.',
    stages: primaryStages,
  },
  {
    id: 'secondary',
    label: 'Sekolah Menengah',
    shortLabel: 'Menengah',
    description: 'Tingkatan 1–5 dan laluan berasingan Tingkatan 6 Bawah–Atas.',
    stages: secondaryStages,
  },
  {
    id: 'kafa',
    label: 'SRA KAFA',
    shortLabel: 'KAFA',
    description: 'Kohort KAFA bergerak dari Darjah 1 hingga Darjah 6.',
    stages: kafaStages,
  },
  {
    id: 'special',
    label: 'Kelas Khas',
    shortLabel: 'Khas',
    description: 'Kohort bergerak dari Darjah 1 hingga Darjah 6.',
    stages: specialStages,
  },
]

export const STAGES = CATEGORIES.flatMap((category) =>
  category.stages.map((stage) => ({ ...stage, categoryId: category.id })),
)

export type CountsByTerritory = Record<TerritoryId, Record<string, number>>
export type RatesByYear = Record<number, Record<string, number>>

export interface CalculatorProject {
  schemaVersion: 1
  reportName: string
  applicationYear: number
  counts: CountsByTerritory
  rates: RatesByYear
  updatedAt: string
}

export interface ProjectionCell {
  count: number
  allocation: number
}

export interface ProjectionYear {
  year: number
  territories: Record<TerritoryId, Record<string, ProjectionCell>>
  totalCount: number
  totalAllocation: number
}

export interface CategoryTotal {
  count: number
  allocation: number
}

export interface ProjectionResult {
  years: ProjectionYear[]
  originalApplicants: number
  cumulativeStudentYears: number
  totalAllocation: number
  byTerritory: Record<TerritoryId, CategoryTotal>
  byCategory: Record<CategoryId, CategoryTotal>
}
