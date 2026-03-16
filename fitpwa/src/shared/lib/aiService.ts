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

// ─── Smarter Rule-Based AI Engine ───

// Helpers for advanced string parsing
function normalizeContext(prompt: string): string {
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // removes accents for easier matching
}

function detectEquipment(prompt: string): string[] | null {
  const normalized = normalizeContext(prompt);
  const equipment = new Set<string>();

  // If user explicitly asks for "apenas", "so tenho", "only" bodyweight
  if (normalized.match(/so (com )?peso corporal|apenas peso corporal|bodyweight|sem equipamento/)) {
    return []; // Empty array means strict bodyweight only
  }

  // Detect specific equipment
  if (normalized.match(/halter|halteres|dumbbell/)) equipment.add('Dumbbell');
  if (normalized.match(/barra|barbell/)) {
    equipment.add('Barbell');
    equipment.add('Rack');
    equipment.add('Banco'); // Assume they have a bench if they have a barbell usually
  }
  if (normalized.match(/banco|bench/)) equipment.add('Banco');
  if (normalized.match(/elastico|banda|band/)) equipment.add('Resistance Band');
  if (normalized.match(/kettlebell|kettle/)) equipment.add('Kettlebell');
  if (normalized.match(/maquina|cabo|cable|ginasio/)) {
    // Gym access
    equipment.add('Machine');
    equipment.add('Cable Machine');
    equipment.add('Smith Machine');
    equipment.add('Dip Station');
    equipment.add('Pull-up Bar');
  }

  // If we detected specific equipment, return it. Otherwise null (meaning access to everything)
  return equipment.size > 0 ? Array.from(equipment) : null;
}

function detectLimitations(prompt: string): string[] {
  const normalized = normalizeContext(prompt);
  const limitations: string[] = [];

  if (normalized.match(/dor(es)? (de|no|nos) joelho|problema joelho|knee pain/)) {
    limitations.push('knee_pain');
  }
  if (normalized.match(/dor(es)? (de|no|nos) ombro|problema ombro|shoulder pain/)) {
    limitations.push('shoulder_pain');
  }
  if (normalized.match(/dor(es)? (de|na|nas) costa|lombar/)) {
    limitations.push('back_pain');
  }

  return limitations;
}

function detectDifficulty(prompt: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = normalizeContext(prompt);
  if (lower.match(/iniciante|beginner|facil|basico|comecar/)) return 'beginner';
  if (lower.match(/avancado|advanced|dificil|pesado|intenso|hardcore/)) return 'advanced';
  return 'intermediate';
}

function detectGoal(prompt: string): 'strength' | 'hypertrophy' | 'endurance' {
  const lower = normalizeContext(prompt);
  if (lower.match(/forca|strength|pesado|powerlifting/)) return 'strength';
  if (lower.match(/resistencia|endurance|cardio|emagrecer|secar|perder peso/)) return 'endurance';
  return 'hypertrophy';
}

function detectTimeLimit(prompt: string): number | null {
  const match = prompt.match(/(\d+)\s*min/);
  return match ? parseInt(match[1]) : null;
}

// ─── Dynamic Template Matching ───

