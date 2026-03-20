import { useQuery } from '@tanstack/react-query'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { TrendingUp, Award, Zap } from 'lucide-react'

interface EvolutionData {
  date: string
  oneRepMax: number
  volume: number
}

interface ExerciseEvolutionProps {
  exerciseId: string
  exerciseName: string
}

interface RawSet {
  weight_kg: number
  reps: number
  workout_sessions: {
    finished_at: string
  }[]
}

export function ExerciseEvolution({ exerciseId, exerciseName }: ExerciseEvolutionProps) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()

  const { data: evolutionData, isLoading } = useQuery({
    queryKey: ['exercise-evolution', exerciseId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: sets, error } = await supabase
        .from('session_sets')
        .select(`
          weight_kg,
          reps,
          workout_sessions (finished_at)
        `)
        .eq('exercise_id', exerciseId)
        .order('workout_sessions(finished_at)', { ascending: true })

      if (error) throw error

      const dailyStats: Record<string, { max1RM: number; totalVolume: number }> = {}

      sets?.forEach((set: RawSet) => {
        const finishedAt = set.workout_sessions?.[0]?.finished_at
        if (!finishedAt) return
        const date = new Date(finishedAt).toLocaleDateString()
        const oneRepMax = (set.weight_kg || 0) * (1 + (set.reps || 0) / 30)
        const volume = (set.weight_kg || 0) * (set.reps || 0)

        if (!dailyStats[date]) {
          dailyStats[date] = { max1RM: oneRepMax, totalVolume: volume }
        } else {
          dailyStats[date].max1RM = Math.max(dailyStats[date].max1RM, oneRepMax)
          dailyStats[date].totalVolume += volume
        }
      })

      return Object.entries(dailyStats).map(([date, stats]): EvolutionData => ({
        date,
        oneRepMax: Math.round(stats.max1RM),
        volume: Math.round(stats.totalVolume)
      }))
    },
    enabled: !!profile?.id && !!exerciseId
  })

  if (isLoading) return <div className="h-64 bg-surface-200/50 rounded-3xl animate-pulse" />

  if (!evolutionData || evolutionData.length === 0) {
    return (
      <div className="text-center py-12 bg-surface-200/20 rounded-3xl border border-dashed border-white/5">
        <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">{t('evolution.noData')}</p>
        <p className="text-[10px] text-gray-600 mt-2">{t('evolution.completeWorkouts')}</p>
      </div>
    )
  }

  const latest = evolutionData[evolutionData.length - 1]
  const first = evolutionData[0]
  const improvement = first.oneRepMax > 0 ? ((latest.oneRepMax - first.oneRepMax) / first.oneRepMax) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
         <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{exerciseName}</h3>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('evolution.history')}</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-200/50 p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{t('evolution.max1rm')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white italic">{latest.oneRepMax}</span>
            <span className="text-xs text-gray-500 font-bold">kg</span>
          </div>
          {improvement > 0 && (
            <div className="flex items-center gap-1 mt-1 text-green-500">
               <TrendingUp className="w-3 h-3" />
               <span className="text-[10px] font-black">+{improvement.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="bg-surface-200/50 p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{t('evolution.xpEstimated')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary italic">{Math.round(latest.volume / 10)}</span>
            <Zap className="w-3 h-3 text-primary" />
          </div>
        </div>
      </div>

      <div className="bg-surface-200/50 border border-white/5 p-4 rounded-[2rem] h-64 w-full">
        <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={0}>
          <AreaChart data={evolutionData}>
            <defs>
              <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BEF264" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#BEF264" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff01" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F1F23', border: 'none', borderRadius: '12px', fontSize: '10px' }}
              itemStyle={{ color: '#BEF264', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="oneRepMax" 
              stroke="#BEF264" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMax)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black shrink-0">
             <Award className="w-6 h-6" />
          </div>
          <div>
             <p className="text-xs font-black text-white italic uppercase tracking-tight">{t('evolution.proPrediction')}</p>
             <p className="text-[10px] text-gray-400 font-medium">{t('evolution.proPredictionDesc')}</p>
          </div>
      </div>
    </div>
  )
}
