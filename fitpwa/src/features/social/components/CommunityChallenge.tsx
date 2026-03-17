import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Users, Zap, TrendingUp } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'

export function CommunityChallenge() {
  const { profile } = useAuthStore()

  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['community-challenge', profile?.id],
    queryFn: async () => {
      const now = new Date()
      // Get monday 00:00:00
      const d = new Date(now)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const startOfWeek = new Date(d.setDate(diff))
      startOfWeek.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('total_volume, user_id')
        .gte('finished_at', startOfWeek.toISOString())

      if (error) throw error

      const totalValue = data?.reduce((acc, s) => acc + (s.total_volume || 0), 0) || 0
      const userContribution = data?.filter(s => s.user_id === profile?.id).reduce((acc, s) => acc + (s.total_volume || 0), 0) || 0
      const target = 1000000 // 1 Million KG goal
      const percentage = Math.min((totalValue / target) * 100, 100)

      return { totalValue, target, percentage, userContribution }
    },
    refetchInterval: 60000
  })

  if (isLoading) return <div className="h-40 bg-surface-200/50 rounded-[2.5rem] animate-pulse" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 to-surface-200 border border-primary/30 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="w-20 h-20 text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-black">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Desafio Global</h3>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Unidos pelo Ferro</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-primary font-black italic text-2xl">
               {challengeData?.percentage.toFixed(1)}%
             </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Volume Coletivo Semanal</p>
            <p className="text-3xl font-black text-white italic tracking-tighter">
              {Math.round((challengeData?.totalValue || 0) / 1000)}k <span className="text-sm text-gray-500">/ 1M kg</span>
            </p>
          </div>

          <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${challengeData?.percentage}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full shadow-[0_0_15px_rgba(190,242,100,0.5)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
             <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                   <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">O teu contributo</p>
                   <p className="text-sm font-black text-white italic">{Math.round(challengeData?.userContribution || 0)} kg</p>
                </div>
             </div>
             <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                <Zap className="w-5 h-5 text-primary animate-pulse" />
                <p className="text-[10px] text-gray-400 font-medium leading-tight">
                  Cada kg conta! Continua a treinar para batermos a meta.
                </p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