// Instead of picking 1 template, we score all muscle groups and construct a hybrid
function analyzeMuscleTargets(prompt: string): string[] {
  const lower = normalizeContext(prompt);
  const targets = new Set<string>();

  // Direct hits
  if (lower.match(/peito|chest|supino|empurrar/)) targets.add('Peito');
  if (lower.match(/costa|back|puxar/)) targets.add('Costas');
  if (lower.match(/ombro|shoulder|deltoide/)) targets.add('Ombro');
  if (lower.match(/bicep/)) targets.add('Bíceps');
  if (lower.match(/tricep/)) targets.add('Tríceps');
  if (lower.match(/braco|arm/)) { targets.add('Bíceps'); targets.add('Tríceps'); }
  if (lower.match(/perna|leg|quad/)) { targets.add('Pernas'); targets.add('Quadríceps'); targets.add('Femorais'); targets.add('Panturrilha'); }
  if (lower.match(/gluteo|bunda|posterior/)) { targets.add('Glúteos'); targets.add('Femorais'); }
  if (lower.match(/abs|abdominal|core/)) { targets.add('Abdominais'); targets.add('Core'); targets.add('Oblíquos'); }
  
  // Macros
  if (lower.match(/superior|upper/)) { targets.add('Peito'); targets.add('Costas'); targets.add('Ombro'); targets.add('Bíceps'); targets.add('Tríceps'); }
  if (lower.match(/inferior|lower/)) { targets.add('Pernas'); targets.add('Glúteos'); targets.add('Femorais'); targets.add('Panturrilha'); }
  if (lower.match(/push/)) { targets.add('Peito'); targets.add('Ombro'); targets.add('Tríceps'); }
  if (lower.match(/pull/)) { targets.add('Costas'); targets.add('Bíceps'); }
  if (lower.match(/corpo inteiro|full body/)) { targets.add('Peito'); targets.add('Costas'); targets.add('Pernas'); targets.add('Ombro'); targets.add('Abdominais'); }

  return Array.from(targets);
}

function isExerciseAllowed(ex: Exercise, equipment: string[] | null, limitations: string[]): boolean {
  // Check Equipment Constraint
  if (equipment !== null) {
    if (ex.equipment.length > 0) {
      // Exercise requires equipment. Do we have at least one thing it needs? Or exactly what it needs?
      // Strict matching: we must have EVERY piece of equipment it lists, OR it lists something we have.
      // Easiest strict logic: If the exercise requires gear, user must possess all of the required gear for that exercise
      // e.g., if ex requires ['Barbell', 'Bench'], user must have both.
      const hasRequiredGear = ex.equipment.every(req => equipment.includes(req));
      if (!hasRequiredGear) return false;
    }
  }

  // Check Limitations Constraint
  if (limitations.includes('knee_pain')) {
    const hazardous = ['Agachamento', 'Squat', 'Leg Press', 'Jump', 'Lunges', 'Step-Up', 'Sprint'];
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz.toLowerCase()))) return false;
  }
  
  if (limitations.includes('shoulder_pain')) {
    const hazardous = ['Military', 'Overhead', 'Dip', 'Snatch', 'Thruster', 'Lateral'];
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz.toLowerCase()))) return false;
  }
  
  if (limitations.includes('back_pain')) {
    const hazardous = ['Deadlift', 'Good Morning', 'Bent Row', 'T-Bar'];
    if (hazardous.some(hz => ex.name.toLowerCase().includes(hz.toLowerCase()))) return false;
  }

  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickSmartExercises(
  targetMuscles: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  maxCount: number,
  isCardioRequested: boolean,
  equipmentConstraints: string[] | null,
  limitations: string[]
): Exercise[] {
  
  let pool = EXERCISES;

  // 1. Filter by allowed equipment and physical limitations
  pool = pool.filter(ex => isExerciseAllowed(ex, equipmentConstraints, limitations));

  // 2. Filter by difficulty (beginners shouldn't do advanced moves)
  if (difficulty === 'beginner') {
    pool = pool.filter(e => e.difficulty !== 'advanced');
  }

  const picked = new Set<Exercise>();

  // 3. Strategy: Ensure we hit every requested muscle group with at least one compound if possible
  const targetCompounds = shuffle(pool.filter(e => e.movementType === 'compound'));
  const targetIsolations = shuffle(pool.filter(e => e.movementType === 'isolation'));
  const cardio = shuffle(pool.filter(e => e.movementType === 'cardio'));

  // If pure cardio requested and no muscles targeted
  if (isCardioRequested && targetMuscles.length === 0) {
    return cardio.slice(0, maxCount);
  }

  // Try to find a compound movement for each target muscle
  const missingMuscles = [...targetMuscles];
  
  for (const muscle of targetMuscles) {
    if (picked.size >= Math.ceil(maxCount * 0.6)) break; // Don't fill whole workout with compounds
    
    const ex = targetCompounds.find(e => e.muscleGroups.includes(muscle) && !picked.has(e));
    if (ex) {
      picked.add(ex);
      ex.muscleGroups.forEach(mg => {
        const idx = missingMuscles.indexOf(mg);
        if (idx > -1) missingMuscles.splice(idx, 1);
      });
    }
  }

  // Fill remaining slots with isolations targeting the requested muscles
  for (const muscle of targetMuscles) {
    if (picked.size >= maxCount - (isCardioRequested ? 1 : 0)) break; // save 1 slot for cardio if needed

    const exIso = targetIsolations.find(e => e.muscleGroups.includes(muscle) && !picked.has(e));
    if (exIso) picked.add(exIso);
  }

  // Add cardio finisher if requested and there's space
  if (isCardioRequested && cardio.length > 0 && picked.size < maxCount) {
    picked.add(cardio[0]);
  }

  // If we still need more exercises to reach maxCount, fill with general compounds related to targets
  if (picked.size < maxCount) {
    for (const ex of targetCompounds) {
      if (picked.size >= maxCount) break;
      if (!picked.has(ex) && ex.muscleGroups.some(mg => targetMuscles.includes(mg))) {
        picked.add(ex);
      }
    }
  }

  return Array.from(picked);
}

