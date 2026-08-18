import { CalendarDays, Info, ShieldCheck } from 'lucide-react'
import { MAX_APPLICATION_YEAR, MIN_APPLICATION_YEAR } from '../domain/defaults'
import type { CalculatorProject } from '../domain/model'

interface SettingsStepProps {
  project: CalculatorProject
  onYearChange: (year: number) => void
}

const APPLICATION_YEARS = Array.from(
  { length: MAX_APPLICATION_YEAR - MIN_APPLICATION_YEAR + 1 },
  (_, index) => MIN_APPLICATION_YEAR + index,
)

export function SettingsStep({ project, onYearChange }: SettingsStepProps) {
  return (
    <section className="step-panel" aria-labelledby="settings-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Langkah 1 daripada 4</span>
          <h2 id="settings-heading">Tetapkan laporan</h2>
          <p>Pilih tahun permohonan. Semua unjuran akan bermula daripada tahun ini.</p>
        </div>
        <CalendarDays className="section-heading__icon" aria-hidden="true" />
      </div>

      <div className="settings-grid">
        <label className="form-field" htmlFor="application-year">
          <span>Tahun permohonan</span>
          <select
            id="application-year"
            value={project.applicationYear}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {APPLICATION_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <small>Pilih tahun antara {MIN_APPLICATION_YEAR} hingga {MAX_APPLICATION_YEAR}.</small>
        </label>
      </div>

      <div className="info-grid">
        <article className="info-card info-card--teal">
          <Info size={22} aria-hidden="true" />
          <div>
            <strong>Pergerakan kohort automatik</strong>
            <p>Contoh: Tingkatan 2 pada {project.applicationYear} dikira hingga Tingkatan 5 pada {project.applicationYear + 3} sahaja.</p>
          </div>
        </article>
        <article className="info-card">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <strong>Data kekal pada peranti</strong>
            <p>Tiada nama, nombor pengenalan atau data peribadi dihantar ke pelayan.</p>
          </div>
        </article>
      </div>
    </section>
  )
}
