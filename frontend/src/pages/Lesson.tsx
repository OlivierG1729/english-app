// pages/Lesson.tsx
// =================
// Page principale d'une leçon.
// Orchestre les 5 étapes et la navigation entre elles.
// Synchronise la progression avec le backend à chaque étape franchie.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Lesson, LessonStep, VocabItem } from '../types'
import { api } from '../api/client'

import StepNav      from '../components/lesson/StepNav'
import ReadingStep  from '../components/lesson/ReadingStep'
import LanguageStep from '../components/lesson/LanguageStep'
import ListenStep   from '../components/lesson/ListenStep'
import SpeakStep    from '../components/lesson/SpeakStep'
import ExercisesStep from '../components/lesson/ExercisesStep'
import './Lesson.css'

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Étape courante (1 à 5)
  const [currentStep, setCurrentStep] = useState<LessonStep>(1)
  // Étape maximum atteinte (permet de naviguer en arrière sans bloquer)
  const [maxStep, setMaxStep] = useState<LessonStep>(1)

  const [completed, setCompleted] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  // Mots traduits par l'utilisateur (clic dans le texte)
  const [customVocab, setCustomVocab] = useState<VocabItem[]>([])

  /** Ajoute un mot traduit au vocabulaire personnalisé (sans doublons) */
  function handleWordTranslated(word: string, translation: string) {
    if (!lesson) return
    const lower = word.toLowerCase()
    // Vérifie les doublons dans le vocabulaire de la leçon
    const inLesson = lesson.content.vocabulary.some(
      v => v.word.toLowerCase() === lower
    )
    if (inLesson) return
    // Vérifie les doublons dans le vocabulaire personnalisé
    const inCustom = customVocab.some(v => v.word.toLowerCase() === lower)
    if (inCustom) return

    setCustomVocab(prev => [...prev, {
      word,
      phonetic: '',
      type: '',
      definition_en: '',
      definition_fr: translation,
      example: '',
      level: '',
    }])
  }

  // Chargement de la leçon et de la progression existante
  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const [lessonData, progress] = await Promise.all([
          api.getLesson(id!),
          api.getProgress(id!),
        ])
        setLesson(lessonData)

        // Reprend là où l'utilisateur s'était arrêté
        if (progress.completed_step > 0) {
          const savedStep = Math.min(progress.completed_step, 5) as LessonStep
          setCurrentStep(savedStep)
          setMaxStep(savedStep)
        }
        if (progress.is_completed) {
          setCompleted(true)
          setFinalScore(progress.score_written ?? null)
        }
      } catch (e) {
        setError(`Leçon "${id}" introuvable ou serveur inaccessible.`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Appelé quand l'utilisateur termine une étape → passe à la suivante
  function handleStepComplete(step: LessonStep) {
    const next = (step + 1) as LessonStep
    const newMax = Math.max(maxStep, next) as LessonStep

    setCurrentStep(next <= 5 ? next : 5)
    setMaxStep(newMax <= 5 ? newMax : 5)

    // Sauvegarde la progression
    api.updateProgress(id!, { completed_step: newMax }).catch(() => {})

    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Appelé quand les exercices sont terminés
  function handleExercisesDone(score: number) {
    setFinalScore(score)
    setCompleted(true)
  }

  if (loading) return (
    <div className="lesson-loading">
      <div className="loading-spinner" />
      <p>Chargement de la leçon…</p>
    </div>
  )

  if (error || !lesson) return (
    <div className="lesson-error card">
      <h3>⚠️ Erreur</h3>
      <p>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Retour à l'accueil</button>
    </div>
  )

  return (
    <div className="lesson-page">

      {/* Barre de navigation des étapes */}
      <StepNav
        currentStep={currentStep}
        maxReachedStep={maxStep}
        onStepClick={(step) => {
          setCurrentStep(step)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {/* Contenu de l'étape courante */}
      <div className="lesson-content main-content">

        {/* Bannière de fin si leçon terminée */}
        {completed && currentStep === 5 && finalScore !== null && (
          <div className="lesson-completed-banner">
            <span className="completion-badge">✓ Leçon terminée</span>
            <span>Score exercices écrits : <strong>{finalScore}%</strong></span>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              Retour au programme
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <ReadingStep lesson={lesson} onComplete={() => handleStepComplete(1)} onWordTranslated={handleWordTranslated} />
        )}
        {currentStep === 2 && (
          <LanguageStep lesson={lesson} onComplete={() => handleStepComplete(2)} customVocab={customVocab} />
        )}
        {currentStep === 3 && (
          <ListenStep lesson={lesson} onComplete={() => handleStepComplete(3)} onWordTranslated={handleWordTranslated} />
        )}
        {currentStep === 4 && (
          <SpeakStep lesson={lesson} onComplete={() => handleStepComplete(4)} />
        )}
        {currentStep === 5 && (
          <ExercisesStep lesson={lesson} onComplete={handleExercisesDone} />
        )}
      </div>
    </div>
  )
}
