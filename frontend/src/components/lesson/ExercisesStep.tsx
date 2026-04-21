// components/lesson/ExercisesStep.tsx
// ======================================
// Étape 5 : Exercices écrits et oraux avec score et correction.
// Exercices écrits : QCM, lacunes, traduction
// Exercices oraux  : géré dans SpeakStep (réutilisé ici via onglet)

import { useState } from 'react'
import type { Lesson, WrittenExercise } from '../../types'
import { api } from '../../api/client'
import './ExercisesStep.css'

interface ExercisesStepProps {
  lesson: Lesson
  onComplete: (score: number) => void
}

type ExerciseState = 'unanswered' | 'correct' | 'wrong' | 'revealed'

interface ExerciseResult {
  state: ExerciseState
  userAnswer: string
}

export default function ExercisesStep({ lesson, onComplete }: ExercisesStepProps) {
  const written = lesson.exercises.written

  // État de chaque exercice écrit
  const [results, setResults] = useState<Record<string, ExerciseResult>>({})
  const [fillInputs, setFillInputs] = useState<Record<string, string>>({})
  const [translInputs, setTranslInputs] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  // ─── QCM : l'utilisateur clique sur une réponse ────────────
  function handleMCQ(ex: WrittenExercise, optionIdx: number) {
    if (results[ex.id]) return  // déjà répondu
    const isCorrect = optionIdx === ex.answer
    setResults(prev => ({
      ...prev,
      [ex.id]: { state: isCorrect ? 'correct' : 'wrong', userAnswer: String(optionIdx) }
    }))
    api.recordExercise(lesson.id, {
      exercise_id: ex.id,
      exercise_type: 'multiple_choice',
      is_correct: isCorrect,
      user_answer: String(optionIdx),
    }).catch(() => {})
  }

  // ─── Lacune : l'utilisateur valide sa réponse ──────────────
  function handleFillBlank(ex: WrittenExercise) {
    const val = (fillInputs[ex.id] || '').trim().toLowerCase()
    const correctAnswers = [
      ...(Array.isArray(ex.answer) ? ex.answer : [ex.answer]),
      ...(ex.alternatives || []),
    ].map(a => String(a).toLowerCase())
    const isCorrect = correctAnswers.some(a => val === a || val.includes(a))
    setResults(prev => ({
      ...prev,
      [ex.id]: { state: isCorrect ? 'correct' : 'wrong', userAnswer: fillInputs[ex.id] || '' }
    }))
    api.recordExercise(lesson.id, {
      exercise_id: ex.id,
      exercise_type: 'fill_blank',
      is_correct: isCorrect,
      user_answer: fillInputs[ex.id] || '',
    }).catch(() => {})
  }

  // ─── Traduction : vérifie les mots-clés puis affiche la réponse suggérée
  function handleTranslation(ex: WrittenExercise) {
    const val = (translInputs[ex.id] || '').trim().toLowerCase()
    const keywords = (ex.key_vocabulary || []).map(k => k.toLowerCase())
    const matchCount = keywords.filter(k => val.includes(k)).length
    const isCorrect = keywords.length > 0 ? matchCount >= Math.ceil(keywords.length * 0.6) : val.length > 0
    setResults(prev => ({
      ...prev,
      [ex.id]: { state: isCorrect ? 'correct' : 'wrong', userAnswer: translInputs[ex.id] || '' }
    }))
    api.recordExercise(lesson.id, {
      exercise_id: ex.id,
      exercise_type: 'translation',
      is_correct: isCorrect,
      user_answer: translInputs[ex.id] || '',
    }).catch(() => {})
  }

  // ─── Calcul du score final ─────────────────────────────────
  function handleSubmitAll() {
    const answered = written.filter(ex => results[ex.id])
    const correct  = answered.filter(ex => results[ex.id]?.state === 'correct')
    const score = written.length > 0
      ? Math.round((correct.length / written.length) * 100)
      : 100

    setFinalScore(score)
    setSubmitted(true)
    api.updateProgress(lesson.id, {
      completed_step: 5,
      is_completed: true,
      score_written: score,
    }).catch(() => {})
    onComplete(score)
  }

  const answeredCount = Object.keys(results).length
  const totalWritten  = written.length

  return (
    <div className="exercises-step animate-in">
      <div className="exercises-header">
        <h2>Exercices</h2>
        <p className="exercises-subtitle">
          {totalWritten} exercice{totalWritten > 1 ? 's' : ''}
        </p>
      </div>

      {/* Score final si soumis */}
      {submitted && finalScore !== null && (
        <div className={`score-banner ${finalScore >= 70 ? 'success' : 'warning'} animate-in`}>
          <div className="score-value">{finalScore}%</div>
          <div className="score-message">
            {finalScore === 100 && "🏆 Score parfait ! Excellent travail."}
            {finalScore >= 70 && finalScore < 100 && "✓ Bon résultat ! Revoyez les erreurs ci-dessous."}
            {finalScore < 70 && "Continuez — revoyez le vocabulaire et les points de grammaire."}
          </div>
        </div>
      )}

      {/* ─── Exercices écrits ─────────────────────────────── */}
      <div className="written-list">
          {written.map((ex, i) => (
            <div key={ex.id} className={`ex-card card ex-${results[ex.id]?.state || 'unanswered'}`}>
              <div className="ex-num">Exercice {i + 1}</div>

              {/* QCM */}
              {ex.type === 'multiple_choice' && (
                <MCQExercise
                  ex={ex}
                  result={results[ex.id]}
                  onAnswer={(idx) => handleMCQ(ex, idx)}
                />
              )}

              {/* Lacune */}
              {ex.type === 'fill_blank' && (
                <FillBlankExercise
                  ex={ex}
                  value={fillInputs[ex.id] || ''}
                  onChange={v => setFillInputs(p => ({ ...p, [ex.id]: v }))}
                  result={results[ex.id]}
                  onSubmit={() => handleFillBlank(ex)}
                />
              )}

              {/* Traduction */}
              {ex.type === 'translation' && (
                <TranslationExercise
                  ex={ex}
                  value={translInputs[ex.id] || ''}
                  onChange={v => setTranslInputs(p => ({ ...p, [ex.id]: v }))}
                  result={results[ex.id]}
                  onSubmit={() => handleTranslation(ex)}
                />
              )}
            </div>
          ))}

          {/* Bouton de soumission */}
          {!submitted && (
            <div className="ex-submit-row">
              <span className="ex-submit-count">{answeredCount} / {totalWritten} répondus</span>
              <button
                className="btn btn-gold btn-lg"
                onClick={handleSubmitAll}
                disabled={answeredCount === 0}
              >
                Terminer et voir le score ✓
              </button>
            </div>
          )}
        </div>
    </div>
  )
}

