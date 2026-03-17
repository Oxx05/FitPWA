import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'

export function SmartInsights() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()

  const { data: insights, isLoading } = useQuery({
    queryKey: ['smart-insights', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          created_at,
          session_sets (
            exercise_id,
            exercises (muscle_groups)
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const list = []
      
      // Insight 1: Consistency
      const lastSession = sessions?.[0]
      if (lastSession) {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastSession.created_at).getTime()) / (1000 * 3600 * 24))
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

      // Insight 2: Muscle Balance
      const recentMuscles = new Set()
      sessions?.slice(0, 5).forEach(s => {
          const sets = s.session_sets as unknown as Array<{ exercises: { muscle_groups: string[] } | null }>
          sets?.forEach(set => {
              set.exercises?.muscle_groups?.forEach((m: string) => recentMuscles.add(m))
          })
      })

      if (!recentMuscles.has('Pernas') && !recentMuscles.has('Quadríceps')) {
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
    enabled: !!profile?.id
  })

  if (isLoading || !insights?.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('insights.coachInsights')}</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-200/50 border border-white/5 p-4 rounded-2xl flex items-start gap-4 hover:border-primary/20 transition-all group"
          >
            <div className="bg-surface-100 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
              {insight.icon}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{insight.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{insight.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
