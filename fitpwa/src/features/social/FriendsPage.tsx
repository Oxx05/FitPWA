import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { UserPlus, UserCheck, UserX, Search, MessageSquare, Trophy, Globe, Users } from 'lucide-react'
import { LeaderboardPage } from './LeaderboardPage'
import { CommunityPage } from '../community/CommunityPage'

interface SocialUser {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  level?: number
}

interface FriendRequest {
  friendshipId: string
  user: SocialUser
}

export function FriendsPage() {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard' | 'community'>('friends')

  // Fetch friends and requests
  const { data: socialData, isLoading } = useQuery({
    queryKey: ['social-friends', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { friends: [], requests: [] }

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url, level),
          addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url, level)
        `)
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)

      if (error) throw error

      const friends = friendships
        .filter(f => f.status === 'accepted')
        .map(f => (f.requester_id === profile.id ? f.addressee : f.requester) as unknown as SocialUser)

      const requests = friendships
        .filter(f => f.status === 'pending' && f.addressee_id === profile.id)
        .map(f => ({ friendshipId: f.id, user: f.requester as unknown as SocialUser }))

      return { friends, requests }
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
      return data
    },
    enabled: searchQuery.length >= 3
  })

  const sendRequest = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: profile?.id, addressee_id: friendId, status: 'pending' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-friends'] })
      setSearchQuery('')
    }
  })

  const handleRequest = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'accepted' | 'rejected' }) => {
      if (action === 'accepted') {
        await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
      } else {
        await supabase.from('friendships').delete().eq('id', id)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-friends'] })
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400">A carregar amigos...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white italic uppercase tracking-tighter">Social</h1>
          <p className="text-gray-400">Treina, partilha e compete com a comunidade.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-surface-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'friends' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Amigos
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'leaderboard' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'community' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Comunidade
          </button>
        </div>
      </div>

      {activeTab === 'friends' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          {/* Search Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Procurar atletas por username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-200 border border-surface-100 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="bg-surface-200 border border-surface-100 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2">
                {searchResults.map((user: SocialUser) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border-b border-surface-100 last:border-0 hover:bg-surface-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.username?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-white">@{user.username}</p>
                        <p className="text-xs text-gray-400">Nível {user.level || 1}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendRequest.mutate(user.id)}
                      disabled={sendRequest.isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {socialData?.requests && socialData.requests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Pedidos de Amizade
                <span className="bg-primary text-black text-xs px-2 py-0.5 rounded-full">{socialData.requests.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {socialData.requests.map((req: FriendRequest) => (
                  <div key={req.friendshipId} className="bg-surface-200 border border-surface-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-gray-400">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">@{req.user.username}</p>
                        <p className="text-xs text-gray-400">Quer ser teu amigo</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRequest.mutate({ id: req.friendshipId, action: 'accepted' })}
                        className="p-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleRequest.mutate({ id: req.friendshipId, action: 'rejected' })}
                        className="p-2 bg-surface-100 text-gray-400 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Os teus Amigos</h2>
            {socialData?.friends && socialData.friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {socialData.friends.map((friend: SocialUser) => (
                  <div key={friend.id} className="bg-surface-200 border border-surface-100 p-4 rounded-2xl group hover:border-primary/30 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center text-primary border-2 border-surface-100 group-hover:border-primary transition-colors">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          Lvl {friend.level || 1}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">@{friend.username}</h4>
                        <p className="text-xs text-gray-400">{friend.full_name || 'Atleta'}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="p-1.5 bg-surface-100 rounded-lg hover:text-primary transition-colors">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-200 border border-dashed border-surface-100 p-12 rounded-2xl text-center">
                <p className="text-gray-500">Ainda não tens amigos no FitPWA.</p>
                <p className="text-sm text-gray-600 mt-2">Usa a barra de pesquisa acima para encontrar atletas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <LeaderboardPage hideHeader />
        </div>
      )}

      {activeTab === 'community' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <CommunityPage hideHeader />
        </div>
      )}
    </div>
  )
}

