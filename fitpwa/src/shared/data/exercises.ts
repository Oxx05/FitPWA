export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  movementType: 'compound' | 'isolation' | 'cardio'
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  imageUrl?: string // URL para imagem do exercício
  videoUrl?: string // URL para vídeo de como fazer
}

export const EXERCISES: Exercise[] = [
  // PEITO (Chest)
  { id: 'bench-press', name: 'Supino (Barbell)', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25ddfcf2e1e?w=400', description: 'Exercício composto fundamental para peito' },
  { id: 'incline-bench', name: 'Supino Inclinado', muscleGroups: ['Peito', 'Tríceps', 'Ombro'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1540497905618-92f4e867f8c4?w=400' },
  { id: 'dumbbell-press', name: 'Supino com Halteres', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner', imageUrl: 'https://images.unsplash.com/photo-1594381898348-846ce24fbf08?w=400' },
  { id: 'cable-fly', name: 'Pec Deck / Fly (Cable)', muscleGroups: ['Peito'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroups: ['Peito'], movementType: 'isolation', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner' },
  { id: 'decline-bench', name: 'Supino Declinado', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate' },
  { id: 'incline-dumbbell-press', name: 'Supino Inclinado com Halteres', muscleGroups: ['Peito', 'Tríceps', 'Ombro'], movementType: 'compound', equipment: ['Dumbbell', 'Banco'], difficulty: 'beginner' },
  { id: 'chest-press-machine', name: 'Chest Press (Máquina)', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'cable-crossover', name: 'Crossover no Cabo', muscleGroups: ['Peito'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dip-chest', name: 'Mergulho para Peito', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Dip Station'], difficulty: 'intermediate' },
  { id: 'smith-bench', name: 'Supino no Smith', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Smith Machine'], difficulty: 'beginner' },
  { id: 'floor-press', name: 'Supino no Chão', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: ['Barbell', 'Dumbbell'], difficulty: 'intermediate' },
  { id: 'landmine-press', name: 'Landmine Press', muscleGroups: ['Peito', 'Ombro', 'Tríceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'push-ups', name: 'Flexões (Push-ups)', muscleGroups: ['Peito', 'Tríceps'], movementType: 'compound', equipment: [], difficulty: 'beginner', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' },
  { id: 'machine-press', name: 'Máquina de Supino', muscleGroups: ['Peito'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'resistance-band-fly', name: 'Fly com Banda Elástica', muscleGroups: ['Peito'], movementType: 'isolation', equipment: ['Resistance Band'], difficulty: 'beginner' },

  // COSTAS (Back)
  { id: 'deadlift', name: 'Levantamento Morto (Deadlift)', muscleGroups: ['Costas', 'Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced', imageUrl: 'https://images.unsplash.com/photo-1572119786900-79f38a4a5d0d?w=400', description: 'O exercício mais exigente' },
  { id: 'bent-row', name: 'Linha Inclinada (Bent Row)', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'dumbbell-row', name: 'Linha com Halteres', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'pull-ups', name: 'Dominadas (Pull-ups)', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Pull-up Bar'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { id: 'lat-pulldown', name: 'Puxada Frontal (Lat Pulldown)', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'assisted-pull-up', name: 'Dominadas Assistidas', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['Costas', 'Ombro'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'machine-row', name: 'Máquina de Linha', muscleGroups: ['Costas'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'cable-row', name: 'Linha por Cabo', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'seal-row', name: 'Seal Row', muscleGroups: ['Costas'], movementType: 'compound', equipment: ['Barbell', 'Bench'], difficulty: 'advanced' },
  { id: 't-bar-row', name: 'Remada T-Bar', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'chest-supported-row', name: 'Remada Apoiada no Peito', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Dumbbell', 'Bench'], difficulty: 'beginner' },
  { id: 'single-arm-cable-row', name: 'Remada Unilateral no Cabo', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'straight-arm-pulldown', name: 'Pulldown com Braço Estendido', muscleGroups: ['Costas'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'lat-pullover', name: 'Pullover', muscleGroups: ['Costas', 'Peito'], movementType: 'isolation', equipment: ['Dumbbell', 'Cable Machine'], difficulty: 'beginner' },
  { id: 'inverted-row', name: 'Remada Invertida', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'trap-bar-deadlift', name: 'Deadlift com Trap Bar', muscleGroups: ['Pernas', 'Costas', 'Glúteos'], movementType: 'compound', equipment: ['Trap Bar'], difficulty: 'intermediate' },
  { id: 'neutral-grip-pulldown', name: 'Puxada Neutra', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'v-bar-pulldown', name: 'Puxada V', muscleGroups: ['Costas', 'Bíceps'], movementType: 'compound', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'meadows-row', name: 'Meadows Row', muscleGroups: ['Costas'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'reverse-fly-machine', name: 'Reverse Fly (Máquina)', muscleGroups: ['Costas', 'Ombro'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'back-extension', name: 'Extensão Lombar', muscleGroups: ['Costas'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },

  // OMBROS (Shoulders)
  { id: 'military-press', name: 'Press Militar (Military Press)', muscleGroups: ['Ombro', 'Tríceps'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate', imageUrl: 'https://images.unsplash.com/photo-1540497905618-92f4e867f8c4?w=400' },
  { id: 'shoulder-press', name: 'Desenvolvimento de Ombro', muscleGroups: ['Ombro', 'Tríceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'lateral-raise', name: 'Elevação Lateral', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'front-raise', name: 'Elevação Frontal', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Dumbbell', 'Barbell'], difficulty: 'beginner' },
  { id: 'rear-delt-fly', name: 'Fly Posterior', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Dumbbell', 'Machine'], difficulty: 'beginner' },
  { id: 'machine-shoulder-press', name: 'Máquina de Ombro', muscleGroups: ['Ombro'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'upright-row', name: 'Linha Alta (Upright Row)', muscleGroups: ['Ombro', 'Bíceps'], movementType: 'compound', equipment: ['Barbell', 'Dumbbell'], difficulty: 'intermediate' },
  { id: 'shrug', name: 'Encolhimento de Ombros (Shrug)', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroups: ['Ombro', 'Tríceps'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'intermediate' },
  { id: 'cable-lateral-raise', name: 'Elevação Lateral no Cabo', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'rear-delt-cable', name: 'Posterior no Cabo', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'cuban-press', name: 'Cuban Press', muscleGroups: ['Ombro'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'advanced' },
  { id: 'y-raise', name: 'Elevação Y', muscleGroups: ['Ombro'], movementType: 'isolation', equipment: ['Dumbbell', 'Cable Machine'], difficulty: 'beginner' },

  // BÍCEPS (Biceps)
  { id: 'barbell-curl', name: 'Rosca Barbell', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'dumbbell-curl', name: 'Rosca com Halteres', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'cable-curl', name: 'Rosca por Cabo', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'hammer-curl', name: 'Rosca Martelo', muscleGroups: ['Bíceps', 'Antebraço'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'preacher-curl', name: 'Rosca Barbell Inclinada', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Barbell', 'Bench'], difficulty: 'beginner' },
  { id: 'machine-curl', name: 'Máquina de Rosca', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'concentration-curl', name: 'Rosca de Concentração', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'incline-dumbbell-curl', name: 'Rosca Inclinado com Halteres', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Dumbbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'spider-curl', name: 'Rosca Spider', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Barbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'ez-bar-curl', name: 'Rosca EZ', muscleGroups: ['Bíceps'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'reverse-curl', name: 'Rosca Reversa', muscleGroups: ['Bíceps', 'Antebraço'], movementType: 'isolation', equipment: ['Barbell'], difficulty: 'beginner' },
  { id: 'cable-hammer-curl', name: 'Rosca Martelo no Cabo', muscleGroups: ['Bíceps', 'Antebraço'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },

  // TRÍCEPS (Triceps)
  { id: 'tricep-dip', name: 'Mergulho de Tríceps', muscleGroups: ['Tríceps', 'Peito'], movementType: 'compound', equipment: ['Dip Station'], difficulty: 'intermediate' },
  { id: 'tricep-extension', name: 'Extensão de Tríceps (Overhead)', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Dumbbell', 'Barbell'], difficulty: 'beginner' },
  { id: 'rope-pushdown', name: 'Push Down com Corda', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'tricep-pushdown', name: 'Push Down de Tríceps', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'overhead-extension', name: 'Extensão Aérea', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'machine-tricep', name: 'Máquina de Tríceps', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'close-grip-bench', name: 'Supino com Grip Fechado', muscleGroups: ['Tríceps', 'Peito'], movementType: 'compound', equipment: ['Barbell', 'Banco'], difficulty: 'intermediate' },
  { id: 'bench-dips', name: 'Dips no Banco', muscleGroups: ['Tríceps'], movementType: 'compound', equipment: ['Bench'], difficulty: 'beginner' },
  { id: 'cable-overhead-rope', name: 'Extensão no Cabo com Corda', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Cable Machine', 'Rope'], difficulty: 'beginner' },
  { id: 'diamond-pushup', name: 'Flexões Diamante', muscleGroups: ['Tríceps', 'Peito'], movementType: 'compound', equipment: [], difficulty: 'beginner' },
  { id: 'single-arm-pushdown', name: 'Pushdown Unilateral', muscleGroups: ['Tríceps'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'dip-assist', name: 'Dip Assistido', muscleGroups: ['Tríceps', 'Peito'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },

  // ANTEBRAÇO (Forearms)
  { id: 'wrist-curl', name: 'Flexão de Pulso', muscleGroups: ['Antebraço'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'reverse-wrist-curl', name: 'Flexão Reversa de Pulso', muscleGroups: ['Antebraço'], movementType: 'isolation', equipment: ['Barbell', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'farmer-walk', name: 'Andar do Fazendeiro', muscleGroups: ['Antebraço', 'Grip'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'wrist-roller', name: 'Wrist Roller', muscleGroups: ['Antebraço'], movementType: 'isolation', equipment: ['Other'], difficulty: 'beginner' },

  // PERNAS (Legs/Quads)
  { id: 'squat', name: 'Agachamento (Back Squat)', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Barbell', 'Rack'], difficulty: 'advanced' },
  { id: 'front-squat', name: 'Agachamento Frontal', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Barbell', 'Rack'], difficulty: 'advanced' },
  { id: 'goblet-squat', name: 'Agachamento com Halter', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Machine'], difficulty: 'intermediate' },
  { id: 'smith-squat', name: 'Agachamento Smith', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Smith Machine'], difficulty: 'beginner' },
  { id: 'leg-extension', name: 'Extensão de Perna', muscleGroups: ['Quadríceps'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'sissy-squat', name: 'Sissy Squat', muscleGroups: ['Quadríceps'], movementType: 'isolation', equipment: [], difficulty: 'intermediate' },
  { id: 'split-squat', name: 'Agachamento Búlgaro', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Dumbbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'lunges', name: 'Avanço (Lunges)', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'step-up', name: 'Step-Up', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Bench', 'Dumbbell'], difficulty: 'beginner' },
  { id: 'leg-press-horizontal', name: 'Leg Press Horizontal', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'belt-squat', name: 'Belt Squat', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Machine'], difficulty: 'intermediate' },
  { id: 'box-squat', name: 'Agachamento ao Banco', muscleGroups: ['Pernas', 'Glúteos'], movementType: 'compound', equipment: ['Barbell', 'Box'], difficulty: 'intermediate' },

  // FEMORAIS (Hamstrings)
  { id: 'leg-curl', name: 'Flexão de Perna', muscleGroups: ['Femorais'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'lying-leg-curl', name: 'Flexão de Perna Deitado', muscleGroups: ['Femorais'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'nordic-curl', name: 'Nordic Curl', muscleGroups: ['Femorais'], movementType: 'isolation', equipment: [], difficulty: 'advanced' },
  { id: 'glute-ham-raise', name: 'Glute Ham Raise', muscleGroups: ['Femorais', 'Glúteos'], movementType: 'compound', equipment: ['Machine'], difficulty: 'advanced' },
  { id: 'romanian-deadlift', name: 'Levantamento Morto Romeno', muscleGroups: ['Femorais', 'Glúteos', 'Costas'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'stiff-deadlift', name: 'Levantamento Morto Rígido', muscleGroups: ['Femorais', 'Costas'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'intermediate' },
  { id: 'seated-leg-curl', name: 'Flexão de Perna Sentado', muscleGroups: ['Femorais'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'good-morning', name: 'Good Morning', muscleGroups: ['Femorais', 'Glúteos', 'Costas'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'single-leg-rdl', name: 'RDL Unilateral', muscleGroups: ['Femorais', 'Glúteos'], movementType: 'compound', equipment: ['Dumbbell'], difficulty: 'intermediate' },
  { id: 'kettlebell-deadlift', name: 'Deadlift com Kettlebell', muscleGroups: ['Femorais', 'Glúteos'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'beginner' },

  // GLÚTEOS (Glutes)
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['Glúteos', 'Pernas'], movementType: 'compound', equipment: ['Barbell', 'Bench'], difficulty: 'intermediate' },
  { id: 'glute-bridge', name: 'Ponte de Glúteos', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'cable-kick-back', name: 'Chute Traseiro (Cable)', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'machine-adductor', name: 'Máquina Adutora', muscleGroups: ['Glúteos', 'Pernas'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'machine-abductor', name: 'Máquina Abdutora', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'pendulum-squat', name: 'Agachamento Pêndulo', muscleGroups: ['Glúteos', 'Pernas'], movementType: 'compound', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'hip-abduction-band', name: 'Abdução com Banda', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: ['Resistance Band'], difficulty: 'beginner' },
  { id: 'cable-hip-abduction', name: 'Abdução no Cabo', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'frog-pumps', name: 'Frog Pumps', muscleGroups: ['Glúteos'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },

  // CORE / ABS
  { id: 'crunch', name: 'Abdominais (Crunch)', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'ab-wheel', name: 'Ab Wheel', muscleGroups: ['Abdominais', 'Core'], movementType: 'isolation', equipment: ['Ab Wheel'], difficulty: 'intermediate' },
  { id: 'cable-crunch', name: 'Abdominais por Cabo', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'cable-woodchop', name: 'Movimento de Lenhador', muscleGroups: ['Abdominais', 'Oblíquos'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'hanging-leg-raise', name: 'Elevação de Perna Suspensa', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: ['Pull-up Bar'], difficulty: 'intermediate' },
  { id: 'machine-ab', name: 'Máquina de Abdominais', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'planks', name: 'Prancha (Plank)', muscleGroups: ['Abdominais', 'Core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroups: ['Abdominais', 'Core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'pallof-press', name: 'Pallof Press', muscleGroups: ['Oblíquos', 'Core'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroups: ['Oblíquos', 'Core'], movementType: 'isolation', equipment: ['Dumbbell'], difficulty: 'beginner' },
  { id: 'side-plank', name: 'Prancha Lateral', muscleGroups: ['Oblíquos', 'Core'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'hanging-knee-raise', name: 'Elevação de Joelhos Suspensa', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: ['Pull-up Bar'], difficulty: 'beginner' },
  { id: 'reverse-crunch', name: 'Crunch Reverso', muscleGroups: ['Abdominais'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'hollow-hold', name: 'Hollow Hold', muscleGroups: ['Core', 'Abdominais'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
  { id: 'cable-side-bend', name: 'Flexão Lateral no Cabo', muscleGroups: ['Oblíquos'], movementType: 'isolation', equipment: ['Cable Machine'], difficulty: 'beginner' },

  // CARDIO
  { id: 'treadmill', name: 'Esteira (Treadmill)', muscleGroups: [], movementType: 'cardio', equipment: ['Treadmill'], difficulty: 'beginner' },
  { id: 'stationary-bike', name: 'Bicicleta Estática', muscleGroups: ['Pernas'], movementType: 'cardio', equipment: ['Stationary Bike'], difficulty: 'beginner' },
  { id: 'rowing-machine', name: 'Máquina de Remo', muscleGroups: ['Costas', 'Pernas'], movementType: 'cardio', equipment: ['Rowing Machine'], difficulty: 'intermediate' },
  { id: 'elliptical', name: 'Elíptica', muscleGroups: ['Pernas'], movementType: 'cardio', equipment: ['Elliptical'], difficulty: 'beginner' },
  { id: 'jump-rope', name: 'Corda de Pular', muscleGroups: ['Pernas', 'Braços'], movementType: 'cardio', equipment: ['Jump Rope'], difficulty: 'beginner' },
  { id: 'battle-ropes', name: 'Battle Ropes', muscleGroups: ['Braços', 'Core'], movementType: 'cardio', equipment: ['Battle Ropes'], difficulty: 'intermediate' },
  { id: 'burpees', name: 'Burpees', muscleGroups: [], movementType: 'cardio', equipment: [], difficulty: 'intermediate' },
  { id: 'box-jump', name: 'Salto para Caixa', muscleGroups: ['Pernas'], movementType: 'cardio', equipment: ['Plyo Box'], difficulty: 'intermediate' },
  { id: 'sprints', name: 'Sprints', muscleGroups: ['Pernas'], movementType: 'cardio', equipment: [], difficulty: 'beginner' },
  { id: 'stair-climber', name: 'Escadas (Stair Climber)', muscleGroups: ['Pernas'], movementType: 'cardio', equipment: ['Stair Climber'], difficulty: 'beginner' },
  { id: 'assault-bike', name: 'Air Bike', muscleGroups: ['Pernas', 'Braços'], movementType: 'cardio', equipment: ['Assault Bike'], difficulty: 'intermediate' },
  { id: 'ski-erg', name: 'SkiErg', muscleGroups: ['Costas', 'Braços'], movementType: 'cardio', equipment: ['SkiErg'], difficulty: 'intermediate' },

  // COMPLEX / MOVEMENTS
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroups: ['Glúteos', 'Pernas', 'Core'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'intermediate' },
  { id: 'tire-flip', name: 'Tire Flip', muscleGroups: ['Pernas', 'Costas'], movementType: 'compound', equipment: ['Tire'], difficulty: 'advanced' },
  { id: 'sled-push', name: 'Empurrão de Trenó', muscleGroups: ['Pernas'], movementType: 'compound', equipment: ['Sled'], difficulty: 'intermediate' },
  { id: 'sled-drag', name: 'Arrasto de Trenó', muscleGroups: ['Pernas'], movementType: 'compound', equipment: ['Sled'], difficulty: 'intermediate' },
  { id: 'powerclean', name: 'Power Clean', muscleGroups: ['Pernas', 'Costas', 'Ombro'], movementType: 'compound', equipment: ['Barbell'], difficulty: 'advanced' },
  { id: 'thrusters', name: 'Thrusters', muscleGroups: ['Pernas', 'Ombro', 'Braços'], movementType: 'compound', equipment: ['Dumbbell', 'Barbell'], difficulty: 'intermediate' },
  { id: 'turkish-getup', name: 'Turkish Get-up', muscleGroups: ['Core', 'Ombro'], movementType: 'compound', equipment: ['Kettlebell'], difficulty: 'advanced' },

  // PANTURRILHAS (Calves)
  { id: 'standing-calf-raise', name: 'Elevação de Gémeos em Pé', muscleGroups: ['Panturrilha'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'seated-calf-raise', name: 'Elevação de Gémeos Sentado', muscleGroups: ['Panturrilha'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'donkey-calf-raise', name: 'Elevação de Gémeos Donkey', muscleGroups: ['Panturrilha'], movementType: 'isolation', equipment: ['Machine'], difficulty: 'beginner' },
  { id: 'single-leg-calf-raise', name: 'Elevação de Gémeos Unilateral', muscleGroups: ['Panturrilha'], movementType: 'isolation', equipment: [], difficulty: 'beginner' },
]

// Organizar por grupo muscular
export const EXERCISES_BY_MUSCLE_GROUP = {
  'Peito': EXERCISES.filter(e => e.muscleGroups.includes('Peito')),
  'Costas': EXERCISES.filter(e => e.muscleGroups.includes('Costas')),
  'Ombro': EXERCISES.filter(e => e.muscleGroups.includes('Ombro')),
  'Bíceps': EXERCISES.filter(e => e.muscleGroups.includes('Bíceps')),
  'Tríceps': EXERCISES.filter(e => e.muscleGroups.includes('Tríceps')),
  'Antebraço': EXERCISES.filter(e => e.muscleGroups.includes('Antebraço')),
  'Pernas': EXERCISES.filter(e => e.muscleGroups.includes('Pernas')),
  'Femorais': EXERCISES.filter(e => e.muscleGroups.includes('Femorais')),
  'Glúteos': EXERCISES.filter(e => e.muscleGroups.includes('Glúteos')),
  'Abdominais': EXERCISES.filter(e => e.muscleGroups.includes('Abdominais')),
  'Core': EXERCISES.filter(e => e.muscleGroups.includes('Core')),
  'Oblíquos': EXERCISES.filter(e => e.muscleGroups.includes('Oblíquos')),
  'Panturrilha': EXERCISES.filter(e => e.muscleGroups.includes('Panturrilha')),
}
