// components/lesson/ClickableText.tsx
// =====================================
// Composant réutilisable : affiche du texte avec chaque mot cliquable.
// Au clic, un tooltip apparaît avec la traduction FR (via API MyMemory).
// Le mot traduit est remonté au parent via onWordTranslated().

import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import './ClickableText.css'

interface ClickableTextProps {
  text: string
  className?: string
  onWordTranslated?: (word: string, translation: string) => void
}

interface TooltipState {
  word: string
  cleaned: string
  translation: string | null
  loading: boolean
  error: boolean
  top: number
  left: number
}

/** Nettoie un mot : retire la ponctuation en début/fin, met en minuscule */
function cleanWord(raw: string): string {
  return raw.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '').toLowerCase()
}

/** Découpe le texte en tokens (mots et séparateurs) */
function tokenize(text: string): { value: string; isWord: boolean }[] {
  // Sépare les mots des espaces/ponctuation tout en gardant tout
  const parts = text.split(/(\s+|(?=[.,!?;:"""''()\[\]{}—–-])|(?<=[.,!?;:"""''()\[\]{}—–-]))/)
  return parts
    .filter(p => p.length > 0)
    .map(p => ({
      value: p,
      isWord: /[a-zA-Z]/.test(p) && p.trim().length > 0,
    }))
}

export default function ClickableText({ text, className, onWordTranslated }: ClickableTextProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const wrapperRef = useRef<HTMLParagraphElement>(null)

  // Fermer le tooltip au clic extérieur ou Escape
  const handleClose = useCallback(() => setTooltip(null), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [handleClose])

  async function handleWordClick(e: React.MouseEvent<HTMLSpanElement>, raw: string) {
    const cleaned = cleanWord(raw)
    if (cleaned.length < 2) return

    // Position du tooltip relative au wrapper
    const span = e.currentTarget
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const spanRect = span.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()

    const top = spanRect.bottom - wrapperRect.top + 6
    let left = spanRect.left - wrapperRect.left + spanRect.width / 2

    // Empêche le tooltip de déborder à droite
    const maxLeft = wrapperRect.width - 80
    if (left > maxLeft) left = maxLeft
    if (left < 80) left = 80

    setTooltip({
      word: raw.trim(),
      cleaned,
      translation: null,
      loading: true,
      error: false,
      top,
      left,
    })

    try {
      const result = await api.translateWord(cleaned)
      setTooltip(prev =>
        prev?.cleaned === cleaned
          ? { ...prev, translation: result.translation, loading: false }
          : prev
      )
      // Remonter au parent
      if (onWordTranslated) {
        onWordTranslated(cleaned, result.translation)
      }
    } catch {
      setTooltip(prev =>
        prev?.cleaned === cleaned
          ? { ...prev, error: true, loading: false }
          : prev
      )
    }
  }

  const tokens = tokenize(text)

  return (
    <p className={`clickable-text-wrapper ${className || ''}`} ref={wrapperRef}>
      {tokens.map((token, i) =>
        token.isWord ? (
          <span
            key={i}
            className={`clickable-word ${tooltip?.cleaned === cleanWord(token.value) ? 'active' : ''}`}
            onClick={(e) => handleWordClick(e, token.value)}
          >
            {token.value}
          </span>
        ) : (
          <span key={i}>{token.value}</span>
        )
      )}

      {/* Tooltip de traduction */}
      {tooltip && (
        <span
          className="word-tooltip"
          style={{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }}
        >
          <span className="tooltip-arrow" />
          <span className="tooltip-word">{tooltip.word}</span>
          {tooltip.loading && (
            <span className="tooltip-loading">
              <span className="tooltip-spinner" />
              Traduction…
            </span>
          )}
          {tooltip.translation && (
            <span className="tooltip-translation">{tooltip.translation}</span>
          )}
          {tooltip.error && (
            <span className="tooltip-error">Traduction indisponible</span>
          )}
        </span>
      )}
    </p>
  )
}
