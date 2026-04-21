// pages/Home.tsx
// ==============
// Page d'accueil : affiche les unités avec leurs leçons.
// Onglets de niveau pour basculer entre A1 et B2-C1.
// Montre la progression par leçon (terminée / en cours / non commencée).

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Curriculum, CurriculumLevel, LessonProgress, GlobalStats, LevelTab } from '../types'
import './Home.css'

interface HomeProps {
  onStatsLoaded?: (stats: GlobalStats) => void
  selectedLevel: LevelTab
  onLevelChange: (level: LevelTab) => void
}

export default function Home({ onStatsLoaded, selectedLevel, onLevelChange }: HomeProps) {
  const navigate = useNavigate()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({})
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [curr, allProgress, globalStats] = await Promise.all([
          api.getCurriculum(),
          api.getAllProgress(),
          api.getStats(),
        ])
        setCurriculum(curr)
        // Indexe la progression par lesson_id pour un accès rapide
        const progressMap: Record<string, LessonProgress> = {}
        for (const p of allProgress) progressMap[p.lesson_id] = p
        setProgress(progressMap)
        setStats(globalStats)
        onStatsLoaded?.(globalStats)
      } catch (err) {
        setError('Impossible de charger le curriculum. Le backend est-il démarré ?')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getLessonStatus = (lessonId: string): 'completed' | 'in-progress' | 'locked' | 'available' => {
    const p = progress[lessonId]
    if (!p) return 'available'
    if (p.is_completed) return 'completed'
    if (p.completed_step > 0) return 'in-progress'
    return 'available'
  }

  const getLevelClass = (level: string) => {
    if (level === 'A1') return 'level-a1'
    if (level === 'B2') return 'level-b2'
    if (level === 'B2+') return 'level-b2p'
    if (level === 'C1') return 'level-c1'
    return 'level-c1p'
  }

  if (loading) return (
    <div className="home-loading">
      <div className="loading-spinner" />
      <p>Chargement du curriculum…</p>
    </div>
  )

  if (error) return (
    <div className="home-error card">
      <h3>⚠️ Erreur de connexion</h3>
      <p>{error}</p>
      <code>uvicorn main:app --reload --port 9000</code>
    </div>
  )

  if (!curriculum) return null

  // Trouve le niveau sélectionné
  const currentLevel: CurriculumLevel | undefined =
    curriculum.levels.find(l => l.id === selectedLevel)

  if (!currentLevel) return null

  // Héros dynamique
  const heroTitle = selectedLevel === 'A1'
    ? <>Your path to <em>A1</em> English</>
    : <>Your path to <em>C1</em> English</>

  const heroSub = selectedLevel === 'A1'
    ? `${currentLevel.total_lessons} leçons progressives · Du niveau zéro aux bases solides`
    : `${currentLevel.total_lessons} leçons progressives · Vocabulaire, grammaire, expressions · Écoute et expression orale`

  return (
    <div className="home animate-in">

      {/* Onglets de niveau */}
      <div className="level-tabs">
        <button
          className={`level-tab ${selectedLevel === 'A1' ? 'active' : ''}`}
          onClick={() => onLevelChange('A1')}
        >
          <span className="level-tab-badge level-a1">A1</span>
          <span>Beginner</span>
        </button>
        <button
          className={`level-tab ${selectedLevel === 'B2-C1' ? 'active' : ''}`}
          onClick={() => onLevelChange('B2-C1')}
        >
          <span className="level-tab-badge level-b2">B2</span>
          <span className="level-tab-arrow">→</span>
          <span className="level-tab-badge level-c1">C1</span>
          <span>Advanced</span>
        </button>
      </div>

      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-hero-title">{heroTitle}</h1>
          <p className="home-hero-sub">{heroSub}</p>
        </div>

        {/* Carte stats */}
        {stats && (
          <div className="home-stats-card card">
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{stats.total_completed}</span>
                <span className="stat-label">Terminées</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{stats.in_progress}</span>
                <span className="stat-label">En cours</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{stats.average_score ? `${stats.average_score}%` : '—'}</span>
                <span className="stat-label">Moy. exercices</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unités du niveau sélectionné */}
      <div className="units-list">
        {currentLevel.units.map((unit, unitIdx) => {
          const completedInUnit = unit.lessons.filter(l => getLessonStatus(l.id) === 'completed').length
          const unitPct = Math.round((completedInUnit / unit.lessons.length) * 100)

          return (
            <div key={unit.id} className="unit-block">

              {/* En-tête de l'unité */}
              <div className="unit-header">
                <div className="unit-header-left">
                  <div className="unit-number" style={{ borderColor: unit.color, color: unit.color }}>
                    {unitIdx + 1}
                  </div>
                  <div>
                    <h2 className="unit-title">{unit.title}</h2>
                    <p className="unit-description">{unit.description}</p>
                  </div>
                </div>
                <div className="unit-header-right">
                  <span className={`level-badge ${getLevelClass(unit.target_level)}`}>
                    {unit.target_level}
                  </span>
                  <div className="unit-progress-mini">
                    <div
                      className="unit-progress-fill"
                      style={{ width: `${unitPct}%`, background: unit.color }}
                    />
                  </div>
                  <span className="unit-progress-label">{completedInUnit}/{unit.lessons.length}</span>
                </div>
              </div>

              {/* Grille de leçons */}
              <div className="lessons-grid">
                {unit.lessons.map((lesson, idx) => {
                  const status = lesson.available ? getLessonStatus(lesson.id) : 'locked'
                  const lessonProgress = progress[lesson.id]
                  const lessonNum = unitIdx * 8 + idx + 1

                  return (
                    <button
                      key={lesson.id}
                      className={`lesson-card ${status}`}
                      onClick={() => lesson.available && navigate(`/lesson/${lesson.id}`)}
                      disabled={!lesson.available}
                      title={!lesson.available ? 'Leçon à venir' : lesson.title}
                    >
                      {/* Numéro */}
                      <div className="lesson-card-num" style={{ color: unit.color }}>
                        {String(lessonNum).padStart(2, '0')}
                      </div>

                      {/* Statut icône */}
                      <div className="lesson-card-status">
                        {status === 'completed' && <span className="status-icon completed">✓</span>}
                        {status === 'in-progress' && <span className="status-icon in-progress">◐</span>}
                        {status === 'locked' && <span className="status-icon locked">🔒</span>}
                      </div>

                      {/* Titre */}
                      <div className="lesson-card-title">{lesson.title}</div>

                      {/* Tags */}
                      <div className="lesson-card-tags">
                        <span className={`type-badge type-${lesson.type}`}>
                          {lesson.type === 'story' ? '📖 Story' : '💬 Dialogue'}
                        </span>
                      </div>

                      {/* Score si terminé */}
                      {status === 'completed' && lessonProgress?.score_written != null && (
                        <div className="lesson-card-score">
                          {Math.round(lessonProgress.score_written)}%
                        </div>
                      )}

                      {/* Barre d'avancement si en cours */}
                      {status === 'in-progress' && lessonProgress && (
                        <div className="lesson-card-steps">
                          {[1,2,3,4,5].map(step => (
                            <div
                              key={step}
                              className={`step-dot ${lessonProgress.completed_step >= step ? 'done' : ''}`}
                              style={lessonProgress.completed_step >= step ? { background: unit.color } : {}}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
