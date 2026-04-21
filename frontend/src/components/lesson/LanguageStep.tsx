// components/lesson/LanguageStep.tsx
// =====================================
// Étape 2 : Points de langue.
// 3 onglets : Vocabulaire / Grammaire / Expressions idiomatiques

import { useState } from 'react'
import type { Lesson, VocabItem, GrammarPoint, Expression } from '../../types'
import './LanguageStep.css'

interface LanguageStepProps {
  lesson: Lesson
  onComplete: () => void
  customVocab?: VocabItem[]
}

type Tab = 'vocab' | 'grammar' | 'expressions'

export default function LanguageStep({ lesson, onComplete, customVocab = [] }: LanguageStepProps) {
  const [activeTab, setActiveTab] = useState<Tab>('vocab')
  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(new Set([0]))
  const [expandedExpr, setExpandedExpr] = useState<Set<number>>(new Set())

  const { vocabulary, grammar_points, expressions } = lesson.content

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: 'vocab',       label: 'Vocabulaire',  icon: '📚', count: vocabulary.length + customVocab.length },
    { id: 'grammar',     label: 'Grammaire',    icon: '🔬', count: grammar_points.length },
    { id: 'expressions', label: 'Expressions',  icon: '💡', count: expressions.length },
  ]

  const getLevelClass = (level: string) => {
    if (level === 'B2') return 'level-b2'
    if (level === 'C1') return 'level-c1'
    return 'level-c1p'
  }

  return (
    <div className="language-step animate-in">

      <div className="language-header">
        <h2 className="language-title">Points de langue</h2>
        <p className="language-subtitle">
          {lesson.title} — vocabulaire, grammaire et expressions à retenir
        </p>
      </div>

      {/* Onglets */}
      <div className="lang-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`lang-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── Vocabulaire ─────────────────────────────────────── */}
      {activeTab === 'vocab' && (
        <div className="vocab-list animate-in">
          {vocabulary.map((item: VocabItem, i: number) => (
            <div key={i} className="vocab-card card">
              <div className="vocab-card-top">
                <div className="vocab-word-group">
                  <span className="vocab-word">{item.word}</span>
                  <span className="phonetic">{item.phonetic}</span>
                  <span className="vocab-type">{item.type}</span>
                </div>
                <span className={`level-badge ${getLevelClass(item.level)}`}>{item.level}</span>
              </div>

              <div className="vocab-translation">
                {item.definition_fr}
              </div>

              <div className="vocab-example">
                <span className="example-label">Exemple :</span>
                <em>"{item.example}"</em>
              </div>

              {item.definition_en && (
                <div className="vocab-note">
                  <span>💡</span>
                  <span>{item.definition_en}</span>
                </div>
              )}
            </div>
          ))}

          {/* Mots ajoutés par l'utilisateur via clic dans le texte */}
          {customVocab.length > 0 && (
            <>
              <div className="custom-vocab-divider">
                <span>🔍 Mes mots recherchés</span>
              </div>
              {customVocab.map((item, i) => (
                <div key={`custom-${i}`} className="vocab-card card custom-vocab-card">
                  <div className="vocab-card-top">
                    <div className="vocab-word-group">
                      <span className="vocab-word">{item.word}</span>
                      <span className="custom-vocab-badge">Recherché</span>
                    </div>
                  </div>
                  <div className="vocab-defs">
                    <div className="vocab-def-fr">
                      <span className="def-lang fr">FR</span>
                      <span>{item.definition_fr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ─── Grammaire ─────────────────────────────────────────── */}
      {activeTab === 'grammar' && (
        <div className="grammar-list animate-in">
          {grammar_points.map((point: GrammarPoint, i: number) => (
            <div key={i} className={`grammar-card card ${expandedGrammar.has(i) ? 'expanded' : ''}`}>
              <button
                className="grammar-card-header"
                onClick={() => {
                  setExpandedGrammar(prev => {
                    const next = new Set(prev)
                    if (next.has(i)) next.delete(i)
                    else next.add(i)
                    return next
                  })
                }}
              >
                <div className="grammar-title-row">
                  <span className="grammar-icon">🔬</span>
                  <h3 className="grammar-title">{point.title}</h3>
                </div>
                <span className="grammar-chevron">{expandedGrammar.has(i) ? '▲' : '▼'}</span>
              </button>

              {expandedGrammar.has(i) && (
                <div className="grammar-body animate-in">
                  <div
                    className="grammar-explanation"
                    dangerouslySetInnerHTML={{
                      // Convertit **gras** en <strong> pour l'affichage
                      __html: point.explanation
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                  <div className="grammar-examples">
                    <div className="examples-label">Exemples :</div>
                    {point.examples.map((ex, j) => (
                      <div key={j} className={`grammar-example ${ex.includes('✓') ? 'correct' : ex.includes('✗') ? 'wrong' : ''}`}>
                        <span className="example-bullet">›</span>
                        <span dangerouslySetInnerHTML={{
                          __html: ex
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/✓/g, '<span class="ex-ok">✓</span>')
                            .replace(/✗/g, '<span class="ex-bad">✗</span>')
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Expressions ───────────────────────────────────────── */}
      {activeTab === 'expressions' && (
        <div className="expr-list animate-in">
          {expressions.map((expr: Expression, i: number) => (
            <div key={i} className="expr-card card">
              <div className="expr-header">
                <span className="expr-phrase">"{expr.expression}"</span>
                <span className="register-tag">{expr.register}</span>
              </div>
              <div className="expr-meaning">
                <span className="def-lang fr">FR</span>
                <span>{expr.meaning_fr}</span>
              </div>
              <div className="expr-example">
                <span className="example-label">Exemple :</span>
                <em>"{expr.example}"</em>
              </div>
              {expr.note && (
                <div className="expr-note">
                  <span>💡</span>
                  <span>{expr.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="step-footer">
        <p className="step-footer-hint">
          Mémorisé les points clés ? Passez à l'écoute audio.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onComplete}>
          Écoute →
        </button>
      </div>
    </div>
  )
}
