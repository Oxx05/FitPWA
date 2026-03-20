import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { subDays } from 'date-fns'

interface MuscleVolume {
  [key: string]: number
}

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

// Each path key maps to a group of SVG paths for that muscle category
// viewBox: 0 0 300 440
const MUSCLE_PATHS: Record<string, string[]> = {
  shoulders: [
    // Left deltoid
    'M 62,90 C 50,82 46,105 52,118 L 68,118 L 78,95 Z',
    // Right deltoid
    'M 238,90 C 250,82 254,105 248,118 L 232,118 L 222,95 Z',
  ],
  chest: [
    // Left pec
    'M 80,92 L 144,88 L 144,130 C 138,148 82,144 78,128 Z',
    // Right pec
    'M 220,92 L 156,88 L 156,130 C 162,148 218,144 222,128 Z',
  ],
  back: [
    // Full back silhouette (shown behind chest as a wider shape)
    'M 75,88 L 225,88 L 218,165 Q 150,178 82,165 Z',
  ],
  arms: [
    // Left arm (bicep + forearm)
    'M 50,118 L 72,118 L 66,195 L 42,195 Z',
    'M 40,198 L 65,198 L 58,265 L 34,265 Z',
    // Right arm
    'M 250,118 L 228,118 L 234,195 L 258,195 Z',
    'M 260,198 L 235,198 L 242,265 L 266,265 Z',
  ],
  core: [
    // Abs / obliques block
    'M 106,132 L 194,132 L 190,215 Q 150,222 110,215 Z',
  ],
  legs: [
    // Left quad + hamstring
    'M 102,220 L 147,220 L 142,355 Q 118,365 94,355 Z',
    // Left calf
    'M 97,360 L 139,360 L 133,415 Q 112,422 91,415 Z',
    // Right quad
    'M 198,220 L 153,220 L 158,355 Q 182,365 206,355 Z',
    // Right calf
    'M 203,360 L 161,360 L 167,415 Q 188,422 209,415 Z',
  ],
}

// Color stops: 0 → dark, 1-2 → tint, 3-5 → lime, 6-9 → bright lime, 10+ → cyan
const getColor = (count: number): string => {
  if (count === 0) return '#1A1A1E'
  if (count < 3)  return '#2A3A12'
  if (count < 6)  return '#84CC16'
  if (count < 10) return '#4ADE80'
  return '#22D3EE'
}

const getStroke = (count: number): string => {
  if (count === 0) return '#2A2A30'
  if (count < 3)  return '#3D5C1A'
  if (count < 6)  return '#65A30D'
  if (count < 10) return '#22C55E'
  return '#06B6D4'
}

