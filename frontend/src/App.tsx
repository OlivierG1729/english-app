// App.tsx — Configuration du routeur React
// ==========================================

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/layout/Header'
import Home   from './pages/Home'
import Lesson from './pages/Lesson'
import type { GlobalStats, LevelTab } from './types'

type Theme = 'elegant' | 'dark'

export default function App() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<LevelTab>('A1')
  const [theme, setTheme] = useState<Theme>('elegant')

  // Applique le thème sur le document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const totalLessons = selectedLevel === 'A1' ? 24 : 40
  const completedIds = stats?.completed_lesson_ids ?? []
  const totalCompleted = completedIds.filter(id =>
    selectedLevel === 'A1' ? id.startsWith('a1_') : !id.startsWith('a1_')
  ).length

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Header
          totalCompleted={totalCompleted}
          totalLessons={totalLessons}
          selectedLevel={selectedLevel}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'elegant' ? 'dark' : 'elegant')}
        />
        <Routes>
          <Route path="/" element={
            <Home
              onStatsLoaded={setStats}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
            />
          } />
          <Route path="/lesson/:id" element={<Lesson />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
