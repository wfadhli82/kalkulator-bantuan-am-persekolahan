import { ChevronLeft, ChevronRight, CloudOff, Download, FileJson, FilePlus2, GraduationCap, HardDriveDownload, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CountsStep } from './components/CountsStep'
import { RatesStep } from './components/RatesStep'
import { ResultsStep } from './components/ResultsStep'
import { SettingsStep } from './components/SettingsStep'
import { STEPS, StepNavigation } from './components/StepNavigation'
import { calculateProjection } from './domain/calculator'
import { createDefaultRates, createNewProject, resetRates } from './domain/defaults'
import type { CalculatorProject, TerritoryId } from './domain/model'
import { downloadExcelReport } from './export/excelReport'
import { clearSavedProject, downloadJsonBackup, loadProject, readJsonBackup, saveProject } from './storage/projectStore'

function nowUpdated(project: CalculatorProject): CalculatorProject {
  return { ...project, updatedAt: new Date().toISOString() }
}

export default function App() {
  const [project, setProject] = useState<CalculatorProject>(() => loadProject())
  const [currentStep, setCurrentStep] = useState(1)
  const [notice, setNotice] = useState('Draf disimpan pada peranti ini')
  const [isExporting, setIsExporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)
  const result = useMemo(() => calculateProjection(project), [project])

  useEffect(() => {
    saveProject(project)
    const timer = window.setTimeout(() => setNotice('Draf disimpan pada peranti ini'), 350)
    return () => window.clearTimeout(timer)
  }, [project])

  const updateProject = (updater: (current: CalculatorProject) => CalculatorProject) => {
    setNotice('Menyimpan perubahan…')
    setProject((current) => nowUpdated(updater(current)))
  }

  const handleYearChange = (year: number) => {
    updateProject((current) => ({
      ...current,
      applicationYear: year,
      rates: createDefaultRates(year),
    }))
    setNotice('Tahun dan kadar lalai telah dikemas kini')
  }

  const handleNewProject = () => {
    if (!window.confirm('Mulakan projek baharu? Draf semasa akan digantikan. Muat turun sandaran JSON terlebih dahulu jika perlu.')) return
    clearSavedProject()
    setProject(createNewProject())
    setCurrentStep(1)
    setNotice('Projek baharu telah dibuka')
  }

  const handleImport = async (file?: File) => {
    if (!file) return
    try {
      const imported = await readJsonBackup(file)
      setProject(imported)
      setCurrentStep(1)
      setNotice('Sandaran berjaya diimport')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Fail sandaran tidak dapat dibaca.')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const handleExcelExport = async () => {
    setIsExporting(true)
    setNotice('Menyediakan laporan Excel…')
    try {
      await downloadExcelReport(project)
      setNotice('Laporan Excel berjaya dimuat turun')
    } catch {
      window.alert('Laporan Excel tidak dapat dijana. Sila cuba sekali lagi.')
      setNotice('Eksport Excel tidak berjaya')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <div className="brand__mark"><GraduationCap aria-hidden="true" /></div>
            <div><span>Kalkulator Bantuan</span><strong>Am Persekolahan</strong></div>
          </div>
          <div className="header-actions">
            <span className="save-status"><HardDriveDownload size={16} aria-hidden="true" /> {notice}</span>
            <button className="icon-button" type="button" title="Reset Data" aria-label="Reset Data" onClick={handleNewProject}><FilePlus2 aria-hidden="true" /></button>
            <button className="icon-button" type="button" title="Muat turun sandaran JSON" onClick={() => downloadJsonBackup(project)}><FileJson aria-hidden="true" /></button>
            <button className="icon-button" type="button" title="Import sandaran JSON" onClick={() => importInputRef.current?.click()}><Upload aria-hidden="true" /></button>
            <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => void handleImport(event.target.files?.[0])} />
          </div>
        </div>
      </header>

      <main>
        <div className="hero">
          <div>
            <span className="hero__tag"><CloudOff size={15} aria-hidden="true" /> Tiada data peribadi · Boleh digunakan luar talian</span>
            <h1>Prototaip Kalkulator Bantuan Am Persekolahan</h1>
            <p>Memudahkan pengiraan unjuran pelajar dan peruntukan</p>
          </div>
          <div className="hero__year"><span>Tahun permohonan</span><strong>{project.applicationYear}</strong></div>
        </div>

        <StepNavigation currentStep={currentStep} onStepChange={setCurrentStep} />

        <div className="content-card">
          {currentStep === 1 ? (
            <SettingsStep
              project={project}
              onYearChange={handleYearChange}
            />
          ) : null}
          {currentStep === 2 ? (
            <CountsStep
              project={project}
              onCountChange={(territory: TerritoryId, stageId, value) => updateProject((current) => ({
                ...current,
                counts: {
                  ...current.counts,
                  [territory]: { ...current.counts[territory], [stageId]: value },
                },
              }))}
            />
          ) : null}
          {currentStep === 3 ? (
            <RatesStep
              project={project}
              onRateChange={(year, stageId, value) => updateProject((current) => ({
                ...current,
                rates: { ...current.rates, [year]: { ...current.rates[year], [stageId]: value } },
              }))}
              onCopyYearRates={(sourceYear) => updateProject((current) => ({
                ...current,
                rates: Object.fromEntries(Object.keys(current.rates).map((year) => [Number(year), { ...current.rates[sourceYear] }])),
              }))}
              onResetRates={() => updateProject((current) => resetRates(current))}
            />
          ) : null}
          {currentStep === 4 ? <ResultsStep project={project} result={result} /> : null}

          <div className="step-actions">
            <button className="button button--secondary" type="button" disabled={currentStep === 1} onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}>
              <ChevronLeft size={18} aria-hidden="true" /> Sebelumnya
            </button>
            {currentStep < STEPS.length ? (
              <button className="button button--primary" type="button" onClick={() => setCurrentStep((step) => Math.min(STEPS.length, step + 1))}>
                Seterusnya <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button className="button button--primary button--download" type="button" disabled={isExporting} onClick={() => void handleExcelExport()}>
                <Download size={18} aria-hidden="true" /> {isExporting ? 'Menjana Excel…' : 'Muat Turun Laporan Excel'}
              </button>
            )}
          </div>
        </div>
      </main>

      <footer>
        <p>Kalkulator ini ialah alat sokongan pengiraan. Semak kadar dan angka sebelum laporan digunakan untuk keputusan rasmi.</p>
      </footer>
    </div>
  )
}
