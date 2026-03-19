export interface Exercise {
  id: string
  name: string
  name_pt?: string
  muscleGroups: string[]
  movementType: 'compound' | 'isolation' | 'cardio'
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  description_pt?: string
  imageUrl?: string // URL para imagem do exercício
  videoUrl?: string // URL para vídeo de como fazer
}

export const EXERCISES: Exercise[] = [
  // PEITO (Chest)
  { id: 'bench-press', name: 'Supino (Barbell)', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25ddfcf2e1e?w=400', description: 'Exercício composto fundamental para peito' },
  { id: 'incline-bench', name: 'Supino Inclinado', muscleGroups: ['chest', 'triceps', 'shoulders'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1540497905618-92f4e867f8c4?w=400' },
  { id: 'dumbbell-press', name: 'Supino com Halteres', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner', imageUrl: 'https://images.unsplash.com/photo-1594381898348-846ce24fbf08?w=400' },
  { id: 'cable-fly', name: 'Pec Deck / Fly (Cable)', muscleGroups: ['chest'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroups: ['chest'], movementType: 'isolation', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner' },
  { id: 'decline-bench', name: 'Supino Declinado', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate' },
  { id: 'incline-dumbbell-press', name: 'Supino Inclinado com Halteres', muscleGroups: ['chest', 'triceps', 'shoulders'], movementType: 'compound', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner' },
  { id: 'chest-press-machine', name: 'Chest Press (Máquina)', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'cable-crossover', name: 'Crossover no Cabo', muscleGroups: ['chest'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dip-chest', name: 'Mergulho para Peito', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Dip Station'], difficulty: 'intermediate' },
  { id: 'smith-bench', name: 'Supino no Smith', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Smith Machine'], difficulty: 'beginner' },
  { id: 'floor-press', name: 'Supino no Chão', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: ['Barbell', 'Dumbbell'], difficulty: 'intermediate' },
  { id: 'landmine-press', name: 'Landmine Press', muscleGroups: ['chest', 'shoulders', 'triceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'push-ups', name: 'Flexões (Push-ups)', muscleGroups: ['chest', 'triceps'], movementType: 'compound', equipment: [], difficulty: 'beginner', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { id: 'machine-press', name: 'Máquina de Supino', muscleGroups: ['chest'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'resistance-band-fly', name: 'Fly com Banda Elástica', muscleGroups: ['chest'], movementType: 'isolation', equipment: ['Resistance Band'], difficulty: 'beginner' },

  // COSTAS (Back)
  { id: 'deadlift', name: 'Levantamento Morto (Deadlift)', muscleGroups: ['back', 'legs', 'glutes'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced', imageUrl: 'https://images.unsplash.com/photo-1572119786900-79f38a4a5d0d?w=400', description: 'O exercício mais exigente' },
  { id: 'bent-row', name: 'Linha Inclinada (Bent Row)', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'dumbbell-row', name: 'Linha com Halteres', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'pull-ups', name: 'Dominadas (Pull-ups)', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Pull-up Bar'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { id: 'lat-pulldown', name: 'Puxada Frontal (Lat Pulldown)', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'assisted-pull-up', name: 'Dominadas Assistidas', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['back', 'shoulders'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'machine-row', name: 'Máquina de Linha', muscleGroups: ['back'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'cable-row', name: 'Linha por Cabo', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'seal-row', name: 'Seal Row', muscleGroups: ['back'], movementType: 'compound', equipment: ['Barbell', 'Bench'], difficulty: 'advanced' },
  { id: 't-bar-row', name: 'Remada T-Bar', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'chest-supported-row', name: 'Remada Apoiada no Peito', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Dumbbell', 'Bench'], difficulty: 'beginner' },
  { id: 'single-arm-cable-row', name: 'Remada Unilateral no Cabo', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'straight-arm-pulldown', name: 'Pulldown com Braço Estendido', muscleGroups: ['back'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'lat-pullover', name: 'Pullover', muscleGroups: ['back', 'chest'], movementType: 'isolation', equipment: ['Dumbbell', 'Cable Machine'], difficulty: 'beginner' },
  { id: 'inverted-row', name: 'Remada Invertida', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'trap-bar-deadlift', name: 'Deadlift com Trap Bar', muscleGroups: ['legs', 'back', 'glutes'], movementType: 'compound', equipment: ['Trap Bar'], difficulty: 'intermediate' },
  { id: 'neutral-grip-pulldown', name: 'Puxada Neutra', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'v-bar-pulldown', name: 'Puxada V', muscleGroups: ['back', 'biceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'meadows-row', name: 'Meadows Row', muscleGroups: ['back'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'reverse-fly-machine', name: 'Reverse Fly (Máquina)', muscleGroups: ['back', 'shoulders'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'back-extension', name: 'Extensão Lombar', muscleGroups: ['back'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },

  // OMBROS (Shoulders)
  { id: 'military-press', name: 'Press Militar (Military Press)', muscleGroups: ['shoulders', 'triceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1540497905618-92f4e867f8c4?w=400' },
  { id: 'shoulder-press', name: 'Desenvolvimento de Ombro', muscleGroups: ['shoulders', 'triceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'lateral-raise', name: 'Elevação Lateral', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'front-raise', name: 'Elevação Frontal', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Dumbbell', 'Barbell'], difficulty: 'beginner' },
  { id: 'rear-delt-fly', name: 'Fly Posterior', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Dumbbell', 'Machine'], difficulty: 'beginner' },
  { id: 'machine-shoulder-press', name: 'Máquina de Ombro', muscleGroups: ['shoulders'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'upright-row', name: 'Linha Alta (Upright Row)', muscleGroups: ['shoulders', 'biceps'], movementType: 'compound', equipment: ['Barbell', 'Dumbbell'], difficulty: 'intermediate' },
  { id: 'shrug', name: 'Encolhimento de Ombros (Shrug)', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroups: ['shoulders', 'triceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'intermediate' },
  { id: 'cable-lateral-raise', name: 'Elevação Lateral no Cabo', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'rear-delt-cable', name: 'Posterior no Cabo', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'cuban-press', name: 'Cuban Press', muscleGroups: ['shoulders'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'advanced' },
  { id: 'y-raise', name: 'Elevação Y', muscleGroups: ['shoulders'], movementType: 'isolation', equipment: ['Dumbbell', 'Cable Machine'], difficulty: 'beginner' },

  // BÍCEPS (Biceps)
  { id: 'barbell-curl', name: 'Rosca Barbell', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'dumbbell-curl', name: 'Rosca com Halteres', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'cable-curl', name: 'Rosca por Cabo', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'hammer-curl', name: 'Rosca Martelo', muscleGroups: ['biceps', 'forearms'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'preacher-curl', name: 'Rosca Barbell Inclinada', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Barbell', 'Bench'], difficulty: 'beginner' },
  { id: 'machine-curl', name: 'Máquina de Rosca', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'concentration-curl', name: 'Rosca de Concentração', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'incline-dumbbell-curl', name: 'Rosca Inclinado com Halteres', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Dumbbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'spider-curl', name: 'Rosca Spider', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Barbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'ez-bar-curl', name: 'Rosca EZ', muscleGroups: ['biceps'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'reverse-curl', name: 'Rosca Reversa', muscleGroups: ['biceps', 'forearms'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'cable-hammer-curl', name: 'Rosca Martelo no Cabo', muscleGroups: ['biceps', 'forearms'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },

  // TRÍCEPS (Triceps)
  { id: 'tricep-dip', name: 'Mergulho de Tríceps', muscleGroups: ['triceps', 'chest'], movementType: 'compound', equipment: ['Dip Station'], difficulty: 'intermediate' },
  { id: 'tricep-extension', name: 'Extensão de Tríceps (Overhead)', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Dumbbell', 'Barbell'], difficulty: 'beginner' },
  { id: 'rope-pushdown', name: 'Push Down com Corda', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'tricep-pushdown', name: 'Push Down de Tríceps', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'overhead-extension', name: 'Extensão Aérea', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'machine-tricep', name: 'Máquina de Tríceps', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'close-grip-bench', name: 'Supino com Grip Fechado', muscleGroups: ['triceps', 'chest'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate' },
  { id: 'bench-dips', name: 'Dips no Banco', muscleGroups: ['triceps'], movementType: 'compound', equipment: ['Bench'], difficulty: 'beginner' },
  { id: 'cable-overhead-rope', name: 'Extensão no Cabo com Corda', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'diamond-pushup', name: 'Flexões Diamante', muscleGroups: ['triceps', 'chest'], movementType: 'compound', equipment: [], difficulty: 'beginner' },
  { id: 'single-arm-pushdown', name: 'Pushdown Unilateral', muscleGroups: ['triceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dip-assist', name: 'Dip Assistido', muscleGroups: ['triceps', 'chest'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },

  // ANTEBRAÇO (Forearms)
  { id: 'wrist-curl', name: 'Flexão de Pulso', muscleGroups: ['forearms'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'reverse-wrist-curl', name: 'Flexão Reversa de Pulso', muscleGroups: ['forearms'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'farmer-walk', name: 'Andar do Fazendeiro', muscleGroups: ['forearms', 'grip'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'wrist-roller', name: 'Wrist Roller', muscleGroups: ['forearms'], movementType: 'isolation', equipment: ['Other'], difficulty: 'beginner' },

  // PERNAS (Legs/Quads)
  { id: 'squat', name: 'Agachamento (Back Squat)', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Barbell', 'Rack'], difficulty: 'advanced' },
  { id: 'front-squat', name: 'Agachamento Frontal', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Barbell', 'Rack'], difficulty: 'advanced' },
  { id: 'goblet-squat', name: 'Agachamento com Halter', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Machine'], difficulty: 'intermediate' },
  { id: 'smith-squat', name: 'Agachamento Smith', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Smith Machine'], difficulty: 'beginner' },
  { id: 'leg-extension', name: 'Extensão de Perna', muscleGroups: ['quads'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'sissy-squat', name: 'Sissy Squat', muscleGroups: ['quads'], movementType: 'isolation', equipment: [], difficulty: 'intermediate' },
  { id: 'split-squat', name: 'Agachamento Búlgaro', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Dumbbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'lunges', name: 'Avanço (Lunges)', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'step-up', name: 'Step-Up', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Bench', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'leg-press-horizontal', name: 'Leg Press Horizontal', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'belt-squat', name: 'Belt Squat', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Machine'], difficulty: 'intermediate' },
  { id: 'box-squat', name: 'Agachamento ao Banco', muscleGroups: ['legs', 'glutes'], movementType: 'compound', equipment: ['Barbell', 'Box'], difficulty: 'intermediate' },

  // FEMORAIS (Hamstrings)
  { id: 'leg-curl', name: 'Flexão de Perna', muscleGroups: ['hamstrings'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'lying-leg-curl', name: 'Flexão de Perna Deitado', muscleGroups: ['hamstrings'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'nordic-curl', name: 'Nordic Curl', muscleGroups: ['hamstrings'], movementType: 'isolation', equipment: [], difficulty: 'advanced' },
  { id: 'glute-ham-raise', name: 'Glute Ham Raise', muscleGroups: ['hamstrings', 'glutes'], movementType: 'compound', equipment: ['Machine'], difficulty: 'advanced' },
  { id: 'romanian-deadlift', name: 'Levantamento Morto Romeno', muscleGroups: ['hamstrings', 'glutes', 'back'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'stiff-deadlift', name: 'Levantamento Morto Rígido', muscleGroups: ['hamstrings', 'back'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'seated-leg-curl', name: 'Flexão de Perna Sentado', muscleGroups: ['hamstrings'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'good-morning', name: 'Good Morning', muscleGroups: ['hamstrings', 'glutes', 'back'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'single-leg-rdl', name: 'RDL Unilateral', muscleGroups: ['hamstrings', 'glutes'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'intermediate' },
  { id: 'kettlebell-deadlift', name: 'Deadlift com Kettlebell', muscleGroups: ['hamstrings', 'glutes'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'beginner' },

  // GLÚTEOS (Glutes)
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['glutes', 'legs'], movementType: 'compound', equipment: ['Barbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'glute-bridge', name: 'Ponte de Glúteos', muscleGroups: ['glutes'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'cable-kick-back', name: 'Chute Traseiro (Cable)', muscleGroups: ['glutes'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'machine-adductor', name: 'Máquina Adutora', muscleGroups: ['glutes', 'legs'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'machine-abductor', name: 'Máquina Abdutora', muscleGroups: ['glutes'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'pendulum-squat', name: 'Agachamento Pêndulo', muscleGroups: ['glutes', 'legs'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'hip-abduction-band', name: 'Abdução com Banda', muscleGroups: ['glutes'], movementType: 'isolation', equipment: ['Resistance Band'], difficulty: 'beginner' },
  { id: 'cable-hip-abduction', name: 'Abdução no Cabo', muscleGroups: ['glutes'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'frog-pumps', name: 'Frog Pumps', muscleGroups: ['glutes'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },

  // CORE / ABS
  { id: 'crunch', name: 'Abdominais (Crunch)', muscleGroups: ['abs'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'ab-wheel', name: 'Ab Wheel', muscleGroups: ['abs', 'core'], movementType: 'isolation', equipment: ['Ab Wheel'], difficulty: 'intermediate' },
  { id: 'cable-crunch', name: 'Abdominais por Cabo', muscleGroups: ['abs'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'cable-woodchop', name: 'Movimento de Lenhador', muscleGroups: ['abs', 'obliques'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'hanging-leg-raise', name: 'Elevação de Perna Suspensa', muscleGroups: ['abs'], movementType: 'isolation', equipment: ['Pull-up Bar'], difficulty: 'intermediate' },
  { id: 'machine-ab', name: 'Máquina de Abdominais', muscleGroups: ['abs'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'planks', name: 'Prancha (Plank)', muscleGroups: ['abs', 'core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroups: ['abs', 'core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroups: ['obliques', 'core'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroups: ['obliques', 'core'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'side-plank', name: 'Prancha Lateral', muscleGroups: ['obliques', 'core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'hanging-knee-raise', name: 'Elevação de Joelhos Suspensa', muscleGroups: ['abs'], movementType: 'isolation', equipment: ['Pull-up Bar'], difficulty: 'beginner' },
  { id: 'reverse-crunch', name: 'Crunch Reverso', muscleGroups: ['abs'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'hollow-hold', name: 'Hollow Hold', muscleGroups: ['core', 'abs'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'cable-side-bend', name: 'Flexão Lateral no Cabo', muscleGroups: ['obliques'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },

  // CARDIO
  { id: 'treadmill', name: 'Esteira (Treadmill)', muscleGroups: [], movementType: 'cardio', equipment: ['Treadmill'], difficulty: 'beginner' },
  { id: 'stationary-bike', name: 'Bicicleta Estática', muscleGroups: ['legs'], movementType: 'cardio', equipment: ['Stationary Bike'], difficulty: 'beginner' },
  { id: 'rowing-machine', name: 'Máquina de Remo', muscleGroups: ['back', 'legs'], movementType: 'cardio', equipment: ['Rowing Machine'], difficulty: 'intermediate' },
  { id: 'elliptical', name: 'Elíptica', muscleGroups: ['legs'], movementType: 'cardio', equipment: ['Elliptical'], difficulty: 'beginner' },
  { id: 'jump-rope', name: 'Corda de Pular', muscleGroups: ['legs', 'arms'], movementType: 'cardio', equipment: ['Jump Rope'], difficulty: 'beginner' },
  { id: 'battle-ropes', name: 'Battle Ropes', muscleGroups: ['arms', 'core'], movementType: 'cardio', equipment: ['Battle Ropes'], difficulty: 'intermediate' },
  { id: 'burpees', name: 'Burpees', muscleGroups: [], movementType: 'cardio', equipment: [], difficulty: 'intermediate' },
  { id: 'box-jump', name: 'Salto para Caixa', muscleGroups: ['legs'], movementType: 'cardio', equipment: ['Plyo Box'], difficulty: 'intermediate' },
  { id: 'sprints', name: 'Sprints', muscleGroups: ['legs'], movementType: 'cardio', equipment: [], difficulty: 'beginner' },
  { id: 'stair-climber', name: 'Escadas (Stair Climber)', muscleGroups: ['legs'], movementType: 'cardio', equipment: ['Stair Climber'], difficulty: 'beginner' },
  { id: 'assault-bike', name: 'Air Bike', muscleGroups: ['legs', 'arms'], movementType: 'cardio', equipment: ['Assault Bike'], difficulty: 'intermediate' },
  { id: 'ski-erg', name: 'SkiErg', muscleGroups: ['back', 'arms'], movementType: 'cardio', equipment: ['SkiErg'], difficulty: 'intermediate' },

  // COMPLEX / MOVEMENTS
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroups: ['glutes', 'legs', 'core'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'intermediate' },
  { id: 'tire-flip', name: 'Tire Flip', muscleGroups: ['legs', 'back'], movementType: 'compound', equipment: ['Tire'], difficulty: 'advanced' },
  { id: 'sled-push', name: 'Empurrão de Trenó', muscleGroups: ['legs'], movementType: 'compound', equipment: ['Sled'], difficulty: 'intermediate' },
  { id: 'sled-drag', name: 'Arrasto de Trenó', muscleGroups: ['legs'], movementType: 'compound', equipment: ['Sled'], difficulty: 'intermediate' },
  { id: 'powerclean', name: 'Power Clean', muscleGroups: ['legs', 'back', 'shoulders'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'thrusters', name: 'Thrusters', muscleGroups: ['legs', 'shoulders', 'arms'], movementType: 'compound', equipment: ['Dumbbell', 'Barbell'], difficulty: 'intermediate' },
  { id: 'turkish-getup', name: 'Turkish Get-up', muscleGroups: ['core', 'shoulders'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'advanced' },

  // PANTURRILHAS (Calves)
  { id: 'standing-calf-raise', name: 'Elevação de Gémeos em Pé', muscleGroups: ['calves'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'seated-calf-raise', name: 'Elevação de Gémeos Sentado', muscleGroups: ['calves'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'donkey-calf-raise', name: 'Elevação de Gémeos Donkey', muscleGroups: ['calves'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'single-leg-calf-raise', name: 'Elevação de Gémeos Unilateral', muscleGroups: ['calves'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
]

// Organizar por grupo muscular
export const EXERCISES_BY_MUSCLE_GROUP = {
  chest: EXERCISES.filter(e => e.muscleGroups.includes('chest')),
  back: EXERCISES.filter(e => e.muscleGroups.includes('back')),
  shoulders: EXERCISES.filter(e => e.muscleGroups.includes('shoulders')),
  biceps: EXERCISES.filter(e => e.muscleGroups.includes('biceps')),
  triceps: EXERCISES.filter(e => e.muscleGroups.includes('triceps')),
  forearms: EXERCISES.filter(e => e.muscleGroups.includes('forearms')),
  legs: EXERCISES.filter(e => e.muscleGroups.includes('legs')),
  hamstrings: EXERCISES.filter(e => e.muscleGroups.includes('hamstrings')),
  glutes: EXERCISES.filter(e => e.muscleGroups.includes('glutes')),
  abs: EXERCISES.filter(e => e.muscleGroups.includes('abs')),
  core: EXERCISES.filter(e => e.muscleGroups.includes('core')),
  obliques: EXERCISES.filter(e => e.muscleGroups.includes('obliques')),
  calves: EXERCISES.filter(e => e.muscleGroups.includes('calves')),
}
