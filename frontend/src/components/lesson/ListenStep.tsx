// components/lesson/ListenStep.tsx
// ===================================
// Étape 3 : Écoute audio.
// - Vérifie si le fichier audio TTS existe
// - Lance la génération si nécessaire (bouton)
// - Lecteur audio avec contrôle vitesse + choix de voix
// - Retranscription synchronisée (paragraphes mis en évidence)

import { useState, useEffect, useRef } from 'react'
import type { Lesson } from '../../types'
import { api } from '../../api/client'
import ClickableText from './ClickableText'
import './ListenStep.css'

interface ListenStepProps {
  lesson: Lesson
  onComplete: () => void
  onWordTranslated?: (word: string, translation: string) => void
}

type AudioStatus = 'checking' | 'available' | 'unavailable' | 'generating' | 'error'

export default function ListenStep({ lesson, onComplete, onWordTranslated }: ListenStepProps) {
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('checking')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [hasListened, setHasListened] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Vérifie le statut audio au montage
  useEffect(() => {
    checkAudioStatus()
  }, [lesson.id])

  // Met à jour l'audio quand l'URL change
  useEffect(() => {
    if (!audioUrl) return
    const apiBase = import.meta.env.VITE_API_URL || ''
    const audio = new Audio(`${apiBase}${audioUrl}`)
    audioRef.current = audio

    audio.onloadedmetadata = () => setDuration(audio.duration)
    audio.ontimeupdate     = () => setCurrentTime(audio.currentTime)
    audio.onended          = () => { setIsPlaying(false); setHasListened(true) }
    audio.onerror          = () => setAudioStatus('error')

    return () => { audio.pause(); audioRef.current = null }
  }, [audioUrl])

  // Synchronise le playbackRate sur l'élément audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  async function checkAudioStatus() {
    try {
      const status = await api.getAudioStatus(lesson.id)
      if (status.audio_available && status.audio_url) {
        setAudioUrl(status.audio_url)
        setAudioStatus('available')
      } else {
        setAudioStatus('unavailable')
      }
    } catch {
      setAudioStatus('error')
    }
  }

  async function handleGenerateAudio() {
    setAudioStatus('generating')
    try {
      await api.generateAudio(lesson.id)
      // Polling toutes les 2s jusqu'à disponibilité
      const poll = setInterval(async () => {
        const status = await api.getAudioStatus(lesson.id)
        if (status.audio_available && status.audio_url) {
          clearInterval(poll)
          setAudioUrl(status.audio_url)
          setAudioStatus('available')
        }
      }, 2000)
      // Arrête le polling après 60s max
      setTimeout(() => clearInterval(poll), 60000)
    } catch {
      setAudioStatus('error')
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setAudioStatus('error'))
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const pct = duration ? (currentTime / duration) * 100 : 0
  const RATES = [0.75, 0.9, 1, 1.1, 1.25]

  return (
    <div className="listen-step animate-in">
      <div className="listen-header">
        <h2>Écoute audio</h2>
        <p className="listen-subtitle">
          Écoutez le texte lu par une voix native britannique. Essayez de suivre sans regarder la transcription d'abord.
        </p>
      </div>

      {/* ─── Cas : vérification en cours ───────────────────── */}
      {audioStatus === 'checking' && (
        <div className="listen-status card">
          <div className="loading-spinner small" />
          <span>Vérification de l'audio…</span>
        </div>
      )}

      {/* ─── Cas : audio non généré ─────────────────────────── */}
      {audioStatus === 'unavailable' && (
        <div className="listen-status card">
          <div className="listen-unavail-icon">🎙</div>
          <h3>Audio non encore généré</h3>
          <p>
            L'audio TTS est généré à la demande via <strong>edge-tts</strong> (voix Microsoft, gratuite, très naturelle).
            Nécessite une connexion internet lors de la génération uniquement.
          </p>
          <button className="btn btn-primary" onClick={handleGenerateAudio}>
            Générer l'audio maintenant
          </button>
        </div>
      )}

      {/* ─── Cas : génération en cours ──────────────────────── */}
      {audioStatus === 'generating' && (
        <div className="listen-status card">
          <div className="loading-spinner" />
          <h3>Génération en cours…</h3>
          <p>La voix est en cours de synthèse. Cela prend environ 10–20 secondes.</p>
          <div className="animate-pulse" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Attendez, l'audio se chargera automatiquement.
          </div>
        </div>
      )}

      {/* ─── Cas : erreur ───────────────────────────────────── */}
      {audioStatus === 'error' && (
        <div className="listen-status card">
          <p style={{ color: 'var(--error)' }}>⚠️ Erreur lors du chargement de l'audio.</p>
          <button className="btn btn-ghost" onClick={checkAudioStatus}>Réessayer</button>
        </div>
      )}

      {/* ─── Lecteur audio ──────────────────────────────────── */}
      {audioStatus === 'available' && (
        <div className="audio-player card">

          {/* Titre */}
          <div className="player-title">
            <span className="player-icon">🎧</span>
            <div>
              <div className="player-lesson-title">{lesson.title}</div>
              <div className="player-voice">Voix : en-GB-SoniaNeural (Sonia, British)</div>
            </div>
          </div>

          {/* Boutons de contrôle */}
          <div className="player-controls">
            <button
              className="btn btn-ghost player-skip"
              onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 5) }}
              title="−5s"
            >
              ⏮ 5s
            </button>

            <button
              className={`player-play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              className="btn btn-ghost player-skip"
              onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 5) }}
              title="+5s"
            >
              5s ⏭
            </button>
          </div>

          {/* Barre de progression */}
          <div className="player-seek">
            <span className="player-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="seek-bar"
              style={{ '--pct': `${pct}%` } as React.CSSProperties}
            />
            <span className="player-time">{formatTime(duration)}</span>
          </div>

          {/* Contrôle de vitesse */}
          <div className="player-rate">
            <span className="rate-label">Vitesse :</span>
            {RATES.map(r => (
              <button
                key={r}
                className={`rate-btn ${playbackRate === r ? 'active' : ''}`}
                onClick={() => setPlaybackRate(r)}
              >
                {r}×
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Transcription ──────────────────────────────────── */}
      {audioStatus === 'available' && (
        <div className="listen-transcript card">
          <div className="transcript-header">
            <h3>Transcription</h3>
            <span className="transcript-hint">Suivez le texte pendant l'écoute</span>
          </div>
          {lesson.content.paragraphs.map((para, i) => (
            <div key={i} className={`transcript-para ${lesson.type === 'dialogue' ? 'dialogue' : ''}`}>
              {para.speaker && <div className="speaker-label">{para.speaker}</div>}
              <ClickableText text={para.en} className="lesson-text" onWordTranslated={onWordTranslated} />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="step-footer">
        <p className="step-footer-hint">
          {hasListened
            ? '✓ Vous avez écouté la leçon. Prêt pour l\'expression orale ?'
            : 'Écoutez le texte au moins une fois avant de passer à la suite.'}
        </p>
        <button
          className="btn btn-primary btn-lg"
          onClick={onComplete}
        >
          Expression orale →
        </button>
      </div>
    </div>
  )
}
