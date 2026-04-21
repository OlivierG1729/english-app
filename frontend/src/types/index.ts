// types/index.ts — Tous les types TypeScript de l'application
// =============================================================
// Ces interfaces correspondent exactement à la structure des JSON de leçons
// et aux réponses de l'API backend.

// ─── Leçon ────────────────────────────────────────────────────

export interface VocabItem {
  word: string
  phonetic: string
  type: string
  definition_en: string
  definition_fr: string
  example: string
  level: string
}

export interface GrammarPoint {
  title: string
  explanation: string
  examples: string[]
}

export interface Expression {
  expression: string
  meaning_fr: string
  example: string
  register: string
  note: string
}

export interface Paragraph {
  en: string
  fr: string
  speaker?: string   // uniquement pour les dialogues
}

export interface LessonContent {
  paragraphs: Paragraph[]
  speakers?: string[]       // noms des locuteurs pour un dialogue
  vocabulary: VocabItem[]
  grammar_points: GrammarPoint[]
  expressions: Expression[]
}

// ─── Exercices ────────────────────────────────────────────────

export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'translation'
export type OralExerciseType = 'read_aloud' | 'answer_question'

export interface WrittenExercise {
  id: string
  type: ExerciseType
  question?: string
  options?: string[]
  answer?: number | string
  alternatives?: string[]
  explanation?: string
  sentence?: string
  hint?: string
  french?: string
  suggested_answer?: string
  key_vocabulary?: string[]
}

export interface OralExercise {
  id: string
  type: OralExerciseType
  instruction?: string
  text?: string
  question?: string
  focus?: string
  phonetic_tips?: string[]
  suggested_answer?: string
  vocabulary_hints?: string[]
  duration_seconds?: number
}

export interface Exercises {
  written: WrittenExercise[]
  oral: OralExercise[]
}

// ─── Leçon complète ───────────────────────────────────────────

export interface Lesson {
  id: string
  unit: number
  unit_title: string
  title: string
  level: 'A1' | 'B2' | 'B2+' | 'C1' | 'C1+'
  type: 'story' | 'dialogue'
  theme: string
  reading_time: string
  content: LessonContent
  exercises: Exercises
}

// ─── Curriculum ───────────────────────────────────────────────

export interface CurriculumLesson {
  id: string
  title: string
  type: 'story' | 'dialogue'
  theme: string
  available: boolean
}

export interface Unit {
  id: number
  title: string
  color: string
  description: string
  target_level: string
  lessons: CurriculumLesson[]
}

export interface CurriculumLevel {
  id: string
  title: string
  total_lessons: number
  units: Unit[]
}

export interface Curriculum {
  levels: CurriculumLevel[]
}

export type LevelTab = 'A1' | 'B2-C1'

// ─── Progression ──────────────────────────────────────────────

export interface LessonProgress {
  lesson_id: string
  completed_step: number    // 0=non commencé, 1-5=étapes
  is_completed: boolean
  score_written?: number    // 0-100
  score_oral?: number
  started_at?: string
  completed_at?: string
}

export interface GlobalStats {
  total_started: number
  total_completed: number
  in_progress: number
  average_score?: number
  completed_lesson_ids: string[]
}

// ─── Étapes de leçon ──────────────────────────────────────────

export type LessonStep = 1 | 2 | 3 | 4 | 5

export const STEP_LABELS: Record<LessonStep, string> = {
  1: 'Lecture',
  2: 'Points de langue',
  3: 'Écoute',
  4: 'Expression orale',
  5: 'Exercices',
}

export const STEP_ICONS: Record<LessonStep, string> = {
  1: '📖',
  2: '🧠',
  3: '🎧',
  4: '🎤',
  5: '✏️',
}
