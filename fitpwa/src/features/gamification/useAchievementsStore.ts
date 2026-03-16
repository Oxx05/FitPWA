import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/shared/lib/supabase'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
  requirement: string // 'workouts_count', 'streak_days', 'total_volume', etc.
  threshold: number
}

interface AchievementsState {
  achievements: Achievement[]
  unlockedIds: string[]
  isLoading: boolean
  fetchAchievements: (userId: string) => Promise<void>
  checkAchievements: (userId: string, stats: Record<string, any>) => Promise<Achievement[]>
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [
        { id: 'first_workout', title: 'Primeiro Passo', description: 'Completaste o teu primeiro treino!', icon: '🏁', requirement: 'workouts_count', threshold: 1 },
        { id: 'streak_3', title: 'Ritmo Certo', description: 'Mantiveste uma streak de 3 dias!', icon: '🔥', requirement: 'streak_days', threshold: 3 },
        { id: 'streak_7', title: 'Imparável', description: '7 dias seguidos a dar o máximo!', icon: '⚡', requirement: 'streak_days', threshold: 7 },
        { id: 'volume_1000', title: 'Peso Pesado', description: 'Levantaste um total de 1.000kg num treino!', icon: '🐘', requirement: 'session_volume', threshold: 1000 },
        { id: 'early_bird', title: 'Pássaro Madrugador', description: 'Treinaste antes das 8:00 AM.', icon: '🌅', requirement: 'early_workout', threshold: 1 },
      ],
      unlockedIds: [],
      isLoading: false,

      fetchAchievements: async (userId) => {
        set({ isLoading: true })
        const { data, error } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', userId)
        
        if (!error && data) {
          set({ unlockedIds: data.map(a => a.achievement_id), isLoading: false })
        } else {
          set({ isLoading: false })
        }
      },

      checkAchievements: async (userId, stats) => {
        const { achievements, unlockedIds } = get()
        const newUnlocks: Achievement[] = []

        for (const achievement of achievements) {
          if (unlockedIds.includes(achievement.id)) continue

          let met = false
          if (achievement.requirement === 'workouts_count' && stats.workoutsCount >= achievement.threshold) met = true
          if (achievement.requirement === 'streak_days' && stats.streakDays >= achievement.threshold) met = true
          if (achievement.requirement === 'session_volume' && stats.sessionVolume >= achievement.threshold) met = true
          if (achievement.requirement === 'early_workout' && stats.isEarly) met = true

          if (met) {
            newUnlocks.push(achievement)
            // Persist to Supabase
            await supabase.from('user_achievements').insert({
              user_id: userId,
              achievement_id: achievement.id
            })
          }
        }

        if (newUnlocks.length > 0) {
          set({ unlockedIds: [...unlockedIds, ...newUnlocks.map(a => a.id)] })
        }

        return newUnlocks
      }
    }),
    {
      name: 'fitpwa-achievements',
    }
  )
)
