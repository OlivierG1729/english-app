// api/client.ts — Toutes les fonctions d'appel au backend FastAPI
// ================================================================
// Utilise fetch() natif du navigateur.
// Le proxy Vite redirige /api/* vers http://localhost:8000

import type { Lesson, Curriculum, LessonProgress, GlobalStats } from '../types'

// En dev : '/api' (proxy Vite vers localhost:9000)
// En prod : 'https://xxx.onrender.com/api' (variable d'environnement VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || ''
const BASE = `${API_URL}/api`

// ─── Helper ────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Leçons ────────────────────────────────────────────────────

export const api = {
  // Curriculum complet (toutes les unités)
  getCurriculum: () =>
    fetchJSON<Curriculum>(`${BASE}/lessons/curriculum`),

  // Contenu complet d'une leçon
  getLesson: (lessonId: string) =>
    fetchJSON<Lesson>(`${BASE}/lessons/${lessonId}`),

  // Liste des leçons disponibles
  getAvailableLessons: () =>
    fetchJSON<{ available: string[] }>(`${BASE}/lessons/`),

  // ─── Progression ─────────────────────────────────────────────
  getProgress: (lessonId: string) =>
    fetchJSON<LessonProgress>(`${BASE}/progress/${lessonId}`),

  getAllProgress: () =>
    fetchJSON<LessonProgress[]>(`${BASE}/progress/`),

  getStats: () =>
    fetchJSON<GlobalStats>(`${BASE}/progress/stats`),

  updateProgress: (lessonId: string, data: {
    completed_step: number
    is_completed?: boolean
    score_written?: number
    score_oral?: number
  }) =>
    fetchJSON(`${BASE}/progress/${lessonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  recordExercise: (lessonId: string, data: {
    exercise_id: string
    exercise_type: string
    is_correct?: boolean
    user_answer?: string
  }) =>
    fetchJSON(`${BASE}/progress/${lessonId}/exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  resetProgress: (lessonId: string) =>
    fetchJSON(`${BASE}/progress/${lessonId}/reset`, { method: 'DELETE' }),

  // ─── Audio ────────────────────────────────────────────────────
  getAudioStatus: (lessonId: string) =>
    fetchJSON<{ lesson_id: string; audio_available: boolean; audio_url: string | null }>(
      `${BASE}/audio/${lessonId}/status`
    ),

  generateAudio: (lessonId: string, voice?: string, rate?: string) => {
    const params = new URLSearchParams()
    if (voice) params.set('voice', voice)
    if (rate) params.set('rate', rate)
    return fetchJSON<{ status: string; audio_url?: string; message?: string }>(
      `${BASE}/audio/${lessonId}/generate?${params}`,
      { method: 'POST' }
    )
  },

  getVoices: () =>
    fetchJSON<{ recommended: { id: string; label: string; accent: string }[] }>(
      `${BASE}/audio/voices`
    ),

  // ─── Traduction ──────────────────────────────────────────────
  translateWord: (word: string) =>
    fetchJSON<{ word: string; translation: string }>(
      `${BASE}/translate?word=${encodeURIComponent(word)}`
    ),
}
