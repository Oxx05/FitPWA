import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/shared/lib/supabase'

export interface Achievement {
  id: string
  groupId: string 
  level: number // 1: Bronze, 2: Silver, 3: Gold, 4: Platinum
  title: string
  title_pt: string
  description: string
  description_pt: string
  icon: string
  unlockedAt?: string
  requirement: string 
  threshold: number
  secret?: boolean
  rarity?: number // Percentage 0-100
}

export interface AchievementStats {
  workoutsCount: number
  streakDays: number
  sessionVolume: number
  totalVolume?: number
  socialLikes?: number
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
  pendingUnlocks: Achievement[]
  isLoading: boolean
  fetchAchievements: (userId: string) => Promise<void>
  fetchRarityStats: () => Promise<void>
  checkAchievements: (userId: string, stats: AchievementStats) => Promise<Achievement[]>
  clearPendingUnlocks: () => void
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [
        // STREAKS
        { id: 'streak_3', groupId: 'streak', level: 1, title: 'Right Rhythm', title_pt: 'Ritmo Certo', description: '3-day streak!', description_pt: 'Streak de 3 dias!', icon: '🔥', requirement: 'streak_days', threshold: 3 },
        { id: 'streak_7', groupId: 'streak', level: 2, title: 'Unstoppable', title_pt: 'Imparável', description: '7-day streak!', description_pt: 'Streak de 7 dias!', icon: '⚡', requirement: 'streak_days', threshold: 7 },
        { id: 'streak_30', groupId: 'streak', level: 3, title: 'Iron Habit', title_pt: 'Hábito de Ferro', description: '30-day streak!', description_pt: 'Streak de 30 dias!', icon: '👑', requirement: 'streak_days', threshold: 30 },
        { id: 'streak_365', groupId: 'streak', level: 4, title: 'Legendary Habit', title_pt: 'Hábito Lendário', description: '365-day streak! Pure discipline.', description_pt: 'Streak de 365 dias! Disciplina pura.', icon: '💎', requirement: 'streak_days', threshold: 365 },
        
        // WORKOUTS COUNT
        { id: 'workouts_1', groupId: 'workouts', level: 1, title: 'First Step', title_pt: 'Primeiro Passo', description: 'First workout completed!', description_pt: 'Primeiro treino concluído!', icon: '🏁', requirement: 'workouts_count', threshold: 1 },
        { id: 'workouts_25', groupId: 'workouts', level: 2, title: 'Regular', title_pt: 'Habitué', description: '25 workouts completed!', description_pt: '25 treinos concluídos!', icon: '🏃', requirement: 'workouts_count', threshold: 25 },
        { id: 'workouts_100', groupId: 'workouts', level: 3, title: 'Century Club', title_pt: 'Clube dos 100', description: '100 workouts! You are a machine.', description_pt: '100 treinos! És uma máquina.', icon: '🦾', requirement: 'workouts_count', threshold: 100 },
        { id: 'workouts_1000', groupId: 'workouts', level: 4, title: 'Immortal', title_pt: 'Imortal', description: '1000 workouts. You are the gym.', description_pt: '1000 treinos. Tu és o ginásio.', icon: '🌌', requirement: 'workouts_count', threshold: 1000 },

        // VOLUME
        { id: 'volume_1000', groupId: 'volume', level: 1, title: 'Heavyweight', title_pt: 'Peso Pesado', description: 'Lifted 1,000kg in one workout!', description_pt: 'Levantaste 1.000kg num treino!', icon: '🐘', requirement: 'session_volume', threshold: 1000 },
        { id: 'volume_5000', groupId: 'volume', level: 2, title: 'Iron Titan', title_pt: 'Titã de Ferro', description: 'Lifted 5,000kg in one workout!', description_pt: 'Levantaste 5.000kg num treino!', icon: '🏗️', requirement: 'session_volume', threshold: 5000 },
        { id: 'volume_10000', groupId: 'volume', level: 3, title: 'Earth Shaker', title_pt: 'Sismo Humano', description: '10,000kg in a single session!', description_pt: '10.000kg numa única sessão!', icon: '🌎', requirement: 'session_volume', threshold: 10000 },
        { id: 'volume_1000000', groupId: 'volume', level: 4, title: 'Titan of Earth', title_pt: 'Titã da Terra', description: 'Lifted 1,000,000kg total volume!', description_pt: 'Levantaste 1.000.000kg de volume total!', icon: '☄️', requirement: 'total_volume', threshold: 1000000 },

        // LEVEL
        { id: 'level_5', groupId: 'level', level: 1, title: 'Ascending', title_pt: 'A Ascender', description: 'Reached Level 5!', description_pt: 'Chegaste ao Nível 5!', icon: '🌱', requirement: 'level', threshold: 5 },
        { id: 'level_20', groupId: 'level', level: 2, title: 'Elite Athlete', title_pt: 'Atleta de Elite', description: 'Reached Level 20!', description_pt: 'Chegaste ao Nível 20!', icon: '🌟', requirement: 'level', threshold: 20 },
        { id: 'level_50', groupId: 'level', level: 3, title: 'Master of Gym', title_pt: 'Mestre do Ginásio', description: 'Reached Level 50!', description_pt: 'Chegaste ao Nível 50!', icon: '🌋', requirement: 'level', threshold: 50 },
        { id: 'level_100', groupId: 'level', level: 4, title: 'Living God', title_pt: 'Deus Vivo', description: 'Reached Level 100!', description_pt: 'Chegaste ao Nível 100!', icon: '💠', requirement: 'level', threshold: 100 },

        // SOCIAL
        { id: 'social_10', groupId: 'social', level: 1, title: 'Community Spirit', title_pt: 'Espírito de Equipa', description: 'Inspired 10 athletes!', description_pt: 'Inspiraste 10 atletas!', icon: '❤️', requirement: 'social_likes', threshold: 10 },
        { id: 'social_50', groupId: 'social', level: 2, title: 'Inspiration Hub', title_pt: 'Centro de Inspiração', description: 'Inspired 50 athletes!', description_pt: 'Inspiraste 50 atletas!', icon: '✨', requirement: 'social_likes', threshold: 50 },
        { id: 'social_200', groupId: 'social', level: 3, title: 'Influencer', title_pt: 'Influencer', description: 'Inspired 200 athletes!', description_pt: 'Inspiraste 200 atletas!', icon: '📣', requirement: 'social_likes', threshold: 200 },
        { id: 'social_1000', groupId: 'social', level: 4, title: 'Icon', title_pt: 'Ícone', description: 'Inspired 1000 athletes!', description_pt: 'Inspiraste 1000 atletas!', icon: '🌍', requirement: 'social_likes', threshold: 1000 },

        // SECRETS
        { id: 'midnight_trainer', groupId: 'secret_time', level: 1, title: 'Night Owl', title_pt: 'Coruja da Noite', description: 'Workout between 11PM and 4AM.', description_pt: 'Treinaste entre as 23h e as 4h.', icon: '🦉', requirement: 'midnight_workout', threshold: 1, secret: true },
        { id: 'viking_spirit', groupId: 'secret_viking', level: 1, title: 'Viking Spirit', title_pt: 'Espírito Viking', description: 'Extreme intensity session.', description_pt: 'Treino de altíssima intensidade.', icon: '🪓', requirement: 'extreme_intensity', threshold: 1, secret: true },
        { id: 'dawn_patrol', groupId: 'secret_dawn', level: 1, title: 'Dawn Patrol', title_pt: 'Patrulha do Amanhecer', description: 'Workout before 7AM.', description_pt: 'Treino antes das 7h da manhã.', icon: '🌅', requirement: 'early_workout', threshold: 1, secret: true },
        { id: 'weekend_warrior', groupId: 'secret_weekend', level: 1, title: 'Weekend Warrior', title_pt: 'Guerreiro de Fim de Semana', description: 'Train on both Saturday and Sunday.', description_pt: 'Treina no Sábado e no Domingo.', icon: '🛡️', requirement: 'weekend_training', threshold: 2, secret: true },
        { id: 'speed_demon', groupId: 'secret_speed', level: 1, title: 'Speed Demon', title_pt: 'Demónio Veloz', description: 'High intensity in under 20 mins.', description_pt: 'Alta intensidade em menos de 20 min.', icon: '🏎️', requirement: 'speed_workout', threshold: 1, secret: true },
        { id: 'social_butterfly', groupId: 'secret_social', level: 1, title: 'Social Butterfly', title_pt: 'Socialite', description: 'Like 50 community workouts.', description_pt: 'Gostaste de 50 treinos da comunidade.', icon: '🦋', requirement: 'social_likes', threshold: 50, secret: true },
      ],
      unlockedIds: [],
      pendingUnlocks: [],
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

      fetchRarityStats: async () => {
        // Fetch total profiles count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (!totalUsers) return

        // Fetch counts per achievement
        const { data: counts } = await supabase
          .from('user_achievements')
          .select('achievement_id')
        
        if (!counts) return

        const idCounts = counts.reduce((acc, curr) => {
          acc[curr.achievement_id] = (acc[curr.achievement_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        set(state => ({
          achievements: state.achievements.map(a => ({
            ...a,
            rarity: Math.round(((idCounts[a.id] || 0) / totalUsers) * 1000) / 10 // Store as 0.0 - 100.0
          }))
        }))
      },

      clearPendingUnlocks: () => set({ pendingUnlocks: [] }),

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
          if (achievement.requirement === 'total_volume' && (stats.totalVolume || 0) >= achievement.threshold) met = true
          if (achievement.requirement === 'social_likes' && (stats.socialLikes || 0) >= achievement.threshold) met = true
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
          set({ 
            unlockedIds: [...unlockedIds, ...newUnlocks.map(a => a.id)],
            pendingUnlocks: [...get().pendingUnlocks, ...newUnlocks]
          })
        }

        return newUnlocks
      }
    }),
    {
      name: 'titanpulse-achievements',
    }
  )
)
