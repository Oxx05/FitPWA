import { EXERCISES, type Exercise } from '@/shared/data/exercises'

export interface AiGeneratedExercise {
  exercise_id: string
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rest_seconds: number
  weight_kg: number | null
}

export interface AiGeneratedPlan {
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  exercises: AiGeneratedExercise[]
}

// ─── Muscle group mappings for workout templates ───

interface WorkoutTemplate {
  name: string
  description: string
  muscleGroups: string[]
  keywords: string[]
}

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    name: 'Peito & Tríceps',
    description: 'Foco em empurrar: peito e tríceps.',
    muscleGroups: ['Peito', 'Tríceps'],
    keywords: ['peito', 'chest', 'triceps', 'tríceps', 'empurrar', 'push', 'supino', 'bench'],
  },
  {
    name: 'Costas & Bíceps',
    description: 'Foco em puxar: costas e bíceps.',
    muscleGroups: ['Costas', 'Bíceps'],
    keywords: ['costas', 'back', 'bíceps', 'biceps', 'puxar', 'pull', 'dominadas'],
  },
  {
    name: 'Pernas Completo',
    description: 'Treino completo de pernas: quadríceps, femorais e glúteos.',
    muscleGroups: ['Pernas', 'Femorais', 'Glúteos', 'Quadríceps'],
    keywords: ['pernas', 'legs', 'quadríceps', 'quads', 'femorais', 'glúteos', 'agachamento', 'squat'],
  },
  {
    name: 'Ombros & Core',
    description: 'Ombros completos com trabalho de core.',
    muscleGroups: ['Ombro', 'Abdominais', 'Core', 'Oblíquos'],
    keywords: ['ombros', 'shoulders', 'core', 'abs', 'abdominais', 'deltóides'],
  },
  {
    name: 'Full Body',
    description: 'Treino de corpo inteiro: movimentos compostos para tudo.',
    muscleGroups: ['Peito', 'Costas', 'Pernas', 'Ombro'],
    keywords: ['corpo inteiro', 'full body', 'total', 'completo', 'tudo'],
  },
  {
    name: 'Upper Body',
    description: 'Trem superior: peito, costas, ombros e braços.',
    muscleGroups: ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps'],
    keywords: ['upper', 'superior', 'trem superior', 'cima', 'braços'],
  },
  {
    name: 'Lower Body',
    description: 'Trem inferior: pernas, femorais e glúteos.',
    muscleGroups: ['Pernas', 'Femorais', 'Glúteos'],
    keywords: ['lower', 'inferior', 'trem inferior', 'baixo'],
  },
  {
    name: 'HIIT / Cardio',
    description: 'Treino cardiovascular de alta intensidade.',
    muscleGroups: [],
    keywords: ['hiit', 'cardio', 'cardiovascular', 'emagrecer', 'queimar', 'gordura', 'correr'],
  },
  {
    name: 'Push / Pull / Legs',
    description: 'Split clássico Push-Pull-Legs.',
    muscleGroups: ['Peito', 'Ombro', 'Tríceps'],
    keywords: ['ppl', 'push pull legs'],
  },
  {
    name: 'Braços',
    description: 'Foco em bíceps e tríceps para definição.',
    muscleGroups: ['Bíceps', 'Tríceps', 'Antebraço'],
    keywords: ['braços', 'arms', 'bíceps e tríceps', 'armas'],
  },
  {
    name: 'Glúteos',
    description: 'Foco em glúteos e posterior.',
    muscleGroups: ['Glúteos', 'Femorais'],
    keywords: ['glúteos', 'glutes', 'bunda', 'posterior', 'hip thrust'],
  },
]

// ─── Difficulty presets ───

interface DifficultyPreset {
  setsCompound: number
  setsIsolation: number
  repsStrength: [number, number]
  repsHypertrophy: [number, number]
  repsEndurance: [number, number]
  restCompound: number
  restIsolation: number
  maxExercises: number
}

const DIFFICULTY_PRESETS: Record<string, DifficultyPreset> = {
  beginner: {
    setsCompound: 3, setsIsolation: 2,
    repsStrength: [5, 8], repsHypertrophy: [8, 12], repsEndurance: [12, 15],
    restCompound: 120, restIsolation: 60,
    maxExercises: 5,
  },
  intermediate: {
    setsCompound: 4, setsIsolation: 3,
    repsStrength: [4, 6], repsHypertrophy: [8, 12], repsEndurance: [12, 15],
    restCompound: 120, restIsolation: 90,
    maxExercises: 7,
  },
  advanced: {
    setsCompound: 4, setsIsolation: 3,
    repsStrength: [3, 5], repsHypertrophy: [6, 10], repsEndurance: [10, 15],
    restCompound: 150, restIsolation: 90,
    maxExercises: 8,
  },
}

// ─── Helpers ───

