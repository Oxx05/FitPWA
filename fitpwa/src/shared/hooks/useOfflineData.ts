import { useQuery } from '@tanstack/react-query'
import { OfflineSyncService } from '@/shared/lib/offlineSync'
import { supabase } from '@/shared/lib/supabase'

export function useOfflinePlans(userId?: string) {
  return useQuery({
    queryKey: ['plans', userId],
    queryFn: async () => {
      if (!userId) return []

      // Try network first
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (!error && data) {
            // Update cache in background
            const cacheData = data.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              exercises: p.exercises || [],
              difficulty: p.difficulty,
              updatedAt: p.updated_at || new Date().toISOString()
            }))
            void OfflineSyncService.cachePlans(cacheData)
            return data
          }
        } catch (err) {
          console.warn('Network fetch failed, falling back to cache:', err)
        }
      }

      // Fallback or Offline: return from cache
      const cached = await OfflineSyncService.getCachedPlans()
      // Map cache schema back to what the UI expects (if slightly different)
      return cached.map(c => ({
        ...c,
        created_at: c.updatedAt // Fallback
      }))
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useOfflineExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('exercises')
            .select('*')

          if (!error && data) {
            // Update cache
            const cacheData = data.map(e => ({
              id: e.id,
              name: e.name,
              name_pt: e.name_pt,
              muscleGroups: e.muscle_groups || [],
              movementType: e.movement_type || '',
              equipment: e.equipment || [],
              difficulty: e.difficulty || ''
            }))
            void OfflineSyncService.cacheExercises(cacheData)
            return data
          }
        } catch (err) {
          console.warn('Exercise fetch failed, using cache:', err)
        }
      }

      return await OfflineSyncService.getCachedExercises()
    }
  })
}
