// components/lesson/SpeakStep.tsx
// ==================================
// Étape 4 : Expression orale.
// L'utilisateur lit chaque paragraphe à voix haute, enregistre, se réécoute,
// puis peut consulter les conseils phonétiques.

import { useState } from 'react'
import type { Lesson } from '../../types'
import { useRecorder } from '../../hooks/useRecorder'
import './SpeakStep.css'

interface SpeakStepProps {
  lesson: Lesson
  onComplete: () => void
}

export default function SpeakStep({ lesson, onComplete }: SpeakStepProps) {
  // Paragraphe actuellement sélectionné pour la lecture
  const [selectedPara, setSelectedPara] = useState(0)

  // Conseils phonétiques visibles ou non
  const [showTips, setShowTips] = useState(false)

  // Mode : 'read' (lecture libre) ou 'oral_exercise' (exercice guidé)
  const [mode, setMode] = useState<'read' | 'exercise'>('read')

  const recorder = useRecorder()
  const { paragraphs } = lesson.content

  // Quelques conseils phonétiques généraux pour le niveau B2-C1
  const generalTips = [
    "L'anglais est une langue à accentuation de contenu : les noms, verbes principaux et adjectifs portent le stress, les mots grammaticaux sont souvent réduits.",
    "Le schwa /ə/ est le son le plus fréquent en anglais. Ex : 'about' = /əˈbaʊt/, 'the' = /ðə/",
    "Les liaisons (linking) : en anglais, les mots s'enchaînent. 'Turn it off' → 'tur-ni-toff'",
    "Les consonnes finales sont généralement prononcées : 'fixed' = /fɪkst/, 'helped' = /helpt/",
  ]

  return (
    <div className="speak-step animate-in">

      <div className="speak-header">
        <h2>Expression orale</h2>
        <p className="speak-subtitle">
          Lisez le texte à voix haute, enregistrez-vous, puis rééécoutez pour comparer avec la version audio.
        </p>
      </div>

      {/* Sélecteur de mode */}
      <div className="speak-modes">
        <button
          className={`mode-btn ${mode === 'read' ? 'active' : ''}`}
          onClick={() => setMode('read')}
        >
          📖 Lecture libre
        </button>
        <button
          className={`mode-btn ${mode === 'exercise' ? 'active' : ''}`}
          onClick={() => setMode('exercise')}
        >
          🎤 Exercices guidés
        </button>
      </div>

      {/* ─── Mode lecture libre ────────────────────────────── */}
      {mode === 'read' && (
        <div className="speak-read-mode">

          {/* Sélecteur de paragraphe */}
          <div className="para-selector">
            <span className="para-selector-label">Choisissez un paragraphe :</span>
            <div className="para-selector-btns">
              {paragraphs.map((_, i) => (
                <button
                  key={i}
                  className={`para-sel-btn ${selectedPara === i ? 'active' : ''}`}
                  onClick={() => { setSelectedPara(i); recorder.clearRecording() }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Paragraphe sélectionné */}
          <div className="speak-text-card card">
            {paragraphs[selectedPara].speaker && (
              <div className="speaker-label">{paragraphs[selectedPara].speaker}</div>
            )}
            <p className="lesson-text speak-text">{paragraphs[selectedPara].en}</p>
          </div>

          {/* Conseils phonétiques */}
          <button
            className="btn btn-ghost tips-toggle"
            onClick={() => setShowTips(!showTips)}
          >
            {showTips ? '▲' : '▼'} Conseils phonétiques généraux
          </button>

          {showTips && (
            <div className="phono-tips card animate-in">
              <h3 className="tips-title">🗣 Conseils pour un accent naturel</h3>
              <ul className="tips-list">
                {generalTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Zone d'enregistrement */}
          <RecorderPanel recorder={recorder} />

          {/* Navigation entre paragraphes */}
          <div className="para-nav">
            <button
              className="btn btn-ghost"
              onClick={() => { setSelectedPara(Math.max(0, selectedPara - 1)); recorder.clearRecording() }}
              disabled={selectedPara === 0}
            >
              ← Précédent
            </button>
            <span className="para-nav-count">{selectedPara + 1} / {paragraphs.length}</span>
            <button
              className="btn btn-ghost"
              onClick={() => { setSelectedPara(Math.min(paragraphs.length - 1, selectedPara + 1)); recorder.clearRecording() }}
              disabled={selectedPara === paragraphs.length - 1}
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* ─── Mode exercices guidés ─────────────────────────── */}
      {mode === 'exercise' && (
        <OralExercises lesson={lesson} />
      )}

      {/* Footer */}
      <div className="step-footer">
        <p className="step-footer-hint">
          Entraîné votre prononciation ? Passez aux exercices écrits et oraux.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onComplete}>
          Exercices →
        </button>
      </div>
    </div>
  )
}

// ─── Composant : panneau d'enregistrement ──────────────────────
interface RecorderPanelProps {
  recorder: ReturnType<typeof useRecorder>
}

function RecorderPanel({ recorder }: RecorderPanelProps) {
  const { state, duration, startRecording, stopRecording, playRecording, stopPlayback, clearRecording, errorMessage } = recorder

  return (
    <div className="recorder-panel card">
      <div className="recorder-status">
        {state === 'idle'      && <span className="rec-state idle">Prêt à enregistrer</span>}
        {state === 'recording' && <span className="rec-state recording animate-pulse">● Enregistrement… {duration}s</span>}
        {state === 'recorded'  && <span className="rec-state recorded">✓ Enregistrement terminé ({duration}s)</span>}
        {state === 'playing'   && <span className="rec-state playing animate-pulse">▶ Lecture…</span>}
        {state === 'error'     && <span className="rec-state error">{errorMessage}</span>}
      </div>

      <div className="recorder-btns">
        {(state === 'idle' || state === 'error') && (
          <button className="btn btn-primary rec-btn" onClick={startRecording}>
            🎤 Enregistrer
          </button>
        )}
        {state === 'recording' && (
          <button className="btn btn-danger rec-btn" onClick={stopRecording}>
            ⏹ Arrêter
          </button>
        )}
        {state === 'recorded' && (
          <>
            <button className="btn btn-teal rec-btn" onClick={playRecording}>
              ▶ Réécouter
            </button>
            <button className="btn btn-ghost" onClick={clearRecording}>
              🗑 Supprimer
            </button>
          </>
        )}
        {state === 'playing' && (
          <button className="btn btn-ghost" onClick={stopPlayback}>
            ⏹ Arrêter la lecture
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Composant : exercices oraux guidés ────────────────────────
function OralExercises({ lesson }: { lesson: Lesson }) {
  const [currentEx, setCurrentEx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const recorder = useRecorder()

  const exercises = lesson.exercises.oral
  if (!exercises.length) return <p style={{ color: 'var(--text-muted)' }}>Aucun exercice oral pour cette leçon.</p>

  const ex = exercises[currentEx]

  return (
    <div className="oral-exercises">
      {/* Barre de progression des exercices */}
      <div className="oral-ex-progress">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`oral-dot ${i === currentEx ? 'active' : ''} ${i < currentEx ? 'done' : ''}`}
            onClick={() => { setCurrentEx(i); setShowAnswer(false); recorder.clearRecording() }}
          />
        ))}
      </div>

      <div className="oral-ex-card card">
        {/* Type d'exercice */}
        <div className="oral-ex-type">
          {ex.type === 'read_aloud' ? '📢 Lisez à voix haute' : '🗣 Répondez à la question'}
          <span className="oral-ex-num">{currentEx + 1}/{exercises.length}</span>
        </div>

        {/* Texte à lire ou question */}
        {ex.type === 'read_aloud' && ex.text && (
          <div className="oral-ex-text card">
            {ex.instruction && <p className="oral-ex-instruction">{ex.instruction}</p>}
            <p className="lesson-text">{ex.text}</p>
            {ex.focus && (
              <p className="oral-ex-focus">💡 Focus : {ex.focus}</p>
            )}
          </div>
        )}

        {ex.type === 'answer_question' && ex.question && (
          <div className="oral-ex-question">
            <div className="oral-q-label">Question :</div>
            <p className="oral-q-text">"{ex.question}"</p>
            {ex.duration_seconds && (
              <p className="oral-q-duration">⏱ Objectif : ~{ex.duration_seconds}s</p>
            )}
          </div>
        )}

        {/* Conseils phonétiques si disponibles */}
        {ex.phonetic_tips && ex.phonetic_tips.length > 0 && (
          <div className="oral-phonetic-tips">
            <span className="tips-mini-label">Phonétique :</span>
            {ex.phonetic_tips.map((tip, i) => (
              <span key={i} className="phonetic">{tip}</span>
            ))}
          </div>
        )}

        {/* Hints vocabulaire */}
        {ex.vocabulary_hints && ex.vocabulary_hints.length > 0 && (
          <div className="oral-vocab-hints">
            <span className="tips-mini-label">Vocabulaire utile :</span>
            <div className="hint-tags">
              {ex.vocabulary_hints.map((h, i) => (
                <span key={i} className="hint-tag">{h}</span>
              ))}
            </div>
          </div>
        )}

        {/* Enregistreur */}
        <RecorderPanel recorder={recorder} />

        {/* Réponse suggérée */}
        <div className="oral-suggested">
          <button
            className="btn btn-ghost suggested-btn"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            {showAnswer ? '▲ Cacher la réponse suggérée' : '▼ Voir la réponse suggérée'}
          </button>
          {showAnswer && ex.suggested_answer && (
            <div className="suggested-answer card animate-in">
              <div className="suggested-label">Exemple de réponse :</div>
              <p className="lesson-text">{ex.suggested_answer}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="oral-ex-nav">
          <button
            className="btn btn-ghost"
            disabled={currentEx === 0}
            onClick={() => { setCurrentEx(currentEx - 1); setShowAnswer(false); recorder.clearRecording() }}
          >
            ← Précédent
          </button>
          <button
            className="btn btn-ghost"
            disabled={currentEx === exercises.length - 1}
            onClick={() => { setCurrentEx(currentEx + 1); setShowAnswer(false); recorder.clearRecording() }}
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  )
}
