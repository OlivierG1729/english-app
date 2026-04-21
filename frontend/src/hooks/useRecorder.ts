// hooks/useRecorder.ts — Enregistrement audio via l'API MediaRecorder du navigateur
// ===================================================================================
// Gère : démarrage, arrêt, lecture de l'enregistrement utilisateur
// Aucune donnée n'est envoyée au serveur — tout reste dans le navigateur (blob URL)

import { useState, useRef, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'recorded' | 'playing' | 'error'

export interface UseRecorderReturn {
  state: RecorderState
  duration: number              // durée de l'enregistrement en secondes
  audioUrl: string | null       // URL blob pour lecture
  startRecording: () => Promise<void>
  stopRecording: () => void
  playRecording: () => void
  stopPlayback: () => void
  clearRecording: () => void
  errorMessage: string | null
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null)

      // Demande l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialise MediaRecorder avec le format le mieux supporté
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      // Collecte les morceaux audio au fil de l'enregistrement
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      // Quand l'enregistrement s'arrête, crée un blob URL
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)

        // Libère l'ancienne URL si elle existe
        if (audioUrl) URL.revokeObjectURL(audioUrl)

        setAudioUrl(url)
        setState('recorded')
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000))

        // Arrête toutes les pistes du flux micro
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start(250)  // Collecte des chunks toutes les 250ms
      setState('recording')

      // Timer pour afficher la durée en direct
      timerRef.current = window.setInterval(() => {
        setDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

    } catch (err) {
      console.error('Microphone access error:', err)
      setState('error')
      setErrorMessage(
        'Accès au microphone refusé. Vérifiez les permissions de votre navigateur.'
      )
    }
  }, [audioUrl])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const playRecording = useCallback(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onended = () => setState('recorded')
    audio.play()
    setState('playing')
  }, [audioUrl])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState('recorded')
  }, [])

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuration(0)
    setState('idle')
    setErrorMessage(null)
  }, [audioUrl])

  return {
    state,
    duration,
    audioUrl,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording,
    errorMessage,
  }
}
