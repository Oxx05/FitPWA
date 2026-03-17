import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Calendar, Heart } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { ConquestCard } from '@/shared/components/ConquestCard'

export function SocialFeed() {
  const { profile } = useAuthStore()

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ['social-feed', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', profile.id)

      const followingIds = [profile.id, ...(following?.map(f => f.following_id) || [])]

      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          finished_at,
          total_volume,
          profiles:user_id (username, avatar_url),
          session_sets (
            exercise_id,
            exercise_name,
            weight_kg,
            reps
          )
        `)
        .in('user_id', followingIds)
        .order('finished_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return sessions || []
    },
    enabled: !!profile?.id
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="h-80 bg-surface-200/50 rounded-[2.5rem] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="text-center py-20 bg-surface-200/20 rounded-[2.5rem] border-2 border-dashed border-white/5">
        <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500 font-bold italic uppercase tracking-widest text-sm">O muro está vazio...</p>
        <p className="text-xs text-gray-600 mt-2">Segue mais atletas para veres as suas conquistas!</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {feedItems.map((session: any) => {
        const sets = session.session_sets || []
        const bestSet = [...sets].sort((a: any, b: any) => {
          const ormA = (a.weight_kg || 0) * (1 + (a.reps || 0) / 30)
          const ormB = (b.weight_kg || 0) * (1 + (b.reps || 0) / 30)
          return ormB - ormA
        })[0]

        const hasBest = !!bestSet
        const title = hasBest ? "Destaque do Treino" : "Treino Concluído"
        const subtitle = bestSet?.exercise_name || "Sessão Concluída"
        const value = bestSet?.weight_kg ? `${bestSet.weight_kg}` : `${Math.round(session.total_volume)}`
        const label = bestSet?.weight_kg ? "PESO (KG)" : "VOLUME TOTAL (KG)"

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center font-black text-primary border border-white/5 uppercase italic">
                {session.profiles?.username?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-black text-white italic uppercase tracking-tighter">
                  @{session.profiles?.username}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.finished_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ConquestCard
                title={title}
                subtitle={subtitle}
                value={value}
                label={label}
                achievementIcon={hasBest ? <Trophy className="w-10 h-10" /> : <TrendingUp className="w-10 h-10" />}
              />
              
              <div className="flex gap-4 mt-6">
                 <button className="flex items-center gap-2 px-6 py-2 bg-surface-200 hover:bg-surface-100 rounded-full border border-white/5 transition-all text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary active:scale-95 group">
                    <Heart className="w-4 h-4 group-hover:fill-primary group-hover:stroke-primary" />
                    <span>Inspirador</span>
                 </button>
                 <button className="flex items-center gap-2 px-6 py-2 bg-surface-200 hover:bg-surface-100 rounded-full border border-white/5 transition-all text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary active:scale-95">
                    <TrendingUp className="w-4 h-4" />
                    <span>Parabéns</span>
                 </button>
              </div>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-primary/20 to-transparent" />
          </motion.div>
        )
      })}
    </div>
  )
}