// ─── Main generator ───

export function generateWorkoutPlan(userPrompt: string): AiGeneratedPlan {
  // 1. Context Parsing
  const difficulty = detectDifficulty(userPrompt);
  const goal = detectGoal(userPrompt);
  const timeLimit = detectTimeLimit(userPrompt);
  const equipment = detectEquipment(userPrompt);
  const limitations = detectLimitations(userPrompt);
  
  let targetMuscles = analyzeMuscleTargets(userPrompt);
  const isCardio = normalizeContext(userPrompt).match(/hiit|cardio|emagrecer|suar|queimar/) !== null;

  // Fallback if no specific muscle was mentioned (Full Body)
  if (targetMuscles.length === 0 && !isCardio) {
    targetMuscles = ['Peito', 'Costas', 'Pernas', 'Ombro', 'Abdominais'];
  }

  const preset = DIFFICULTY_PRESETS[difficulty];

  // 2. Dynamic Rules (Time vs Volume)
  let maxExercises = preset.maxExercises;
  if (timeLimit) {
    // Advanced algorithm: time based on rest times + execution time
    // Execution: ~45s per set. 
    // Example: 3 sets * (45s work + 90s rest) = 405s ~= 6.7 mins per exercise
    const timePerExerciseMins = 6.5; 
    maxExercises = Math.max(2, Math.floor(timeLimit / timePerExerciseMins));
  }

  // 3. Selection
  const selectedExercises = pickSmartExercises(
    targetMuscles, 
    difficulty, 
    maxExercises, 
    isCardio, 
    equipment, 
    limitations
  );

  if (selectedExercises.length === 0) {
    throw new Error("Não encontrei exercícios que correspondam às tuas limitações/equipamento. Tenta ser menos restritivo!");
  }

  // 4. Volume Mapping
  const repsRange = goal === 'strength' ? preset.repsStrength
    : goal === 'endurance' ? preset.repsEndurance
    : preset.repsHypertrophy;

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
  }));

  // 5. Intelligent Naming & Description
  const muscleString = targetMuscles.length > 3 ? 'Corpo Inteiro' : targetMuscles.join(', ');
  const modeString = isCardio && targetMuscles.length > 0 ? '+ Cardio' : '';
  const planName = timeLimit 
    ? `Treino Dinâmico de ${timeLimit} min` 
    : `Plano Gerado: ${muscleString} ${modeString}`;

  let description = `Treino gerado à medida. Foco em ${goal === 'strength' ? 'força' : goal === 'endurance' ? 'resistência' : 'hipertrofia'}.`;
  if (equipment !== null) {
    if (equipment.length === 0) description += ' Sem recurso a equipamento (apenas peso corporal).';
    else description += ` Equipamento filtrado.`;
  }
  if (limitations.length > 0) {
    description += ' Adaptado para evitar sobrecarga nas tuas limitações articulatórias.';
  }

  return {
    name: planName,
    description,
    difficulty,
    exercises,
  };
}
