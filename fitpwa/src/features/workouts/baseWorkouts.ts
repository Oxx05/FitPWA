export interface BaseWorkoutExercise {
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
}

export interface BaseWorkout {
  id: string
  name: string
  description: string
  type: string
  difficulty: string
  daysPerWeek: number
  exercises: BaseWorkoutExercise[]
}

export const BASE_WORKOUTS: BaseWorkout[] = [
  {
    id: 'full-body-3x',
    name: 'Full Body 3x/week',
    description: 'Treino de corpo inteiro para iniciantes. 3 dias por semana, movimentos compostos.',
    type: 'full_body',
    difficulty: 'beginner',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'squat', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'bench-press', sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'bent-row', sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'military-press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseId: 'barbell-curl', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 60 },
      { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
    ]
  },
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs',
    description: 'Split clássico PPL. Empurra (Peito/Ombro/Tríceps) | Puxa (Costas/Bíceps) | Pernas.',
    type: 'bodypart_split',
    difficulty: 'intermediate',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'incline-bench', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseId: 'military-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'lateral-raise', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
      { exerciseId: 'tricep-dip', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90 },
      { exerciseId: 'rope-pushdown', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
    ]
  },
  {
    id: 'upper-lower',
    name: 'Upper/Lower',
    description: 'Divisão trem superior e inferior. 4 dias por semana, ótimo para ganho de massa.',
    type: 'bodypart_split',
    difficulty: 'intermediate',
    daysPerWeek: 4,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'squat', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
      { exerciseId: 'bent-row', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120 },
    ]
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio',
    description: 'Treino cardiovascular de alta intensidade. Nenhum equipamento necessário.',
    type: 'cardio',
    difficulty: 'advanced',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'burpees', sets: 10, repsMin: 30, repsMax: 30, restSeconds: 30 },
      { exerciseId: 'box-jump', sets: 8, repsMin: 10, repsMax: 10, restSeconds: 40 },
    ]
  },
  {
    id: 'hypertrophy-5x',
    name: 'Hypertrophy 5x/week',
    description: 'Programa de hipertrofia avançado. 5 dias focados em volume.',
    type: 'hypertrophy',
    difficulty: 'advanced',
    daysPerWeek: 5,
    exercises: [
      { exerciseId: 'bench-press', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90 },
      { exerciseId: 'incline-bench', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90 },
    ]
  },
  {
    id: 'beginner-strength',
    name: 'Beginner Strength',
    description: 'Força para iniciantes. Enfoque em 4 movimentos compostos principais.',
    type: 'strength',
    difficulty: 'beginner',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'squat', sets: 5, repsMin: 3, repsMax: 5, restSeconds: 180 },
      { exerciseId: 'bench-press', sets: 5, repsMin: 3, repsMax: 5, restSeconds: 180 },
    ]
  }
]
