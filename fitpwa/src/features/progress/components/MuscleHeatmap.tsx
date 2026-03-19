import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { subDays } from 'date-fns'

interface MuscleVolume {
  [key: string]: number
}

// Map database muscle groups (internal keys) to heatmap categories
const CATEGORY_MAP: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  legs: 'legs',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abs: 'core',
  core: 'core',
  obliques: 'core'
}

export function MuscleHeatmap() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()

  const { data: muscleData, isLoading } = useQuery({
    queryKey: ['muscle-heatmap', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {}

      const sevenDaysAgo = subDays(new Date(), 7).toISOString()

      const { data: sessions, error: sErr } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          session_sets (
            reps,
            weight_kg,
            exercise_id,
            exercises (muscle_groups)
          )
        `)
        .eq('user_id', profile.id)
        .gte('finished_at', sevenDaysAgo)

      if (sErr) throw sErr

      const volume: MuscleVolume = {}
      sessions?.forEach(session => {
        const sets = session.session_sets as unknown as Array<{ exercises: Array<{ muscle_groups: string[] }> | null }>
        sets?.forEach(set => {
          const muscles = set.exercises?.[0]?.muscle_groups || []
          muscles.forEach((m: string) => {
            volume[m] = (volume[m] || 0) + 1
          })
        })
      })

      return volume
    },
    enabled: !!profile?.id
  })

  const getColor = (count: number) => {
    if (count === 0) return '#1F1F23' // surface-100
    if (count < 3) return '#3F3F46' // medium
    if (count < 6) return '#84CC16' // primary (low opacity/tint)
    if (count < 10) return '#A3E635' // primary-light
    return '#BEF264' // primary-bright
  }

  const musclePaths = {
    chest: 'M 100,80 L 140,80 L 140,110 L 100,110 Z M 160,80 L 200,80 L 200,110 L 160,110 Z',
    back: 'M 110,80 L 190,80 L 190,150 L 110,150 Z', 
    shoulders: 'M 80,80 L 100,80 L 100,110 L 80,110 Z M 200,80 L 220,80 L 220,110 L 200,110 Z',
    arms: 'M 70,110 L 95,110 L 85,180 L 60,180 Z M 205,110 L 230,110 L 240,180 L 215,180 Z',
    legs: 'M 105,200 L 145,200 L 140,350 L 100,350 Z M 155,200 L 195,200 L 200,350 L 160,350 Z',
    core: 'M 120,120 L 180,120 L 180,190 L 120,190 Z'
  }

  const normalizedVolume = useMemo(() => {
    const norm: Record<string, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0, core: 0 }
    if (!muscleData) return norm

    Object.entries(muscleData).forEach(([dbMuscle, count]) => {
      const cat = CATEGORY_MAP[dbMuscle]
      if (cat) norm[cat] += count as number
    })
    return norm
  }, [muscleData])

  if (isLoading) return <div className="h-64 animate-pulse bg-surface-100 rounded-3xl" />

  return (
    <div className="bg-surface-200/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Heatmap Muscular</h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Últimos 7 dias</p>
      </div>

      <div className="relative w-full max-w-[240px] aspect-[2/3]">
        <svg viewBox="0 0 300 450" className="w-full h-full drop-shadow-2xl">
          <path 
            d="M 150,20 C 130,20 120,40 120,60 C 120,75 135,80 150,80 C 165,80 180,75 180,60 C 180,40 170,20 150,20 Z" 
            fill="#1F1F23" 
          />
          
          {Object.entries(musclePaths).map(([key, path]) => (
            <motion.path
              key={key}
              d={path}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                fill: getColor(normalizedVolume[key] || 0)
              }}
              className="transition-colors duration-1000"
              stroke="#0A0A0B"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div className="absolute top-0 right-0 flex flex-col gap-1">
          {[10, 6, 3, 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(v) }} />
              <span className="text-[8px] text-gray-500 font-bold uppercase">{v === 0 ? 'Frio' : v >= 10 ? 'Elite' : 'Ativo'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {Object.entries(normalizedVolume).map(([cat, val]) => (
          val > 0 && (
            <div key={cat} className="bg-surface-100 px-3 py-1.5 rounded-xl border border-white/5 flex justify-between items-center">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">
                {t(`common.muscles.${cat}`)}
              </span>
              <span className="text-xs font-black text-primary">{val} sets</span>
            </div>
          )
        ))}
      </div>
    </div>
  )
}
