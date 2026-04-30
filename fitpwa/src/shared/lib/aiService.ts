export interface DbExercise {
  id: string
  name: string
  name_pt: string | null
  muscle_groups: string[]
  secondary_muscles: string[]
  equipment: string[]
  difficulty: number
}

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

// ─── DB exercise adapters ───

const ISOLATION_KEYWORDS = ['curl', 'fly', 'raise', 'extension', 'crunch', 'plank', 'twist', 'kickback', 'shrug', 'pullover', 'crossover', 'bridge']

function deriveMovementType(ex: DbExercise): 'compound' | 'isolation' | 'cardio' {
  const nameLower = ex.name.toLowerCase()
  if (ISOLATION_KEYWORDS.some(k => nameLower.includes(k))) return 'isolation'
  if ((ex.secondary_muscles?.length ?? 0) >= 1) return 'compound'
  return 'isolation'
}

function expandDbMuscle(mg: string): string[] {
  const map: Record<string, string[]> = {
    lats: ['back', 'lats'],
    'lower back': ['back'],
    back: ['back'],
    abdominals: ['abs', 'core'],
    obliques: ['abs', 'core', 'obliques'],
    quads: ['quads', 'legs'],
    hamstrings: ['hamstrings', 'legs'],
    glutes: ['glutes', 'legs'],
    calves: ['calves', 'legs'],
  }
  return map[mg] ?? [mg]
}

function dbDifficultyToPreset(difficulty: number): 'beginner' | 'intermediate' | 'advanced' {
  if (difficulty <= 2) return 'beginner'
  if (difficulty === 3) return 'intermediate'
  return 'advanced'
}

// Internal normalized representation built from DbExercise
interface NormalizedExercise {
  id: string
  name: string
  name_pt: string | null
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  movementType: 'compound' | 'isolation' | 'cardio'
}

function normalizeDbExercise(ex: DbExercise): NormalizedExercise {
  const muscleGroups = (ex.muscle_groups ?? []).flatMap(expandDbMuscle)
  const equipment = (ex.equipment ?? []).map(e => e.toLowerCase())
  return {
    id: ex.id,
    name: ex.name,
    name_pt: ex.name_pt,
    muscleGroups,
    equipment,
    difficulty: dbDifficultyToPreset(ex.difficulty),
    movementType: deriveMovementType(ex),
  }
}

// ─── Smarter Rule-Based AI Engine ───

