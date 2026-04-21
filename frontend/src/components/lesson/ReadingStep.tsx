// components/lesson/ReadingStep.tsx
// ====================================
// Étape 1 : Lecture du texte anglais.
// L'utilisateur peut afficher/cacher la traduction française paragraphe par paragraphe
// ou en un seul clic pour tout le texte.

import { useState } from 'react'
import type { Lesson } from '../../types'
import ClickableText from './ClickableText'
import './ReadingStep.css'

interface ReadingStepProps {
  lesson: Lesson
  onComplete: () => void
  onWordTranslated?: (word: string, translation: string) => void
}

export default function ReadingStep({ lesson, onComplete, onWordTranslated }: ReadingStepProps) {
  // Peut afficher la trad de chaque paragraphe indépendamment
  const [showAllFr, setShowAllFr] = useState(false)
  const [revealedParagraphs, setRevealedParagraphs] = useState<Set<number>>(new Set())

  const { paragraphs } = lesson.content
  const isDialogue = lesson.type === 'dialogue'

  const toggleParagraph = (idx: number) => {
    setRevealedParagraphs(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const isVisible = (idx: number) => showAllFr || revealedParagraphs.has(idx)

  return (
    <div className="reading-step animate-in">

      {/* En-tête */}
      <div className="reading-header">
        <div className="reading-meta">
          <span className={`level-badge level-${lesson.level.toLowerCase().replace('+','p')}`}>
            {lesson.level}
          </span>
          <span className={`type-badge type-${lesson.type}`}>
            {isDialogue ? '💬 Dialogue' : '📖 Story'}
          </span>
          <span className="reading-time">⏱ {lesson.reading_time}</span>
          <span className="reading-theme">· {lesson.theme}</span>
        </div>
        <h1 className="reading-title">{lesson.title}</h1>
      </div>

      {/* Contrôle global de la traduction */}
      <div className="reading-controls">
        <button
          className={`btn ${showAllFr ? 'btn-ghost active-fr' : 'btn-ghost'}`}
          onClick={() => {
            setShowAllFr(!showAllFr)
            if (!showAllFr) setRevealedParagraphs(new Set())
          }}
        >
          <span>{showAllFr ? '🙈' : '🇫🇷'}</span>
          {showAllFr ? 'Cacher la traduction' : 'Afficher la traduction'}
        </button>
        <p className="reading-hint">
          Ou cliquez sur 🇫🇷 à côté de chaque paragraphe pour le révéler individuellement.
        </p>
      </div>

      {/* Corps du texte */}
      <div className="reading-body">
        {paragraphs.map((para, idx) => (
          <div key={idx} className={`para-block ${isDialogue ? 'dialogue' : ''}`}>

            {/* Pour les dialogues : label du locuteur */}
            {isDialogue && para.speaker && (
              <div className="speaker-label">{para.speaker}</div>
            )}

            {/* Ligne EN + bouton trad individuel */}
            <div className="para-row">
              <ClickableText text={para.en} className="lesson-text" onWordTranslated={onWordTranslated} />
              <button
                className={`para-fr-toggle ${isVisible(idx) ? 'revealed' : ''}`}
                onClick={() => !showAllFr && toggleParagraph(idx)}
                disabled={showAllFr}
                title={isVisible(idx) ? 'Cacher la traduction' : 'Voir la traduction'}
              >
                <span className="fr-label">FR</span>
              </button>
            </div>

            {/* Traduction française — affichée si toggle actif */}
            {isVisible(idx) && (
              <div className="para-translation animate-in">
                <p className="lesson-text-fr">{para.fr}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton "Étape suivante" */}
      <div className="step-footer">
        <p className="step-footer-hint">
          Pris le temps de bien lire ? Passez à l'analyse linguistique.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onComplete}>
          Points de langue →
        </button>
      </div>
    </div>
  )
}
