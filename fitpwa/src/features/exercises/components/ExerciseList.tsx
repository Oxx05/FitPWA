import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { MuscleIcon } from '@/shared/components/MuscleIcon'

interface ExerciseRow {
  id: string
  name: string | null
  name_pt: string | null
  muscle_groups: string[] | string | null
  equipment: string[] | string | null
}

export function ExerciseList() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['supabase-exercises', 50, 'with-gif', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('id, name, name_pt, muscle_groups, equipment')
        .order('name_pt', { ascending: true })
        .limit(50)
      if (searchQuery.trim()) {
        query = query.ilike('name_pt', `%${searchQuery.trim()}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as ExerciseRow[]
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="w-full h-9 bg-surface-200/60 border border-white/5 rounded-2xl" />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 bg-surface-200/60 border border-white/5 rounded-2xl p-3">
            <div className="w-14 h-14 rounded-xl bg-surface-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 rounded bg-surface-100" />
              <div className="h-2 w-1/3 rounded bg-surface-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-surface-200/60 border border-white/5 rounded-2xl pl-10 pr-3 py-2 text-sm text-gray-300 placeholder:text-gray-500"
          />
        </div>
        <div className="text-sm text-gray-400 bg-surface-200/60 border border-white/5 rounded-2xl p-4">
          Unable to load exercises right now.
        </div>
      </div>
    )
  }

  const exercises = data ?? []

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-surface-200/60 border border-white/5 rounded-2xl pl-10 pr-3 py-2 text-sm text-gray-300 placeholder:text-gray-500"
        />
      </div>
      {exercises.length === 0 && (
        <div className="text-sm text-gray-400 bg-surface-200/60 border border-white/5 rounded-2xl p-4">
          No exercises found.
        </div>
      )}
      {exercises.map(exercise => {
        const displayName = exercise.name_pt || exercise.name || 'Exercise'
        const muscleGroups = Array.isArray(exercise.muscle_groups)
          ? exercise.muscle_groups
          : exercise.muscle_groups ? [exercise.muscle_groups] : []
        const primaryMuscle = muscleGroups[0] ?? null
        const equipmentLabel = Array.isArray(exercise.equipment)
          ? exercise.equipment[0]
          : exercise.equipment
        return (
          <div
            key={exercise.id}
            className="flex items-center gap-3 bg-surface-200/60 border border-white/5 rounded-2xl p-3"
          >
            <div className="w-14 h-14 rounded-xl bg-surface-100 flex-shrink-0 overflow-hidden p-1">
              <MuscleIcon muscles={muscleGroups} size="sm" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{displayName}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                {(primaryMuscle || 'Exercise')}{equipmentLabel ? ` • ${equipmentLabel}` : ''}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
