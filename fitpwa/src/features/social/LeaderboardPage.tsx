import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { Trophy, Users, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderboardUser {
  id: string
  username: string
  avatar_url?: string
  level?: number
  xp_total?: number
}

export function LeaderboardPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { profile } = useAuthStore()

  const { data: globalLeaderboard, isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, xp_total')
        .order('xp_total', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data
    }
  })

  // Fetch friends and then their profile data
  const { data: friendsLeaderboard, isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard-friends', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      // Get accepted friend IDs
      const { data: friendships, error: fError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)

      if (fError) throw fError
      
      const friendIds = (friendships || []).map(f => f.requester_id === profile.id ? f.addressee_id : f.requester_id)
      friendIds.push(profile.id) // Include self

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, xp_total')
        .in('id', friendIds)
        .order('xp_total', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!profile?.id
  })

  const renderList = (users: LeaderboardUser[]) => {
    return (
      <div className="space-y-3 relative">
        <AnimatePresence mode="popLayout">
          {users.map((user, idx) => {
            const isMe = user.id === profile?.id
            const rank = idx + 1
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={user.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  isMe 
                    ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20' 
                    : 'bg-surface-200 border-surface-100 hover:bg-surface-300'
                }`}
              >
                {/* Rank Glow for Top 3 */}
                {rank <= 3 && (
                  <div className={`absolute -left-8 -top-8 w-24 h-24 blur-3xl opacity-20 rounded-full ${
                    rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-300' : 'bg-amber-600'
                  }`} />
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shadow-inner ${
                    rank === 1 ? 'bg-yellow-500 text-black' :
                    rank === 2 ? 'bg-slate-300 text-black' :
                    rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-surface-100 text-gray-500'
                  }`}>
                    {rank <= 3 ? <Trophy className="w-5 h-5" /> : rank}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-primary font-bold overflow-hidden border border-white/10">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          user.username?.[0]?.toUpperCase() || 'A'
                        )}
                      </div>
                      {isMe && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-[#0A0A0B]" />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm sm:text-base ${isMe ? 'text-primary' : 'text-white'}`}>
                        @{user.username} {isMe && <span className="text-[10px] ml-1 opacity-70 italic">(Tu)</span>}
                      </h4>
                      <div className="flex items-center gap-2">
                         <div className="h-1 w-12 bg-surface-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${((user.level || 1) % 10) * 10}%` }} />
                         </div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lvl {user.level || 1}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right relative z-10">
                  <motion.p 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-black text-white"
                  >
                    {user.xp_total?.toLocaleString() || 0}
                  </motion.p>
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">XP Total</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${hideHeader ? '!p-0' : 'p-4 md:p-8 pb-32'}`}>
      {!hideHeader && (
        <div className="text-center space-y-2">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Leaderboard</h1>
          <p className="text-gray-400">Vê quem são os atletas mais dedicados da comunidade.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Global Leaderboard */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Global</h2>
          </div>
          
          {globalLoading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface-200 rounded-2xl" />)}
            </div>
          ) : globalLeaderboard ? renderList(globalLeaderboard) : null}
        </div>

        {/* Friends Leaderboard */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Amigos</h2>
          </div>

          {friendsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-200 rounded-2xl" />)}
            </div>
          ) : friendsLeaderboard && friendsLeaderboard.length > 1 ? renderList(friendsLeaderboard) : (
            <div className="bg-surface-200 border border-dashed border-surface-100 p-12 rounded-2xl text-center">
              <p className="text-gray-500 text-sm">Adiciona amigos para veres como te comparas com eles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
