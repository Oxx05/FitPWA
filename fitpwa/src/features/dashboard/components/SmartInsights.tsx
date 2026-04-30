import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { usePetStore } from '@/features/pet/usePetStore'
import { PetSvg } from '@/features/pet/PetSvg'

interface SmartInsightsProps {
  hideIcon?: boolean
}

export function SmartInsights({ hideIcon }: SmartInsightsProps) {
  const { t, i18n } = useTranslation()
  const { profile } = useAuthStore()
  const { selectedPet, getMood, petName } = usePetStore()

  const { data: insights, isLoading } = useQuery({
    queryKey: ['smart-insights', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          finished_at,
          session_sets (
            exercise_id,
            exercises (muscle_groups)
          )
        `)
        .eq('user_id', profile.id)
        .order('finished_at', { ascending: false })
        .limit(20)

      const list = []
      
      // Insight 1: Consistency
      const lastSession = sessions?.[0]
      if (lastSession?.finished_at) {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastSession.finished_at).getTime()) / (1000 * 3600 * 24))
        
        // Ensure distance isn't negative or extreme (Unix epoch fallback protection)
        if (daysSince >= 0 && daysSince < 10000) {
          if (daysSince === 0) {
            list.push({
              icon: <CheckCircle2 className="text-green-500" />,
              title: t('insights.doneTitle'),
              desc: t('insights.doneDesc')
            })
          } else if (daysSince > 3) {
            list.push({
              icon: <AlertCircle className="text-orange-500" />,
              title: t('insights.comebackTitle'),
              desc: t('insights.comebackDesc', { days: daysSince })
            })
          }
        }
      }

      // Insight 2: Muscle Balance
      const recentMuscles = new Set()
      sessions?.slice(0, 5).forEach(s => {
          const sets = s.session_sets as unknown as Array<{ exercises: { muscle_groups: string[] } | null }>
          sets?.forEach(set => {
              set.exercises?.muscle_groups?.forEach((m: string) => recentMuscles.add(m))
          })
      })

      if (!recentMuscles.has('legs') && !recentMuscles.has('quads')) {
          list.push({
              icon: <TrendingUp className="text-primary" />,
              title: t('insights.legsTitle'),
              desc: t('insights.legsDesc')
          })
      }

      // Fallback/Default
      if (list.length === 0) {
          list.push({
              icon: <Lightbulb className="text-yellow-500" />,
              title: t('insights.genericTitle'),
              desc: t('insights.genericDesc')
          })
      }

      return list
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Helper to remove redundant "Suggestion:" prefix
  const cleanTitle = (title: string) => {
    return title.replace(/^(Suggestion|Sugestão):\s*/i, '')
  }

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-surface-200 rounded w-32" />
      <div className="h-20 bg-surface-200 rounded-3xl" />
    </div>
  )
  if (!insights?.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('insights.coachInsights')}</h3>
      </div>
      
      <div className="flex flex-col gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-end gap-3"
          >
            {!hideIcon && (
              <div className="shrink-0 bg-surface-200/50 p-2 rounded-2xl border border-white/5 shadow-xl group hidden sm:block">
                <PetSvg 
                  model={selectedPet} 
                  mood={getMood()} 
                  size={56} 
                  className="group-hover:scale-110 transition-transform"
                />
              </div>
            )}
            
            <div className={`relative bg-surface-200/50 border border-white/5 p-4 rounded-3xl ${hideIcon ? 'rounded-bl-3xl' : 'rounded-bl-none'} flex-1 shadow-xl backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-black text-primary uppercase tracking-tighter">
                  {i18n.language === 'pt' 
                    ? (petName ? `Sugestão do ${petName}` : t('insights.suggestion'))
                    : (petName ? `${petName}'s ${t('insights.suggestion')}` : t('insights.suggestion'))
                  }
                </span>
                <h4 className="font-bold text-white text-sm">{cleanTitle(insight.title)}</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">{insight.desc}</p>
              
              {/* Speech bubble tail */}
              {!hideIcon && (
                <div 
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-surface-200/50 border-l border-b border-white/5"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)', transform: 'rotate(45deg)' }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
