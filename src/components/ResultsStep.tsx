import { BarChart3, CalendarRange, Coins, MapPinned, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { totalsForScope } from '../domain/calculator'
import { formatCurrency, formatNumber } from '../domain/format'
import { CATEGORIES, TERRITORIES, type CalculatorProject, type ProjectionResult, type ScopeId } from '../domain/model'

interface ResultsStepProps {
  project: CalculatorProject
  result: ProjectionResult
}

export function ResultsStep({ project, result }: ResultsStepProps) {
  const [scope, setScope] = useState<ScopeId>('overall')
  const scoped = useMemo(() => totalsForScope(project, result, scope), [project, result, scope])
  const maxAllocation = Math.max(1, ...scoped.years.map((year) => year.allocation))
  const scopeLabel = scope === 'overall' ? 'Keseluruhan WP' : TERRITORIES.find((item) => item.id === scope)?.label

  return (
    <section className="step-panel" aria-labelledby="results-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Langkah 4 daripada 4</span>
          <h2 id="results-heading">Keputusan unjuran</h2>
          <p>Semua angka dikira daripada input tahun {project.applicationYear} dan kadar tahunan yang ditetapkan.</p>
        </div>
        <BarChart3 className="section-heading__icon" aria-hidden="true" />
      </div>

      <div className="scope-tabs scope-tabs--results" role="tablist" aria-label="Skop keputusan">
        <button type="button" role="tab" aria-selected={scope === 'overall'} className={scope === 'overall' ? 'is-active' : ''} onClick={() => setScope('overall')}>
          <MapPinned size={16} aria-hidden="true" /> Keseluruhan
        </button>
        {TERRITORIES.map((territory) => (
          <button key={territory.id} type="button" role="tab" aria-selected={scope === territory.id} className={scope === territory.id ? 'is-active' : ''} onClick={() => setScope(territory.id)}>
            {territory.label}
          </button>
        ))}
      </div>

      <div className="result-context">
        <span>Skop semasa</span>
        <strong>{scopeLabel}</strong>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <UsersRound aria-hidden="true" />
          <span>Pemohon asal</span>
          <strong>{formatNumber(scoped.originalApplicants)}</strong>
          <small>Pelajar unik pada tahun permohonan</small>
        </article>
        <article className="kpi-card">
          <CalendarRange aria-hidden="true" />
          <span>Kumulatif tahun-pelajar</span>
          <strong>{formatNumber(scoped.cumulativeStudentYears)}</strong>
          <small>Jumlah penerima aktif bagi semua tahun</small>
        </article>
        <article className="kpi-card kpi-card--featured">
          <Coins aria-hidden="true" />
          <span>Jumlah peruntukan</span>
          <strong>{formatCurrency(scoped.totalAllocation)}</strong>
          <small>Komitmen keseluruhan hingga kohort tamat</small>
        </article>
      </div>

      <div className="result-grid">
        <article className="report-card">
          <div className="report-card__heading">
            <div><h3>Peruntukan mengikut tahun</h3><p>Perbandingan komitmen tahunan</p></div>
          </div>
          <div className="bar-chart" aria-label="Carta peruntukan mengikut tahun">
            {scoped.years.map((year) => (
              <div className="bar-chart__row" key={year.year}>
                <span>{year.year}</span>
                <div className="bar-chart__track">
                  <div className="bar-chart__bar" style={{ width: `${(year.allocation / maxAllocation) * 100}%` }} />
                </div>
                <strong>{formatCurrency(year.allocation)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="report-card">
          <div className="report-card__heading">
            <div><h3>Pecahan kategori</h3><p>Jumlah sepanjang tempoh kelulusan</p></div>
          </div>
          <div className="category-results">
            {CATEGORIES.map((category) => {
              const total = scoped.byCategory[category.id]
              return (
                <div key={category.id}>
                  <span>{category.label}</span>
                  <strong>{formatCurrency(total.allocation)}</strong>
                  <small>{formatNumber(total.count)} tahun-pelajar</small>
                </div>
              )
            })}
          </div>
        </article>
      </div>

      <article className="report-card annual-table-card">
        <div className="report-card__heading">
          <div><h3>Ringkasan tahunan</h3><p>Bilangan penerima aktif dan jumlah peruntukan</p></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Tahun</th><th>Pelajar aktif</th><th>Peruntukan</th></tr></thead>
            <tbody>
              {scoped.years.map((year) => (
                <tr key={year.year}><td>{year.year}</td><td>{formatNumber(year.count)}</td><td>{formatCurrency(year.allocation)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><th>Jumlah</th><th>{formatNumber(scoped.cumulativeStudentYears)}</th><th>{formatCurrency(scoped.totalAllocation)}</th></tr></tfoot>
          </table>
        </div>
      </article>
    </section>
  )
}