// ─── Sous-composants ───────────────────────────────────────────

function MCQExercise({ ex, result, onAnswer }: {
  ex: WrittenExercise
  result?: ExerciseResult
  onAnswer: (idx: number) => void
}) {
  return (
    <div className="mcq">
      <p className="ex-question">{ex.question}</p>
      <div className="mcq-options">
        {ex.options?.map((opt, idx) => {
          let cls = 'mcq-opt'
          if (result) {
            if (idx === ex.answer) cls += ' correct'
            else if (result.userAnswer === String(idx)) cls += ' wrong'
            else cls += ' dimmed'
          }
          return (
            <button key={idx} className={cls} onClick={() => onAnswer(idx)} disabled={!!result}>
              <span className="mcq-letter">{String.fromCharCode(65 + idx)}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {result && ex.explanation && (
        <div className="ex-explanation animate-in">
          <span>💡</span> {ex.explanation}
        </div>
      )}
    </div>
  )
}

function FillBlankExercise({ ex, value, onChange, result, onSubmit }: {
  ex: WrittenExercise
  value: string
  onChange: (v: string) => void
  result?: ExerciseResult
  onSubmit: () => void
}) {
  return (
    <div className="fill-blank">
      <p className="ex-question">{ex.sentence}</p>
      {ex.hint && <p className="ex-hint">💡 Aide : {ex.hint}</p>}
      <div className="fill-input-row">
        <input
          type="text"
          className={`fill-input ${result ? (result.state === 'correct' ? 'correct' : 'wrong') : ''}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !result && onSubmit()}
          placeholder="Votre réponse…"
          disabled={!!result}
        />
        {!result && (
          <button className="btn btn-primary" onClick={onSubmit} disabled={!value.trim()}>
            Valider
          </button>
        )}
      </div>
      {result && (
        <div className={`ex-feedback ${result.state === 'correct' ? 'feedback-correct' : 'feedback-wrong'} animate-in`}>
          {result.state === 'correct'
            ? `✓ Correct !`
            : `✗ Réponse attendue : "${ex.answer}"${ex.alternatives?.length ? ` ou "${ex.alternatives.join('" / "')}"` : ''}`
          }
        </div>
      )}
    </div>
  )
}

function TranslationExercise({ ex, value, onChange, result, onSubmit }: {
  ex: WrittenExercise
  value: string
  onChange: (v: string) => void
  result?: ExerciseResult
  onSubmit: () => void
}) {
  return (
    <div className="translation-ex">
      <div className="transl-fr-sentence">
        <span className="def-lang fr">FR</span>
        <span>{ex.french}</span>
      </div>
      <textarea
        className="transl-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Écrivez votre traduction en anglais…"
        rows={3}
        disabled={!!result}
      />
      {ex.key_vocabulary && (
        <div className="transl-key-vocab">
          <span className="tips-mini-label">Vocabulaire clé :</span>
          {ex.key_vocabulary.map((kv, i) => (
            <span key={i} className="hint-tag">{kv}</span>
          ))}
        </div>
      )}
      {!result && (
        <button className="btn btn-primary" onClick={onSubmit} disabled={!value.trim()}>
          Valider
        </button>
      )}
      {result && (
        <div className={`ex-feedback ${result.state === 'correct' ? 'feedback-correct' : 'feedback-wrong'} animate-in`}>
          {result.state === 'correct'
            ? '✓ Correct !'
            : '✗ Comparez avec la réponse suggérée ci-dessous.'
          }
        </div>
      )}
      {result && ex.suggested_answer && (
        <div className="ex-explanation animate-in">
          <div className="suggested-label" style={{ marginBottom: '0.4rem' }}>Réponse suggérée :</div>
          <em>"{ex.suggested_answer}"</em>
        </div>
      )}
    </div>
  )
}
