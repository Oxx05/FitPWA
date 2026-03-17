import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { UserPlus, UserMinus, Star, Search, Trophy, Globe, Users, User, Share2 } from 'lucide-react'
import { LeaderboardPage } from './LeaderboardPage'
import { CommunityPage } from '../community/CommunityPage'
import { motion, AnimatePresence } from 'framer-motion'

import { SocialFeed } from './components/SocialFeed'

interface SocialProfile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  level?: number
  is_following?: boolean
  is_favorite?: boolean
}

export function FriendsPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'mural' | 'social' | 'leaderboard' | 'community'>('mural')

  // Fetch following, followers, and favorites
  const { data: socialData, isLoading } = useQuery({
    queryKey: ['social-data', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { following: [], followers: [], favorites: [] }

      const [followingRes, followersRes, favoritesRes] = await Promise.all([
        supabase.from('followers').select('following_id, profiles:following_id(*)').eq('follower_id', profile.id),
        supabase.from('followers').select('follower_id, profiles:follower_id(*)').eq('following_id', profile.id),
        supabase.from('user_favorites').select('favorite_profile_id').eq('user_id', profile.id)
      ])

      const favoritesSet = new Set((favoritesRes.data || []).map(f => f.favorite_profile_id))

      const following: SocialProfile[] = (followingRes.data || []).map(f => ({
        ...(f.profiles as unknown as SocialProfile),
        is_following: true,
        is_favorite: favoritesSet.has((f.profiles as unknown as { id: string }).id)
      }))

      const followers: SocialProfile[] = (followersRes.data || []).map(f => ({
        ...(f.profiles as unknown as SocialProfile),
        is_following: following.some(fol => fol.id === (f.profiles as unknown as { id: string }).id)
      }))

      return { following, followers, favorites: following.filter(f => f.is_favorite) }
    }
  })

  // Search for new people
  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, level')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', profile?.id)
        .limit(5)
      
      if (error) throw error
      
      // Check if already following
      const followingIds = socialData?.following?.map(f => f.id) || []
      return data.map(u => ({
        ...u,
        is_following: followingIds.includes(u.id)
      }))
    },
    enabled: searchQuery.length >= 3
  })

  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string, action: 'follow' | 'unfollow' }) => {
      if (action === 'follow') {
        const { error } = await supabase.from('followers').insert({ follower_id: profile?.id, following_id: userId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('followers').delete().eq('follower_id', profile?.id).eq('following_id', userId)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-data'] })
  })

  const favoriteMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string, action: 'favorite' | 'unfavorite' }) => {
      if (action === 'favorite') {
        const { error } = await supabase.from('user_favorites').insert({ user_id: profile?.id, favorite_profile_id: userId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('user_favorites').delete().eq('user_id', profile?.id).eq('favorite_profile_id', userId)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-data'] })
  })

  if (isLoading) return (
    <div className="flex justify-center p-24">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                Social Hub
              </h1>
              <p className="text-gray-400 mt-2">Segue outros atletas e celebra as suas conquistas.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const text = t('social.inviteText', { username: profile?.username })
                const url = window.location.origin
                if (navigator.share) {
                  navigator.share({ title: 'FitPWA', text, url })
                } else {
                  navigator.clipboard.writeText(`${text} ${url}`)
                  alert(t('social.inviteCopied'))
                }
              }}
              className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black rounded-2xl px-6"
            >
              <Share2 className="w-4 h-4 mr-2" />
              <span className="uppercase text-[10px] font-black">{t('social.invite')}</span>
            </Button>
          </div>
        </motion.div>
        
        {/* Modern Tabs */}
        <div className="flex flex-wrap gap-2 bg-surface-200/50 backdrop-blur-md p-1.5 rounded-2xl w-full sm:w-fit border border-white/5">
          {[
            { id: 'mural', label: 'Feed Mural', icon: Globe },
            { id: 'social', label: 'Amigos', icon: Users },
            { id: 'leaderboard', label: 'Ranking', icon: Trophy },
            { id: 'community', label: 'Comunidade', icon: Globe }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all uppercase tracking-tighter whitespace-nowrap ${
                activeTab === tab.id ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'mural' && (
          <motion.div
            key="mural"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
          >
            <SocialFeed />
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div 
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Procurar atletas por username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-200/50 border border-white/5 rounded-[1.5rem] pl-14 pr-6 py-5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
              
              <AnimatePresence>
                {searchResults && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-surface-300 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl"
                  >
                    {searchResults.map((user: SocialProfile) => (
                      <div key={user.id} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center font-black text-black">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-white italic tracking-tighter">@{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">Nível {user.level || 1}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={user.is_following ? 'secondary' : 'primary'}
                          onClick={() => followMutation.mutate({ userId: user.id, action: user.is_following ? 'unfollow' : 'follow' })}
                          isLoading={followMutation.isPending}
                        >
                          {user.is_following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                          <span className="ml-2 uppercase text-[10px] font-black">{user.is_following ? 'Deixar de seguir' : 'Seguir'}</span>
                        </Button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Favorites Section */}
            {socialData?.favorites && socialData.favorites.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Favoritos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {socialData.favorites.map((user: SocialProfile) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={user.id} 
                      className="bg-surface-200/30 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-yellow-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-primary font-black border border-white/10">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-white italic tracking-tighter">@{user.username}</p>
                          <p className="text-[10px] text-gray-500 font-black">NÍVEL {user.level || 1}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => favoriteMutation.mutate({ userId: user.id, action: 'unfavorite' })}
                        className="p-2 text-yellow-500 hover:scale-110 transition-transform"
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Lists Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Following List */}
              <div className="space-y-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">A seguir ({socialData?.following?.length || 0})</h2>
                <div className="space-y-3">
                  {socialData?.following && socialData.following.length > 0 ? (
                    socialData.following.map((user: SocialProfile) => (
                      <div key={user.id} className="bg-surface-200/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-surface-200/40 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-white/50 group-hover:text-primary transition-colors">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-white tracking-tight">@{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">Lvl {user.level || 1}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => favoriteMutation.mutate({ userId: user.id, action: user.is_favorite ? 'unfavorite' : 'favorite' })}
                             className={`p-2 rounded-xl transition-all ${user.is_favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`}
                           >
                            <Star size={16} className={user.is_favorite ? 'fill-current' : ''} />
                          </button>
                          <button 
                            onClick={() => followMutation.mutate({ userId: user.id, action: 'unfollow' })}
                            className="p-2 text-gray-500 hover:text-red-400 bg-white/5 rounded-xl transition-all"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-surface-200/10 rounded-3xl border border-dashed border-white/5">
                      <p className="text-sm text-gray-600">Ainda não segues ninguém.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Followers List */}
              <div className="space-y-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Seguidores ({socialData?.followers?.length || 0})</h2>
                <div className="space-y-3">
                  {socialData?.followers && socialData.followers.length > 0 ? (
                    socialData.followers.map((user: SocialProfile) => (
                      <div key={user.id} className="bg-surface-200/20 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-surface-200/40 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-white/50 shadow-inner">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-white tracking-tight">@{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">Lvl {user.level || 1}</p>
                          </div>
                        </div>
                        {!user.is_following && (
                          <button 
                             onClick={() => followMutation.mutate({ userId: user.id, action: 'follow' })}
                             className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-black transition-all"
                          >
                            Seguir de volta
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-surface-200/10 rounded-3xl border border-dashed border-white/5">
                      <p className="text-sm text-gray-600">Ainda não tens seguidores.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LeaderboardPage hideHeader />
          </motion.div>
        )}

        {activeTab === 'community' && (
          <motion.div 
            key="community"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CommunityPage hideHeader />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
