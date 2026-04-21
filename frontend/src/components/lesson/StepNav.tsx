// components/lesson/StepNav.tsx
// ================================
// Barre de navigation des 5 étapes d'une leçon.
// Affiche l'étape courante, les étapes passées (cliquables), et les suivantes (grisées).

import type { LessonStep } from '../../types'
import { STEP_LABELS, STEP_ICONS } from '../../types'
import './StepNav.css'

interface StepNavProps {
  currentStep: LessonStep
  maxReachedStep: LessonStep  // étape max atteinte (pour autoriser la navigation en arrière)
  onStepClick: (step: LessonStep) => void
}

const STEPS: LessonStep[] = [1, 2, 3, 4, 5]

export default function StepNav({ currentStep, maxReachedStep, onStepClick }: StepNavProps) {
  return (
    <nav className="step-nav">
      <div className="step-nav-inner">
        {STEPS.map((step, i) => {
          const isActive   = step === currentStep
          const isReached  = step <= maxReachedStep
          const isComplete = step < currentStep

          return (
            <button
              key={step}
              className={`step-btn ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''} ${!isReached ? 'locked' : ''}`}
              onClick={() => isReached && onStepClick(step)}
              disabled={!isReached}
              title={STEP_LABELS[step]}
            >
              {/* Trait de connexion entre étapes */}
              {i > 0 && (
                <div className={`step-connector ${isReached ? 'reached' : ''}`} />
              )}

              <div className="step-circle">
                {isComplete
                  ? <span className="step-check">✓</span>
                  : <span className="step-icon">{STEP_ICONS[step]}</span>
                }
              </div>

              <div className="step-label">
                <span className="step-num">Étape {step}</span>
                <span className="step-name">{STEP_LABELS[step]}</span>
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
