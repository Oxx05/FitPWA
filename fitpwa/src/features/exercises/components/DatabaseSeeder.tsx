import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/contexts/ToastContext'

// ---------------------------------------------------------------------------
// Curated exercise list — names that Portuguese gym-goers actually use
// (English where dominant, Portuguese where that's the common term)
// ---------------------------------------------------------------------------
interface CuratedExercise {
  name: string
  name_pt: string
  muscle_groups: string[]
  secondary_muscles: string[]
  equipment: string[]
  difficulty: number
}

export const CURATED_EXERCISES: CuratedExercise[] = [
  // ── Peito ────────────────────────────────────────────────────────────────
  { name: 'Bench Press', name_pt: 'Bench Press', muscle_groups: ['chest'], secondary_muscles: ['triceps', 'shoulders'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Incline Bench Press', name_pt: 'Supino Inclinado', muscle_groups: ['chest'], secondary_muscles: ['triceps', 'shoulders'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Decline Bench Press', name_pt: 'Supino Declinado', muscle_groups: ['chest'], secondary_muscles: ['triceps'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Dumbbell Fly', name_pt: 'Crucifixo', muscle_groups: ['chest'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Cable Crossover', name_pt: 'Crossover', muscle_groups: ['chest'], secondary_muscles: [], equipment: ['cable'], difficulty: 2 },
  { name: 'Push-up', name_pt: 'Flexões', muscle_groups: ['chest'], secondary_muscles: ['triceps', 'shoulders'], equipment: ['body weight'], difficulty: 2 },
  { name: 'Dips', name_pt: 'Mergulhos', muscle_groups: ['chest'], secondary_muscles: ['triceps'], equipment: ['body weight'], difficulty: 3 },
  // ── Costas ───────────────────────────────────────────────────────────────
  { name: 'Pull-up', name_pt: 'Barra Fixa', muscle_groups: ['lats'], secondary_muscles: ['biceps', 'traps'], equipment: ['body weight'], difficulty: 4 },
  { name: 'Chin-up', name_pt: 'Chin-up', muscle_groups: ['lats'], secondary_muscles: ['biceps'], equipment: ['body weight'], difficulty: 3 },
  { name: 'Lat Pulldown', name_pt: 'Puxada à Frente', muscle_groups: ['lats'], secondary_muscles: ['biceps'], equipment: ['cable'], difficulty: 2 },
  { name: 'Seated Cable Row', name_pt: 'Remada Sentado', muscle_groups: ['back'], secondary_muscles: ['biceps'], equipment: ['cable'], difficulty: 2 },
  { name: 'Bent-over Barbell Row', name_pt: 'Remada Curvada', muscle_groups: ['back'], secondary_muscles: ['biceps', 'traps'], equipment: ['barbell'], difficulty: 4 },
  { name: 'Dumbbell Row', name_pt: 'Remada com Haltere', muscle_groups: ['back'], secondary_muscles: ['biceps'], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'T-Bar Row', name_pt: 'Remada T', muscle_groups: ['back'], secondary_muscles: ['biceps', 'traps'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Deadlift', name_pt: 'Levantamento Terra', muscle_groups: ['back'], secondary_muscles: ['glutes', 'hamstrings', 'traps'], equipment: ['barbell'], difficulty: 5 },
  { name: 'Romanian Deadlift', name_pt: 'Stiff', muscle_groups: ['hamstrings'], secondary_muscles: ['glutes', 'back'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Face Pull', name_pt: 'Face Pull', muscle_groups: ['shoulders'], secondary_muscles: ['traps', 'back'], equipment: ['cable'], difficulty: 2 },
  { name: 'Hyperextension', name_pt: 'Hiperextensão', muscle_groups: ['lower back'], secondary_muscles: ['glutes', 'hamstrings'], equipment: ['body weight'], difficulty: 2 },
  // ── Ombros ───────────────────────────────────────────────────────────────
  { name: 'Overhead Press', name_pt: 'Press Militar', muscle_groups: ['shoulders'], secondary_muscles: ['triceps', 'traps'], equipment: ['barbell'], difficulty: 4 },
  { name: 'Dumbbell Shoulder Press', name_pt: 'Press com Halteres', muscle_groups: ['shoulders'], secondary_muscles: ['triceps'], equipment: ['dumbbell'], difficulty: 3 },
  { name: 'Lateral Raise', name_pt: 'Elevação Lateral', muscle_groups: ['shoulders'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Front Raise', name_pt: 'Elevação Frontal', muscle_groups: ['shoulders'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Rear Delt Fly', name_pt: 'Crucifixo Invertido', muscle_groups: ['shoulders'], secondary_muscles: ['traps', 'back'], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Arnold Press', name_pt: 'Arnold Press', muscle_groups: ['shoulders'], secondary_muscles: ['triceps'], equipment: ['dumbbell'], difficulty: 3 },
  { name: 'Upright Row', name_pt: 'Remada Alta', muscle_groups: ['shoulders'], secondary_muscles: ['traps', 'biceps'], equipment: ['barbell'], difficulty: 3 },
  // ── Bíceps ───────────────────────────────────────────────────────────────
  { name: 'Bicep Curl', name_pt: 'Rosca Direta', muscle_groups: ['biceps'], secondary_muscles: ['forearms'], equipment: ['barbell'], difficulty: 2 },
  { name: 'Hammer Curl', name_pt: 'Rosca Martelo', muscle_groups: ['biceps'], secondary_muscles: ['forearms'], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Preacher Curl', name_pt: 'Rosca Scott', muscle_groups: ['biceps'], secondary_muscles: [], equipment: ['barbell'], difficulty: 2 },
  { name: 'Incline Dumbbell Curl', name_pt: 'Rosca Inclinada', muscle_groups: ['biceps'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Cable Curl', name_pt: 'Rosca na Polia', muscle_groups: ['biceps'], secondary_muscles: [], equipment: ['cable'], difficulty: 2 },
  { name: 'Concentration Curl', name_pt: 'Rosca Concentrada', muscle_groups: ['biceps'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  // ── Tríceps ──────────────────────────────────────────────────────────────
  { name: 'Tricep Pushdown', name_pt: 'Extensão na Polia', muscle_groups: ['triceps'], secondary_muscles: [], equipment: ['cable'], difficulty: 2 },
  { name: 'Skull Crusher', name_pt: 'Rosca Testa', muscle_groups: ['triceps'], secondary_muscles: [], equipment: ['barbell'], difficulty: 3 },
  { name: 'Overhead Tricep Extension', name_pt: 'Extensão Francesa', muscle_groups: ['triceps'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  { name: 'Tricep Dips', name_pt: 'Tricep Dips', muscle_groups: ['triceps'], secondary_muscles: ['chest'], equipment: ['body weight'], difficulty: 3 },
  { name: 'Close-Grip Bench Press', name_pt: 'Supino Fechado', muscle_groups: ['triceps'], secondary_muscles: ['chest'], equipment: ['barbell'], difficulty: 3 },
  { name: 'Kickback', name_pt: 'Kickback', muscle_groups: ['triceps'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 2 },
  // ── Pernas ───────────────────────────────────────────────────────────────
  { name: 'Squat', name_pt: 'Agachamento', muscle_groups: ['quads'], secondary_muscles: ['glutes', 'hamstrings'], equipment: ['barbell'], difficulty: 4 },
  { name: 'Front Squat', name_pt: 'Agachamento Frontal', muscle_groups: ['quads'], secondary_muscles: ['glutes'], equipment: ['barbell'], difficulty: 5 },
  { name: 'Leg Press', name_pt: 'Leg Press', muscle_groups: ['quads'], secondary_muscles: ['glutes', 'hamstrings'], equipment: ['machine'], difficulty: 2 },
  { name: 'Hack Squat', name_pt: 'Hack Squat', muscle_groups: ['quads'], secondary_muscles: ['glutes'], equipment: ['machine'], difficulty: 3 },
  { name: 'Leg Extension', name_pt: 'Cadeira Extensora', muscle_groups: ['quads'], secondary_muscles: [], equipment: ['machine'], difficulty: 1 },
  { name: 'Leg Curl', name_pt: 'Mesa Flexora', muscle_groups: ['hamstrings'], secondary_muscles: [], equipment: ['machine'], difficulty: 1 },
  { name: 'Lunges', name_pt: 'Passadas', muscle_groups: ['quads'], secondary_muscles: ['glutes', 'hamstrings'], equipment: ['body weight'], difficulty: 2 },
  { name: 'Bulgarian Split Squat', name_pt: 'Agachamento Búlgaro', muscle_groups: ['quads'], secondary_muscles: ['glutes', 'hamstrings'], equipment: ['dumbbell'], difficulty: 4 },
  { name: 'Sumo Deadlift', name_pt: 'Levantamento Terra Sumo', muscle_groups: ['glutes'], secondary_muscles: ['hamstrings', 'quads', 'back'], equipment: ['barbell'], difficulty: 4 },
  { name: 'Hip Thrust', name_pt: 'Hip Thrust', muscle_groups: ['glutes'], secondary_muscles: ['hamstrings'], equipment: ['barbell'], difficulty: 2 },
  { name: 'Glute Bridge', name_pt: 'Glute Bridge', muscle_groups: ['glutes'], secondary_muscles: ['hamstrings'], equipment: ['body weight'], difficulty: 1 },
  { name: 'Calf Raise', name_pt: 'Elevação de Panturrilha', muscle_groups: ['calves'], secondary_muscles: [], equipment: ['machine'], difficulty: 1 },
  { name: 'Seated Calf Raise', name_pt: 'Gémeos Sentado', muscle_groups: ['calves'], secondary_muscles: [], equipment: ['machine'], difficulty: 1 },
  // ── Core ─────────────────────────────────────────────────────────────────
  { name: 'Crunch', name_pt: 'Crunch', muscle_groups: ['abdominals'], secondary_muscles: [], equipment: ['body weight'], difficulty: 1 },
  { name: 'Plank', name_pt: 'Prancha', muscle_groups: ['abdominals'], secondary_muscles: ['obliques', 'shoulders'], equipment: ['body weight'], difficulty: 2 },
  { name: 'Leg Raise', name_pt: 'Elevação de Pernas', muscle_groups: ['abdominals'], secondary_muscles: [], equipment: ['body weight'], difficulty: 2 },
  { name: 'Russian Twist', name_pt: 'Russian Twist', muscle_groups: ['obliques'], secondary_muscles: ['abdominals'], equipment: ['body weight'], difficulty: 2 },
  { name: 'Cable Crunch', name_pt: 'Crunch na Polia', muscle_groups: ['abdominals'], secondary_muscles: [], equipment: ['cable'], difficulty: 2 },
  { name: 'Hanging Leg Raise', name_pt: 'Elevação de Pernas na Barra', muscle_groups: ['abdominals'], secondary_muscles: ['obliques'], equipment: ['body weight'], difficulty: 3 },
  { name: 'Ab Wheel Rollout', name_pt: 'Roda Abdominal', muscle_groups: ['abdominals'], secondary_muscles: ['back', 'shoulders'], equipment: ['other'], difficulty: 4 },
  { name: 'Mountain Climber', name_pt: 'Mountain Climber', muscle_groups: ['abdominals'], secondary_muscles: ['shoulders', 'quads'], equipment: ['body weight'], difficulty: 2 },
  // ── Trapézio / Posterior ─────────────────────────────────────────────────
  { name: 'Shrugs', name_pt: 'Encolhimento de Ombros', muscle_groups: ['traps'], secondary_muscles: [], equipment: ['barbell'], difficulty: 1 },
  { name: 'Dumbbell Shrugs', name_pt: 'Encolhimento com Halteres', muscle_groups: ['traps'], secondary_muscles: [], equipment: ['dumbbell'], difficulty: 1 },
  // ── Antebraços ───────────────────────────────────────────────────────────
  { name: 'Wrist Curl', name_pt: 'Rosca de Pulso', muscle_groups: ['forearms'], secondary_muscles: [], equipment: ['barbell'], difficulty: 1 },
  { name: "Farmer's Walk", name_pt: "Farmer's Walk", muscle_groups: ['forearms'], secondary_muscles: ['traps', 'shoulders'], equipment: ['dumbbell'], difficulty: 2 },
]

interface ExerciseDbExercise {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string | null
  category: string
  images: string[]
}

const BASE_IMAGE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
const EXERCISEDB_JSON = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

// The repo stores images at exercises/{id}/0.jpg where id is already the folder-safe name.
// images[0] from the JSON gives exactly "{id}/0.jpg" — use that directly.
// Fall back to constructing from id for exercises with an empty images array.
function resolveImageUrl(ex: ExerciseDbExercise): string | null {
  if (ex.images?.[0]) return `${BASE_IMAGE_URL}${ex.images[0]}`
  if (ex.id) return `${BASE_IMAGE_URL}${ex.id}/0.jpg`
  return null
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function DatabaseSeeder() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSeedingCurated, setIsSeedingCurated] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const fetchAllExercises = async (): Promise<ExerciseDbExercise[]> => {
    const res = await fetch(EXERCISEDB_JSON)
    if (!res.ok) throw new Error(`free-exercise-db request failed (${res.status})`)
    const data = (await res.json()) as ExerciseDbExercise[]
    if (!Array.isArray(data)) return []
    setProgress(`Fetched ${data.length} exercises…`)
    return data.filter(ex => ex?.id && ex?.name)
  }

  const fetchExistingNames = async (): Promise<Set<string>> => {
    const names = new Set<string>()
    const pageSize = 1000
    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .from('exercises')
        .select('name_pt')
        .range(offset, offset + pageSize - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      data.forEach((row: { name_pt: string | null }) => {
        if (row.name_pt) names.add(row.name_pt)
      })
      if (data.length < pageSize) break
      offset += pageSize
    }
    return names
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setLastResult(null)
    setProgress('Starting fetch…')
    try {
      const exercises = await fetchAllExercises()
      if (exercises.length === 0) throw new Error('No exercises returned from free-exercise-db.')
      setProgress(`Fetched ${exercises.length}. Checking Supabase…`)

      const existingNames = await fetchExistingNames()

      const rows = exercises.map(ex => ({
        name: ex.name,
        name_pt: ex.name,
        muscle_groups: ex.primaryMuscles?.length ? ex.primaryMuscles : [],
        secondary_muscles: ex.secondaryMuscles ?? [],
        equipment: ex.equipment ? [ex.equipment] : [],
        gif_url: resolveImageUrl(ex),
      }))

      // Deduplicate by name_pt (keep first occurrence)
      const uniqueRows = Array.from(
        rows.reduce((map, row) => {
          if (!map.has(row.name_pt)) map.set(row.name_pt, row)
          return map
        }, new Map<string, typeof rows[number]>()).values()
      )

      const toUpdate = uniqueRows.filter(row => existingNames.has(row.name_pt) && row.gif_url)
      const toInsert = uniqueRows.filter(row => !existingNames.has(row.name_pt))

      setProgress(`Updating ${toUpdate.length} existing, inserting ${toInsert.length} new…`)

      // Patch gif_url on existing rows (never overwrite localized names)
      let updated = 0
      for (const batch of chunk(toUpdate, 50)) {
        const results = await Promise.all(
          batch.map(row =>
            supabase
              .from('exercises')
              .update({ gif_url: row.gif_url })
              .eq('name_pt', row.name_pt)
          )
        )
        const firstError = results.find(r => r.error)?.error
        if (firstError) throw firstError
        updated += batch.length
        setProgress(`Updated ${updated}/${toUpdate.length}…`)
      }

      // Insert new rows
      let inserted = 0
      for (const batch of chunk(toInsert, 500)) {
        const { error } = await supabase
          .from('exercises')
          .upsert(batch, { onConflict: 'name_pt' })

        if (error?.code === '42P10') {
          // No unique constraint — fall back to plain insert
          const { error: insertError } = await supabase.from('exercises').insert(batch)
          if (insertError) throw insertError
        } else if (error) {
          throw error
        }

        inserted += batch.length
        setProgress(`Inserted ${inserted}/${toInsert.length}…`)
      }

      const withImage = uniqueRows.filter(r => r.gif_url).length
      const resultMessage = `Done: ${inserted} inserted, ${updated} updated — ${withImage}/${uniqueRows.length} have images`
      setLastResult(resultMessage)
      setProgress(null)
      showToast(resultMessage, 'success')
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    } catch (err: any) {
      console.error('Seed error:', err)
      setProgress(null)
      showToast(err?.message || 'Failed to sync exercises', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSeedCurated = async () => {
    setIsSeedingCurated(true)
    setLastResult(null)
    setProgress(`Seeding ${CURATED_EXERCISES.length} curated exercises…`)
    try {
      const { error } = await supabase
        .from('exercises')
        .upsert(
          CURATED_EXERCISES.map(ex => ({ ...ex, is_custom: false })),
          { onConflict: 'name_pt' }
        )
      if (error) throw error
      const msg = `Curated: ${CURATED_EXERCISES.length} exercises upserted`
      setLastResult(msg)
      setProgress(null)
      showToast(msg, 'success')
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    } catch (err: any) {
      console.error('Curated seed error:', err)
      setProgress(null)
      showToast(err?.message || 'Failed to seed curated exercises', 'error')
    } finally {
      setIsSeedingCurated(false)
    }
  }

  return (
    <div className="bg-surface-200/60 border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="text-sm text-gray-400">
        One-time sync to load free-exercise-db into Supabase (images hosted on GitHub).
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSync}
          disabled={isSyncing || isSeedingCurated}
          className="px-4 py-2 rounded-xl bg-primary text-black font-bold disabled:opacity-60"
        >
          {isSyncing ? 'Syncing…' : 'Sync free-exercise-db'}
        </button>
        <button
          onClick={handleSeedCurated}
          disabled={isSyncing || isSeedingCurated}
          className="px-4 py-2 rounded-xl bg-surface-100 border border-white/10 text-white font-bold disabled:opacity-60"
        >
          {isSeedingCurated ? 'Seeding…' : 'Seed Curated Exercises'}
        </button>
      </div>
      {progress && <div className="text-xs text-yellow-400">{progress}</div>}
      {lastResult && <div className="text-xs text-green-400">{lastResult}</div>}
    </div>
  )
}