export function MuscleHeatmap() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)

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
            exercise_id
          )
        `)
        .eq('user_id', profile.id)
        .gte('finished_at', sevenDaysAgo)

      if (sErr) throw sErr

      const volume: MuscleVolume = {}
      const rawSessions = sessions || []

      const allExerciseIds = new Set<string>()
      rawSessions.forEach(s => {
        (s.session_sets as any[])?.forEach(set => {
          if (set.exercise_id) allExerciseIds.add(set.exercise_id)
        })
      })

      let exerciseMuscles: Record<string, string[]> = {}
      if (allExerciseIds.size > 0) {
        const { data: exData } = await supabase
          .from('exercises')
          .select('id, muscle_groups')
          .in('id', Array.from(allExerciseIds))

        if (exData) {
          exData.forEach(ex => {
            exerciseMuscles[ex.id] = ex.muscle_groups || []
          })
        }
      }

      rawSessions.forEach(session => {
        const sets = session.session_sets as any[]
        sets?.forEach(set => {
          const muscles = exerciseMuscles[set.exercise_id] || []
          muscles.forEach((m: string) => {
            volume[m] = (volume[m] || 0) + 1
          })
        })
      })

      return volume
    },
    enabled: !!profile?.id
  })

  const normalizedVolume = useMemo(() => {
    const norm: Record<string, number> = {
      chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0, core: 0
    }
    if (!muscleData) return norm
    Object.entries(muscleData).forEach(([dbMuscle, count]) => {
      const cat = CATEGORY_MAP[dbMuscle.toLowerCase()]
      if (cat) norm[cat] += count as number
    })
    return norm
  }, [muscleData])

  if (isLoading) return <div className="h-64 animate-pulse bg-surface-100 rounded-3xl" />

  const hoveredCount = hoveredMuscle ? (normalizedVolume[hoveredMuscle] || 0) : null

  return (
    <div className="bg-surface-200/50 border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
          {t('progress.muscleHeatmap')}
        </h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
          {t('progress.last7Days')}
        </p>
      </div>

      <div className="relative w-full max-w-[240px] aspect-[3/4]">
        {/* Tooltip */}
        {hoveredMuscle && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 bg-surface-100 border border-white/10 px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
            <span className="text-xs font-black text-white uppercase tracking-tight">
              {t(`common.muscles.${hoveredMuscle}`)}
            </span>
            <span className="text-primary font-bold text-xs ml-2">
              {hoveredCount} sets
            </span>
          </div>
        )}

        <svg viewBox="0 0 300 440" className="w-full h-full drop-shadow-2xl">
          {/* Head */}
          <ellipse cx="150" cy="38" rx="26" ry="30" fill="#1F1F23" stroke="#2A2A30" strokeWidth="1" />
          {/* Neck */}
          <rect x="138" y="66" width="24" height="22" rx="4" fill="#1F1F23" stroke="#2A2A30" strokeWidth="1" />

          {/* Body outline (silhouette) */}
          <path
            d="M 65,88 L 235,88 L 228,220 L 205,220 L 200,355 L 210,415 L 185,420 L 167,360 L 150,360 L 133,360 L 115,420 L 90,415 L 100,355 L 95,220 L 72,220 Z"
            fill="#141418"
            stroke="#222228"
            strokeWidth="1"
          />

          {/* Muscle groups */}
          {(Object.keys(MUSCLE_PATHS) as Array<keyof typeof MUSCLE_PATHS>).map(key => {
            const count = normalizedVolume[key] || 0
            const isHovered = hoveredMuscle === key
            return (
              <g
                key={key}
                onMouseEnter={() => setHoveredMuscle(key)}
                onMouseLeave={() => setHoveredMuscle(null)}
                className="cursor-pointer"
              >
                {MUSCLE_PATHS[key].map((path, i) => (
                  <motion.path
                    key={i}
                    d={path}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: isHovered ? 1 : 0.9,
                      fill: isHovered
                        ? (count > 0 ? getColor(count) : '#3A3A44')
                        : getColor(count),
                      filter: isHovered && count > 0
                        ? `drop-shadow(0 0 6px ${getColor(count)}80)`
                        : 'none',
                    }}
                    transition={{ duration: 0.2 }}
                    stroke={getStroke(count)}
                    strokeWidth={isHovered ? "2" : "1"}
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute top-0 right-[-40px] flex flex-col gap-2">
          {[
            { v: 10, label: t('progress.elite') },
            { v: 6,  label: t('progress.active') },
            { v: 3,  label: t('progress.active') },
            { v: 0,  label: t('progress.cold') },
          ].map(({ v, label }, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(v) }} />
              <span className="text-[8px] text-gray-500 font-bold uppercase">{v === 0 ? t('progress.cold') : v >= 10 ? t('progress.elite') : label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {Object.entries(normalizedVolume).map(([cat, val]) => (
          val > 0 && (
            <motion.div
              key={cat}
              whileHover={{ scale: 1.03 }}
              onMouseEnter={() => setHoveredMuscle(cat)}
              onMouseLeave={() => setHoveredMuscle(null)}
              className={`px-3 py-1.5 rounded-xl border flex justify-between items-center cursor-default transition-colors ${
                hoveredMuscle === cat
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-surface-100 border-white/5'
              }`}
            >
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">
                {t(`common.muscles.${cat}`)}
              </span>
              <span className="text-xs font-black" style={{ color: getColor(val) }}>
                {val} sets
              </span>
            </motion.div>
          )
        ))}
      </div>
    </div>
  )
}
