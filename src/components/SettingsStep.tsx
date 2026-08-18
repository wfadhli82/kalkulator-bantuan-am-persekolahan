import { CalendarDays, Info, ShieldCheck } from 'lucide-react'
import type { CalculatorProject } from '../domain/model'

interface SettingsStepProps {
  project: CalculatorProject
  onNameChange: (name: string) => void
  onYearChange: (year: number) => void
}

export function SettingsStep({ project, onNameChange, onYearChange }: SettingsStepProps) {
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
        <label className="form-field" htmlFor="report-name">
          <span>Nama laporan</span>
          <input
            id="report-name"
            type="text"
            maxLength={120}
            value={project.reportName}
            onChange={(event) => onNameChange(event.target.value)}
          />
          <small>Nama ini akan dipaparkan dalam laporan Excel.</small>
        </label>

        <label className="form-field" htmlFor="application-year">
          <span>Tahun permohonan</span>
          <input
            id="application-year"
            type="number"
            min="2020"
            max="2100"
            inputMode="numeric"
            value={project.applicationYear}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isInteger(value) && value >= 2020 && value <= 2100) onYearChange(value)
            }}
          />
          <small>Tahun yang dibenarkan: 2020 hingga 2100.</small>
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
