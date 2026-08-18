import { BarChart3, CircleDollarSign, ClipboardList, Settings2 } from 'lucide-react'

export const STEPS = [
  { id: 1, label: 'Tetapan', shortLabel: 'Tetapan', Icon: Settings2 },
  { id: 2, label: 'Bilangan Pelajar', shortLabel: 'Pelajar', Icon: ClipboardList },
  { id: 3, label: 'Kadar Bantuan', shortLabel: 'Kadar', Icon: CircleDollarSign },
  { id: 4, label: 'Keputusan', shortLabel: 'Keputusan', Icon: BarChart3 },
] as const

interface StepNavigationProps {
  currentStep: number
  onStepChange: (step: number) => void
}

export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <nav className="step-nav" aria-label="Langkah kalkulator">
      {STEPS.map(({ id, label, shortLabel, Icon }) => (
        <button
          key={id}
          type="button"
          className={`step-nav__item ${currentStep === id ? 'is-active' : ''} ${currentStep > id ? 'is-complete' : ''}`}
          aria-current={currentStep === id ? 'step' : undefined}
          onClick={() => onStepChange(id)}
        >
          <span className="step-nav__number">{currentStep > id ? '✓' : id}</span>
          <Icon size={18} aria-hidden="true" />
          <span className="step-nav__label"><span className="desktop-only">{label}</span><span className="mobile-only">{shortLabel}</span></span>
        </button>
      ))}
    </nav>
  )
}
