import { CircleDollarSign, Copy, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, type CalculatorProject } from '../domain/model'
import { NumberInput } from './NumberInput'

interface RatesStepProps {
  project: CalculatorProject
  onRateChange: (year: number, stageId: string, value: number) => void
  onCopyYearRates: (sourceYear: number) => void
  onResetRates: () => void
}

export function RatesStep({ project, onRateChange, onCopyYearRates, onResetRates }: RatesStepProps) {
  const years = Object.keys(project.rates).map(Number).sort((a, b) => a - b)
  const [selectedYear, setSelectedYear] = useState(project.applicationYear)
  const activeYear = years.includes(selectedYear) ? selectedYear : project.applicationYear

  return (
    <section className="step-panel" aria-labelledby="rates-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Langkah 3 daripada 4</span>
          <h2 id="rates-heading">Semak kadar bantuan</h2>
          <p>Kadar sama digunakan untuk semua WP. Pilih tahun untuk membuat pindaan.</p>
        </div>
        <CircleDollarSign className="section-heading__icon" aria-hidden="true" />
      </div>

      <div className="rate-toolbar">
        <label className="compact-field" htmlFor="rate-year">
          <span>Tahun kadar</span>
          <select id="rate-year" value={activeYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <div className="button-row">
          <button className="button button--secondary" type="button" onClick={() => onCopyYearRates(activeYear)}>
            <Copy size={17} aria-hidden="true" /> Salin ke semua tahun
          </button>
          <button className="button button--ghost" type="button" onClick={onResetRates}>
            <RotateCcw size={17} aria-hidden="true" /> Pulihkan kadar asal
          </button>
        </div>
      </div>

      <div className="rate-note">
        <strong>Kadar bagi tahun {activeYear}</strong>
        <span>Perubahan disimpan automatik dan digunakan terus dalam keputusan.</span>
      </div>

      <div className="category-stack">
        {CATEGORIES.map((category) => (
          <article className="category-card" key={category.id}>
            <div className="category-card__header">
              <div>
                <h3>{category.label}</h3>
                <p>Kadar bagi setiap pelajar pada tahap berkenaan.</p>
              </div>
            </div>
            <div className="input-grid">
              {category.stages.map((stage) => (
                <NumberInput
                  key={stage.id}
                  id={`rate-${activeYear}-${stage.id}`}
                  label={stage.label}
                  value={project.rates[activeYear]?.[stage.id] ?? 0}
                  currency
                  onChange={(value) => onRateChange(activeYear, stage.id, value)}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
