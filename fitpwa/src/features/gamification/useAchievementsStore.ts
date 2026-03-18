import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/shared/lib/supabase'

export interface Achievement {
  id: string
  groupId: string // To group upgrades (e.g., 'streak')
  level: number // 1: Bronze, 2: Silver, 3: Gold, 4: Platinum
  title: string
  title_pt: string
  description: string
  description_pt: string
  icon: string
  unlockedAt?: string
  requirement: string // 'workouts_count', 'streak_days', 'total_volume', etc.
  threshold: number
  secret?: boolean
}

export interface AchievementStats {
  workoutsCount: number
  streakDays: number
  sessionVolume: number
  level: number
  isEarly?: boolean
  isMidnight?: boolean
  isExtreme?: boolean
  isSpeed?: boolean
  isWeekend?: boolean
}

interface AchievementsState {
  achievements: Achievement[]
  unlockedIds: string[]
  isLoading: boolean
  fetchAchievements: (userId: string) => Promise<void>
  checkAchievements: (userId: string, stats: AchievementStats) => Promise<Achievement[]>
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [
        // STREAKS
        { id: 'streak_3', groupId: 'streak', level: 1, title: 'Right Rhythm', title_pt: 'Ritmo Certo', description: '3-day streak!', description_pt: 'Streak de 3 dias!', icon: '🔥', requirement: 'streak_days', threshold: 3 },
        { id: 'streak_7', groupId: 'streak', level: 2, title: 'Unstoppable', title_pt: 'Imparável', description: '7-day streak!', description_pt: 'Streak de 7 dias!', icon: '⚡', requirement: 'streak_days', threshold: 7 },
        { id: 'streak_30', groupId: 'streak', level: 3, title: 'Iron Habit', title_pt: 'Hábito de Ferro', description: '30-day streak!', description_pt: 'Streak de 30 dias!', icon: '👑', requirement: 'streak_days', threshold: 30 },
        
        // WORKOUTS COUNT
        { id: 'workouts_1', groupId: 'workouts', level: 1, title: 'First Step', title_pt: 'Primeiro Passo', description: 'First workout completed!', description_pt: 'Primeiro treino concluído!', icon: '🏁', requirement: 'workouts_count', threshold: 1 },
        { id: 'workouts_25', groupId: 'workouts', level: 2, title: 'Regular', title_pt: 'Habitué', description: '25 workouts completed!', description_pt: '25 treinos concluídos!', icon: '🏃', requirement: 'workouts_count', threshold: 25 },
        { id: 'workouts_100', groupId: 'workouts', level: 3, title: 'Century Club', title_pt: 'Clube dos 100', description: '100 workouts! You are a machine.', description_pt: '100 treinos! És uma máquina.', icon: '🦾', requirement: 'workouts_count', threshold: 100 },

        // VOLUME
        { id: 'volume_1000', groupId: 'volume', level: 1, title: 'Heavyweight', title_pt: 'Peso Pesado', description: 'Lifted 1,000kg in one workout!', description_pt: 'Levantaste 1.000kg num treino!', icon: '🐘', requirement: 'session_volume', threshold: 1000 },
        { id: 'volume_5000', groupId: 'volume', level: 2, title: 'Iron Titan', title_pt: 'Titã de Ferro', description: 'Lifted 5,000kg in one workout!', description_pt: 'Levantaste 5.000kg num treino!', icon: '🏗️', requirement: 'session_volume', threshold: 5000 },
        { id: 'volume_10000', groupId: 'volume', level: 3, title: 'Earth Shaker', title_pt: 'Sismo Humano', description: '10,000kg in a single session!', description_pt: '10.000kg numa única sessão!', icon: '🌎', requirement: 'session_volume', threshold: 10000 },

        // SECRETS
        { id: 'midnight_trainer', groupId: 'secret_time', level: 1, title: 'Night Owl', title_pt: 'Coruja da Noite', description: 'Workout between 11PM and 4AM.', description_pt: 'Treinaste entre as 23h e as 4h.', icon: '🦉', requirement: 'midnight_workout', threshold: 1, secret: true },
        { id: 'viking_spirit', groupId: 'secret_viking', level: 1, title: 'Viking Spirit', title_pt: 'Espírito Viking', description: 'Workout during a lightning storm (or just high intensity!).', description_pt: 'Treino de altíssima intensidade.', icon: '🪓', requirement: 'extreme_intensity', threshold: 1, secret: true },
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
          if (achievement.requirement === 'level' && stats.level >= achievement.threshold) met = true
          if (achievement.requirement === 'midnight_workout' && stats.isMidnight) met = true
          if (achievement.requirement === 'extreme_intensity' && stats.isExtreme) met = true
          if (achievement.requirement === 'speed_workout' && stats.isSpeed) met = true
          if (achievement.requirement === 'weekend_training' && stats.isWeekend) met = true

          if (met) {
            newUnlocks.push(achievement)
            // Persist to Supabase and handle errors
            try {
              const { error } = await supabase.from('user_achievements').insert({
                user_id: userId,
                achievement_id: achievement.id
              })
              if (error) console.error('Error saving achievement:', error)
            } catch (e) {
              console.error('Failed to persist achievement:', e)
            }
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