function normalizeContext(prompt: string): string {
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function detectEquipment(prompt: string): string[] | null {
  const normalized = normalizeContext(prompt)
  const equipment = new Set<string>()

  if (normalized.match(/so (com )?peso corporal|apenas peso corporal|bodyweight|sem equipamento/)) {
    return []
  }

  if (normalized.match(/halter|halteres|dumbbell/)) equipment.add('dumbbell')
  if (normalized.match(/barra|barbell/)) {
    equipment.add('barbell')
    equipment.add('rack')
    equipment.add('bench')
  }
  if (normalized.match(/banco|bench/)) equipment.add('bench')
  if (normalized.match(/elastico|banda|band/)) equipment.add('resistance band')
  if (normalized.match(/kettlebell|kettle/)) equipment.add('kettlebell')
  if (normalized.match(/maquina|cabo|cable|ginasio/)) {
    equipment.add('machine')
    equipment.add('cable')
    equipment.add('smith machine')
    equipment.add('dip station')
    equipment.add('pull-up bar')
  }

  return equipment.size > 0 ? Array.from(equipment) : null
}

function detectLimitations(prompt: string): string[] {
  const normalized = normalizeContext(prompt)
  const limitations: string[] = []

  if (normalized.match(/dor(es)? (de|no|nos) joelho|problema joelho|knee pain/)) {
    limitations.push('knee_pain')
  }
  if (normalized.match(/dor(es)? (de|no|nos) ombro|problema ombro|shoulder pain/)) {
    limitations.push('shoulder_pain')
  }
  if (normalized.match(/dor(es)? (de|na|nas) costa|lombar/)) {
    limitations.push('back_pain')
  }

  return limitations
}

function detectDifficulty(prompt: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = normalizeContext(prompt)
  if (lower.match(/iniciante|beginner|facil|basico|comecar/)) return 'beginner'
  if (lower.match(/avancado|advanced|dificil|pesado|intenso|hardcore/)) return 'advanced'
  return 'intermediate'
}

function detectGoal(prompt: string): 'strength' | 'hypertrophy' | 'endurance' {
  const lower = normalizeContext(prompt)
  if (lower.match(/forca|strength|pesado|powerlifting/)) return 'strength'
  if (lower.match(/resistencia|endurance|cardio|emagrecer|secar|perder peso/)) return 'endurance'
  return 'hypertrophy'
}

function detectTimeLimit(prompt: string): number | null {
  const match = prompt.match(/(\d+)\s*min/)
  return match ? parseInt(match[1]) : null
}

function analyzeMuscleTargets(prompt: string): string[] {
  const lower = normalizeContext(prompt)
  const targets = new Set<string>()

  if (lower.match(/peito|chest|supino|empurrar/)) targets.add('chest')
  if (lower.match(/costa|back|puxar/)) targets.add('back')
  if (lower.match(/ombro|shoulder|deltoide/)) targets.add('shoulders')
  if (lower.match(/bicep/)) targets.add('biceps')
  if (lower.match(/tricep/)) targets.add('triceps')
  if (lower.match(/braco|arm/)) { targets.add('biceps'); targets.add('triceps') }
  if (lower.match(/perna|leg|quad/)) {
    targets.add('legs')
    targets.add('quads')
    if (!lower.match(/gluteo|glute/)) {
      targets.add('hamstrings'); targets.add('calves')
    }
  }
  if (lower.match(/gluteo|glute|bunda|posterior/)) {
    targets.add('glutes')
    if (lower.match(/posterior|hamstring/)) {
      targets.add('hamstrings')
    }
  }
  if (lower.match(/abs|abdominal|core/)) { targets.add('abs'); targets.add('core'); targets.add('obliques') }

  if (lower.match(/superior|upper/)) { targets.add('chest'); targets.add('back'); targets.add('shoulders'); targets.add('biceps'); targets.add('triceps') }
  if (lower.match(/inferior|lower/)) { targets.add('legs'); targets.add('glutes'); targets.add('hamstrings'); targets.add('calves') }
  if (lower.match(/push/)) { targets.add('chest'); targets.add('shoulders'); targets.add('triceps') }
  if (lower.match(/pull/)) { targets.add('back'); targets.add('biceps') }
  if (lower.match(/corpo inteiro|full body/)) { targets.add('chest'); targets.add('back'); targets.add('legs'); targets.add('shoulders'); targets.add('abs') }

  return Array.from(targets)
}

function isExerciseAllowed(ex: NormalizedExercise, equipment: string[] | null, limitations: string[]): boolean {
  if (equipment !== null) {
    if (ex.equipment.length > 0) {
      // Equipment in both ex.equipment and the passed list are already lowercased
      const hasRequiredGear = ex.equipment.every(req => equipment.includes(req))
      if (!hasRequiredGear) return false
    }
  }

  if (limitations.includes('knee_pain')) {
    const hazardous = ['squat', 'leg press', 'jump', 'lunge', 'step-up', 'sprint']
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz))) return false
  }

  if (limitations.includes('shoulder_pain')) {
    const hazardous = ['military', 'overhead', 'dip', 'snatch', 'thruster', 'lateral']
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz))) return false
  }

  if (limitations.includes('back_pain')) {
    const hazardous = ['deadlift', 'good morning', 'bent row', 't-bar']
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz))) return false
  }

  return true
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function pickSmartExercises(
  pool: NormalizedExercise[],
  targetMuscles: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  maxCount: number,
  isCardioRequested: boolean,
  equipmentConstraints: string[] | null,
  limitations: string[]
): NormalizedExercise[] {

  let filtered = pool.filter(ex => isExerciseAllowed(ex, equipmentConstraints, limitations))

  if (targetMuscles.length > 0) {
    const strictPool = filtered.filter(ex => ex.muscleGroups.some(mg => targetMuscles.includes(mg)))
    if (strictPool.length >= 2) {
      filtered = strictPool
    }
  }

  if (difficulty === 'beginner') {
    filtered = filtered.filter(e => e.difficulty !== 'advanced')
  }

  const picked = new Set<NormalizedExercise>()

  const targetCompounds = shuffle(filtered.filter(e => e.movementType === 'compound'))
  const targetIsolations = shuffle(filtered.filter(e => e.movementType === 'isolation'))
  const cardio = shuffle(filtered.filter(e => e.movementType === 'cardio'))

  if (isCardioRequested && targetMuscles.length === 0) {
    return cardio.slice(0, maxCount)
  }

  const missingMuscles = [...targetMuscles]

  for (const muscle of targetMuscles) {
    if (picked.size >= Math.ceil(maxCount * 0.6)) break

    const ex = targetCompounds.find(e => e.muscleGroups.includes(muscle) && !picked.has(e))
    if (ex) {
      picked.add(ex)
      ex.muscleGroups.forEach(mg => {
        const idx = missingMuscles.indexOf(mg)
        if (idx > -1) missingMuscles.splice(idx, 1)
      })
    }
  }

  for (const muscle of targetMuscles) {
    if (picked.size >= maxCount - (isCardioRequested ? 1 : 0)) break

    const exIso = targetIsolations.find(e => e.muscleGroups.includes(muscle) && !picked.has(e))
    if (exIso) picked.add(exIso)
  }

  if (isCardioRequested && cardio.length > 0 && picked.size < maxCount) {
    picked.add(cardio[0])
  }

  if (picked.size < maxCount) {
    for (const ex of targetCompounds) {
      if (picked.size >= maxCount) break
      if (!picked.has(ex) && ex.muscleGroups.some(mg => targetMuscles.includes(mg))) {
        picked.add(ex)
      }
    }
  }

  return Array.from(picked)
}

