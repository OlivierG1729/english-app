// components/layout/Header.tsx
// ================================
// Barre de navigation supérieure : logo, progression globale, toggle thème, lien retour

import { Link, useLocation } from 'react-router-dom'
import type { LevelTab } from '../../types'
import './Header.css'

interface HeaderProps {
  totalCompleted?: number
  totalLessons?: number
  selectedLevel?: LevelTab
  theme?: 'elegant' | 'dark'
  onToggleTheme?: () => void
}

export default function Header({
  totalCompleted = 0,
  totalLessons = 40,
  selectedLevel = 'A1',
  theme = 'elegant',
  onToggleTheme,
}: HeaderProps) {
  const location = useLocation()
  const isOnLesson = location.pathname.startsWith('/lesson/')

  const pct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
  const subtitleText = selectedLevel === 'A1' ? 'A1 — Beginner' : 'B2 → C1'

  return (
    <header className="app-header">
      <div className="header-inner">

        {/* Logo / titre */}
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">📘</span>
          <div className="header-logo-text">
            <span className="header-title">English App</span>
            <span className="header-subtitle">{subtitleText}</span>
          </div>
        </Link>

        {/* Barre de progression globale */}
        <div className="header-progress">
          <div className="header-progress-label">
            <span>{totalCompleted} / {totalLessons} leçons</span>
            <span className="header-progress-pct">{pct}%</span>
          </div>
          <div className="header-progress-track">
            <div
              className="header-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Toggle thème */}
        <div className="theme-toggle" onClick={onToggleTheme} title={theme === 'elegant' ? 'Mode sombre' : 'Mode élégant'}>
          <span className="theme-toggle-label">{theme === 'elegant' ? '✨' : '🌙'}</span>
          <div className={`toggle-track ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </div>

        {/* Bouton retour (visible seulement sur une leçon) */}
        {isOnLesson && (
          <Link to="/" className="btn btn-ghost header-back-btn">
            ← Accueil
          </Link>
        )}
      </div>
    </header>
  )
}
