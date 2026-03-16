import { useQuery } from '@tanstack/react-query'
import { Trophy, TrendingUp, Calendar, Zap, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthProvider'
import { EXERCISES } from '@/shared/data/exercises'
import { WeightProgressChart } from './WeightProgressChart'
import { SocialShare } from './SocialShare'
import { Button } from '@/shared/components/Button'
import { pushNotifications } from '@/shared/lib/pushNotifications'

interface PR {
  exercise_id: string
  exercise_name: string
  weight_kg: number
  reps: number
  date_set: string
}

interface WorkoutHistory {
  id: string
  exercise_id: string
  exercise_name: string
  sets_completed: number
  duration_seconds: number
  created_at: string
}

export function RecordsPage() {
  const { profile } = useAuthStore()

  // Initialize notifications on mount
  useEffect(() => {
    if (pushNotifications.isSupported() && !pushNotifications.isPermissionGranted()) {
      // Optionally request permission
      // pushNotifications.requestPermission()
    }
  }, [])

  const { data: prs, isLoading: prsLoading } = useQuery({
    queryKey: ['personal-records', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', profile.id)
        .order('weight_kg', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching PRs:', error)
        return []
      }

      return (data || []).map(pr => {
        const exercise = EXERCISES.find(e => e.id === pr.exercise_id)
        return {
          exercise_id: pr.exercise_id,
          exercise_name: exercise?.name || pr.exercise_id,
          weight_kg: pr.weight_kg || 0,
          reps: pr.reps || 0,
          date_set: pr.date_set
        }
      }) as PR[]
    }
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['workout-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching history:', error)
        return []
      }

      return (data || []).map(h => {
        const exercise = EXERCISES.find(e => e.id === h.exercise_id)
        return {
          id: h.id,
          exercise_id: h.exercise_id,
          exercise_name: exercise?.name || h.exercise_id,
          sets_completed: h.sets_completed || 0,
          duration_seconds: h.duration_seconds || 0,
          created_at: h.created_at
        }
      }) as WorkoutHistory[]
    }
  })

  const totalWorkouts = history?.length || 0
  const totalVolume = prs?.reduce((sum, pr) => sum + pr.weight_kg, 0) || 0
  const bestExercise = prs?.[0]?.exercise_name || 'N/A'

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registos & PRs</h1>
          <p className="text-gray-400">Acompanhe seu progresso e recordes pessoais</p>
        </div>
        <Button
          size="sm"
          onClick={() => pushNotifications.requestPermission()}
          variant={pushNotifications.isPermissionGranted() ? 'secondary' : 'primary'}
          className="flex items-center gap-2"
        >
          <Bell size={16} />
          {pushNotifications.isPermissionGranted() ? 'Notificações ON' : 'Ativar Notificações'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-200 border border-surface-100 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total de Treinos</p>
              <p className="text-3xl font-bold text-white mt-2">{totalWorkouts}</p>
            </div>
            <Zap className="w-12 h-12 text-primary/20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-200 border border-surface-100 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Volume Total (kg)</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{totalVolume.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-400/20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-200 border border-surface-100 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Seu Best Lift</p>
              <p className="text-xl font-bold text-primary mt-2">{bestExercise}</p>
            </div>
            <Trophy className="w-12 h-12 text-yellow-400/20" />
          </div>
        </motion.div>
      </div>

      {/* Weight Progress Chart */}
      {prs && prs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WeightProgressChart records={prs.map(pr => ({
            id: pr.exercise_id,
            user_id: profile?.id || '',
            exercise_id: pr.exercise_id,
            weight_kg: pr.weight_kg,
            reps: pr.reps,
            date_set: pr.date_set,
            created_at: pr.date_set
          } as any))} />
        </motion.div>
      )}

      {/* PRs Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Personal Records 🏆</h2>
        {prsLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prs && prs.length > 0 ? (
          <div className="space-y-3">
            {prs.map((pr, idx) => (
              <motion.div
                key={pr.exercise_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-surface-200 border border-surface-100 p-4 rounded-xl hover:border-primary/30 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">{pr.exercise_name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(pr.date_set).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{pr.weight_kg}kg</p>
                    <p className="text-sm text-gray-400">x{pr.reps}</p>
                  </div>
                  <SocialShare
                    title={`Novo PR - ${pr.exercise_name}`}
                    text={`Acabo de estabelecer um novo PR! 🏆`}
                    exerciseName={pr.exercise_name}
                    weight={pr.weight_kg}
                    reps={pr.reps}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-surface-100 rounded-2xl border border-surface-200">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum PR registado ainda. Comece a treinar!</p>
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Histórico de Treinos</h2>
        {historyLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.slice(0, 20).map((h, idx) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-surface-200 border border-surface-100 p-4 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-white">{h.exercise_name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(h.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{h.sets_completed} sets</p>
                  <p className="text-xs text-gray-500">
                    {Math.floor(h.duration_seconds / 60)}m {h.duration_seconds % 60}s
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-surface-100 rounded-2xl border border-surface-200">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum treino registado ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