// ─── Main generator ───

export function generateWorkoutPlan(
  userPrompt: string,
  dbExercises: DbExercise[],
  lang: string = 'pt'
): AiGeneratedPlan {
  // 1. Context Parsing
  const difficulty = detectDifficulty(userPrompt)
  const goal = detectGoal(userPrompt)
  const timeLimit = detectTimeLimit(userPrompt)
  const equipment = detectEquipment(userPrompt)
  const limitations = detectLimitations(userPrompt)

  let targetMuscles = analyzeMuscleTargets(userPrompt)
  const isCardio = normalizeContext(userPrompt).match(/hiit|cardio|emagrecer|suar|queimar/) !== null

  if (targetMuscles.length === 0 && !isCardio) {
    targetMuscles = ['chest', 'back', 'legs', 'shoulders', 'abs']
  }

  const preset = DIFFICULTY_PRESETS[difficulty]

  // 2. Dynamic Rules (Time vs Volume)
  let maxExercises = preset.maxExercises
  if (timeLimit) {
    const timePerExerciseMins = 6.5
    maxExercises = Math.max(2, Math.floor(timeLimit / timePerExerciseMins))
  }

  // 3. Normalize DB exercises
  const normalizedPool = dbExercises.map(normalizeDbExercise)

  // 4. Selection
  const selectedExercises = pickSmartExercises(
    normalizedPool,
    targetMuscles,
    difficulty,
    maxExercises,
    isCardio,
    equipment,
    limitations
  )

  if (selectedExercises.length === 0) {
    throw new Error(lang === 'pt'
      ? "Não encontrei exercícios que correspondam às tuas limitações/equipamento. Tenta ser menos restritivo!"
      : "Could not find exercises matching your limitations/equipment. Try to be less restrictive!")
  }

  // 5. Volume Mapping
  const repsRange = goal === 'strength' ? preset.repsStrength
    : goal === 'endurance' ? preset.repsEndurance
    : preset.repsHypertrophy

  const exercises: AiGeneratedExercise[] = selectedExercises.map(ex => ({
    exercise_id: ex.id,
    name: lang === 'pt' ? ex.name_pt || ex.name : ex.name,
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

  // 6. Intelligent Naming & Description
  const muscleString = targetMuscles.length > 3
    ? (lang === 'pt' ? 'Corpo Inteiro' : 'Full Body')
    : targetMuscles.join(', ')
  const modeString = isCardio && targetMuscles.length > 0
    ? (lang === 'pt' ? '+ Cardio' : '+ Cardio')
    : ''
  const planName = timeLimit
    ? (lang === 'pt' ? `Treino Dinâmico de ${timeLimit} min` : `Dynamic Workout of ${timeLimit} min`)
    : (lang === 'pt' ? `Plano Gerado: ${muscleString} ${modeString}` : `Generated Plan: ${muscleString} ${modeString}`)

  let description = lang === 'pt'
    ? `Treino gerado à medida. Foco em ${goal === 'strength' ? 'força' : goal === 'endurance' ? 'resistência' : 'hipertrofia'}.`
    : `Custom generated workout. Focus on ${goal === 'strength' ? 'strength' : goal === 'endurance' ? 'endurance' : 'hypertrophy'}.`

  if (equipment !== null) {
    if (equipment.length === 0) {
      description += lang === 'pt'
        ? ' Sem recurso a equipamento (apenas peso corporal).'
        : ' No equipment needed (bodyweight only).'
    } else {
      description += lang === 'pt' ? ' Equipamento filtrado.' : ' Equipment filtered.'
    }
  }
  if (limitations.length > 0) {
    description += lang === 'pt'
      ? ' Adaptado para evitar sobrecarga nas tuas limitações articulatórias.'
      : ' Adapted to avoid overloading your joint limitations.'
  }

  return {
    name: planName,
    description,
    difficulty,
    exercises,
  }
}
