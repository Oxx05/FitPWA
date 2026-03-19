export interface BaseWorkoutExercise {
  exerciseId: string
  sets: number
}

export interface BaseWorkout {
  id: string
  name: string
  name_pt?: string
  description: string
  description_pt?: string
  type: string
  difficulty: string
  daysPerWeek: number
  exercises: BaseWorkoutExercise[]
}

export const BASE_WORKOUTS: BaseWorkout[] = [
  {
    id: 'full-body-3x',
    name: 'Full Body 3x/week',
    name_pt: 'Corpo Inteiro 3x/semana',
    description: 'Beginner full body workout. 3 days per week, compound movements.',
    description_pt: 'Treino de corpo inteiro para iniciantes. 3 dias por semana, movimentos compostos.',
    type: 'full_body',
    difficulty: 'beginner',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'squat', sets: 4 },
      { exerciseId: 'bench-press', sets: 3 },
      { exerciseId: 'bent-row', sets: 3 },
      { exerciseId: 'military-press', sets: 3 },
      { exerciseId: 'barbell-curl', sets: 3 },
      { exerciseId: 'tricep-pushdown', sets: 3 },
    ]
  },
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs',
    name_pt: 'Push/Pull/Legs',
    description: 'Classic PPL split. Push (Chest/Shoulder/Triceps) | Pull (Back/Biceps) | Legs.',
    description_pt: 'Split clássico PPL. Empurra (Peito/Ombro/Tríceps) | Puxa (Costas/Bíceps) | Pernas.',
    type: 'bodypart_split',
    difficulty: 'intermediate',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'bench-press', sets: 4 },
      { exerciseId: 'incline-bench', sets: 3 },
      { exerciseId: 'military-press', sets: 4 },
      { exerciseId: 'lateral-raise', sets: 3 },
      { exerciseId: 'tricep-dip', sets: 3 },
      { exerciseId: 'rope-pushdown', sets: 3 },
    ]
  },
  {
    id: 'upper-lower',
    name: 'Upper/Lower',
    name_pt: 'Superior/Inferior',
    description: 'Upper and lower body split. 4 days per week, great for hypertrophy.',
    description_pt: 'Divisão trem superior e inferior. 4 dias por semana, ótimo para ganho de massa.',
    type: 'bodypart_split',
    difficulty: 'intermediate',
    daysPerWeek: 4,
    exercises: [
      { exerciseId: 'bench-press', sets: 4 },
      { exerciseId: 'squat', sets: 4 },
      { exerciseId: 'bent-row', sets: 4 },
    ]
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio',
    name_pt: 'HIIT Cardio',
    description: 'High intensity cardiovascular workout. No equipment needed.',
    description_pt: 'Treino cardiovascular de alta intensidade. Nenhum equipamento necessário.',
    type: 'cardio',
    difficulty: 'advanced',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'burpees', sets: 10 },
      { exerciseId: 'box-jump', sets: 8 },
    ]
  },
  {
    id: 'hypertrophy-5x',
    name: 'Hypertrophy 5x/week',
    name_pt: 'Hipertrofia 5x/semana',
    description: 'Advanced hypertrophy program. 5 days focused on volume.',
    description_pt: 'Programa de hipertrofia avançado. 5 dias focados em volume.',
    type: 'hypertrophy',
    difficulty: 'advanced',
    daysPerWeek: 5,
    exercises: [
      { exerciseId: 'bench-press', sets: 4 },
      { exerciseId: 'incline-bench', sets: 3 },
    ]
  },
  {
    id: 'beginner-strength',
    name: 'Beginner Strength',
    name_pt: 'Força para Iniciantes',
    description: 'Strength for beginners. Focus on 4 main compound movements.',
    description_pt: 'Força para iniciantes. Enfoque em 4 movimentos compostos principais.',
    type: 'strength',
    difficulty: 'beginner',
    daysPerWeek: 3,
    exercises: [
      { exerciseId: 'squat', sets: 5 },
      { exerciseId: 'bench-press', sets: 5 },
    ]
  }
]
