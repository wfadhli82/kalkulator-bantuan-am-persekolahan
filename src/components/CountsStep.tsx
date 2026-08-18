import { MapPin, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORIES, STAGES, TERRITORIES, type CalculatorProject, type TerritoryId } from '../domain/model'
import { formatNumber } from '../domain/format'
import { NumberInput } from './NumberInput'

interface CountsStepProps {
  project: CalculatorProject
  onCountChange: (territory: TerritoryId, stageId: string, value: number) => void
}

export function CountsStep({ project, onCountChange }: CountsStepProps) {
  const [activeTerritory, setActiveTerritory] = useState<TerritoryId>('kl')
  const territory = TERRITORIES.find((item) => item.id === activeTerritory)!
  const territoryTotal = useMemo(
    () => STAGES.reduce((sum, stage) => sum + (project.counts[activeTerritory][stage.id] ?? 0), 0),
    [activeTerritory, project.counts],
  )

  return (
    <section className="step-panel" aria-labelledby="counts-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Langkah 2 daripada 4</span>
          <h2 id="counts-heading">Masukkan bilangan pelajar</h2>
          <p>Isi bilangan pelajar pada tahap semasa bagi tahun {project.applicationYear}. Ruang kosong dianggap sifar.</p>
        </div>
        <Users className="section-heading__icon" aria-hidden="true" />
      </div>

      <div className="scope-tabs" role="tablist" aria-label="Wilayah Persekutuan">
        {TERRITORIES.map((item) => {
          const total = STAGES.reduce((sum, stage) => sum + (project.counts[item.id][stage.id] ?? 0), 0)
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTerritory === item.id}
              className={activeTerritory === item.id ? 'is-active' : ''}
              onClick={() => setActiveTerritory(item.id)}
            >
              <MapPin size={16} aria-hidden="true" />
              <span>{item.label}</span>
              <span className="tab-count">{formatNumber(total)}</span>
            </button>
          )
        })}
      </div>

      <div className="territory-summary">
        <span>Jumlah pemohon asal — {territory.label}</span>
        <strong>{formatNumber(territoryTotal)} pelajar</strong>
      </div>

      <div className="category-stack">
        {CATEGORIES.map((category) => (
          <article className="category-card" key={category.id}>
            <div className="category-card__header">
              <div>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </div>
              <span className="category-total">
                {formatNumber(category.stages.reduce((sum, stage) => sum + (project.counts[activeTerritory][stage.id] ?? 0), 0))}
              </span>
            </div>
            <div className="input-grid">
              {category.stages.map((stage) => (
                <NumberInput
                  key={stage.id}
                  id={`${activeTerritory}-${stage.id}`}
                  label={stage.label}
                  value={project.counts[activeTerritory][stage.id] ?? 0}
                  onChange={(value) => onCountChange(activeTerritory, stage.id, value)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