function detectDifficulty(prompt: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = prompt.toLowerCase()
  if (lower.includes('iniciante') || lower.includes('beginner') || lower.includes('fácil') || lower.includes('básico')) return 'beginner'
  if (lower.includes('avançado') || lower.includes('advanced') || lower.includes('difícil') || lower.includes('pesado')) return 'advanced'
  return 'intermediate'
}

function detectGoal(prompt: string): 'strength' | 'hypertrophy' | 'endurance' {
  const lower = prompt.toLowerCase()
  if (lower.includes('força') || lower.includes('strength') || lower.includes('pesado') || lower.includes('powerlifting')) return 'strength'
  if (lower.includes('resistência') || lower.includes('endurance') || lower.includes('cardio') || lower.includes('emagrecer')) return 'endurance'
  return 'hypertrophy'
}

function detectTimeLimit(prompt: string): number | null {
  const match = prompt.match(/(\d+)\s*min/)
  return match ? parseInt(match[1]) : null
}

function matchTemplate(prompt: string): WorkoutTemplate {
  const lower = prompt.toLowerCase()
  
  // Score each template
  let bestTemplate = WORKOUT_TEMPLATES[4] // fallback: Full Body
  let bestScore = 0

  for (const template of WORKOUT_TEMPLATES) {
    let score = 0
    for (const keyword of template.keywords) {
      if (lower.includes(keyword)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestTemplate = template
    }
  }

  return bestTemplate
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function pickExercises(
  muscleGroups: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  maxCount: number,
  isCardio: boolean
): Exercise[] {
  let pool: Exercise[]

  if (isCardio) {
    pool = EXERCISES.filter(e => e.movementType === 'cardio')
  } else {
    // Get exercises that hit the target muscles
    pool = EXERCISES.filter(e =>
      e.muscleGroups.some(mg => muscleGroups.includes(mg))
    )
  }

  // Filter by difficulty compatibility
  if (difficulty === 'beginner') {
    pool = pool.filter(e => e.difficulty !== 'advanced')
  }

  // Prioritize compounds first, then isolations
  const compounds = shuffle(pool.filter(e => e.movementType === 'compound'))
  const isolations = shuffle(pool.filter(e => e.movementType === 'isolation'))
  const cardio = shuffle(pool.filter(e => e.movementType === 'cardio'))

  const picked: Exercise[] = []

  // Add compounds first (2/3 of exercises)
  const compoundCount = Math.ceil(maxCount * 0.6)
  picked.push(...compounds.slice(0, compoundCount))

  // Fill rest with isolations
  const isoCount = maxCount - picked.length
  picked.push(...isolations.slice(0, isoCount))

  // Add cardio if it's a cardio template
  if (isCardio) {
    return cardio.slice(0, maxCount)
  }

  return picked.slice(0, maxCount)
}

// ─── Main generator ───

export function generateWorkoutPlan(userPrompt: string): AiGeneratedPlan {
  const difficulty = detectDifficulty(userPrompt)
  const goal = detectGoal(userPrompt)
  const timeLimit = detectTimeLimit(userPrompt)
  const template = matchTemplate(userPrompt)
  const preset = DIFFICULTY_PRESETS[difficulty]
  const isCardio = template.keywords.includes('hiit') || template.keywords.includes('cardio')

  // Adjust exercise count based on time
  let maxExercises = preset.maxExercises
  if (timeLimit) {
    // ~5 min per exercise as a rough estimate
    maxExercises = Math.min(maxExercises, Math.max(3, Math.floor(timeLimit / 5)))
  }

  const selectedExercises = pickExercises(template.muscleGroups, difficulty, maxExercises, isCardio)

  // Build the rep/set scheme based on goal
  const repsRange = goal === 'strength' ? preset.repsStrength
    : goal === 'endurance' ? preset.repsEndurance
    : preset.repsHypertrophy

  const exercises: AiGeneratedExercise[] = selectedExercises.map(ex => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: ex.movementType === 'compound' ? preset.setsCompound
      : ex.movementType === 'cardio' ? 1
      : preset.setsIsolation,
    reps_min: ex.movementType === 'cardio' ? 1 : repsRange[0],
    reps_max: ex.movementType === 'cardio' ? 1 : repsRange[1],
    rest_seconds: ex.movementType === 'compound' ? preset.restCompound
      : ex.movementType === 'cardio' ? 30
      : preset.restIsolation,
    weight_kg: null,
  }))

  const planName = timeLimit
    ? `${template.name} (${timeLimit}min)`
    : template.name

  const planDescription = template.description
    + (goal === 'strength' ? ' Foco em força com séries pesadas.' : '')
    + (goal === 'endurance' ? ' Foco em resistência com mais repetições.' : '')
    + (timeLimit ? ` Limitado a ~${timeLimit} minutos.` : '')

  return {
    name: planName,
    description: planDescription,
    difficulty,
    exercises,
  }
}

// Always available — no API key needed
export function isAiConfigured(): boolean {
  return true
}
