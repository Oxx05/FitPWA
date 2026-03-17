import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, Share2, Save, MessageCircle, Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'

interface PublicWorkout {
  id: string
  name: string
  description: string
  author_name: string
  author_id: string
  difficulty: string
  days_per_week: number
  likes: number
  saves: number
  comments: number
  created_at: string
  is_liked?: boolean
  is_saved?: boolean
}

export function CommunityPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { profile } = useAuthStore()
  const [selectedSort, setSelectedSort] = useState<'trending' | 'recent' | 'saves'>('trending')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['public-workouts', selectedSort, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('workout_plans')
        .select(`
          id, 
          name, 
          description, 
          user_id, 
          difficulty, 
          days_per_week, 
          likes, 
          saves, 
          created_at,
          profiles:user_id (username)
        `)
        .eq('is_public', true)

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      if (selectedSort === 'trending') {
        query = query.order('likes', { ascending: false })
      } else if (selectedSort === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else if (selectedSort === 'saves') {
        query = query.order('saves', { ascending: false })
      }

      const { data, error } = await query.limit(20)
      if (error) throw error
      
      return (data || []).map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        author_name: (w.profiles as unknown as { username: string })?.username || 'Atleta',
        author_id: w.user_id,
        difficulty: w.difficulty || 'intermediate',
        days_per_week: w.days_per_week || 0,
        likes: w.likes || 0,
        saves: w.saves || 0,
        comments: 0,
        created_at: w.created_at
      })) as PublicWorkout[]
    }
  })

  const handleLike = async (workoutId: string) => {
    try {
      await supabase
        .from('workout_likes')
        .insert({
          workout_id: workoutId,
          user_id: profile?.id
        })
      
      // Increment like count
      await supabase
        .from('workout_plans')
        .update({ likes: (workouts?.find(w => w.id === workoutId)?.likes || 0) + 1 })
        .eq('id', workoutId)
    } catch (error) {
      console.error('Error liking workout:', error)
    }
  }

  const handleSave = async (workoutId: string) => {
    try {
      await supabase
        .from('saved_workouts')
        .insert({
          workout_id: workoutId,
          user_id: profile?.id
        })
      
      // Increment saves count
      await supabase
        .from('workout_plans')
        .update({ saves: (workouts?.find(w => w.id === workoutId)?.saves || 0) + 1 })
        .eq('id', workoutId)
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 ${hideHeader ? '!pt-0 !px-0' : ''}`}>
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-bold italic uppercase tracking-tighter">Comunidade</h1>
          <p className="text-gray-400">Descobre planos criados por outros utilizadores.</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Procurar treinos ou autores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface-200 border border-surface-100 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 flex-wrap">
        {(['trending', 'recent', 'saves'] as const).map(sort => (
          <button
            key={sort}
            onClick={() => setSelectedSort(sort)}
            className={`px-4 py-2 rounded-lg border transition-all capitalize ${
              selectedSort === sort
                ? 'bg-primary text-black border-primary'
                : 'bg-surface-200 border-surface-100 text-white hover:border-primary/50'
            }`}
          >
            {sort === 'trending' ? 'Trending' : sort === 'recent' ? 'Recente' : 'Guardados'}
          </button>
        ))}
      </div>

      {/* Workouts Feed */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workouts && workouts.length > 0 ? (
        <div className="space-y-4">
          {workouts.map((workout, idx) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-200 border border-surface-100 p-6 rounded-2xl hover:border-primary/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{workout.description}</p>
                </div>
                <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full whitespace-nowrap">
                  {workout.days_per_week}x/semana
                </span>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-100">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    por <span className="text-white font-bold">{workout.author_name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(workout.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-white">-</p>
                  <p className="text-xs text-gray-400">Exercícios</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-red-400">{workout.likes}</p>
                  <p className="text-xs text-gray-400">Likes</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-400">{workout.saves}</p>
                  <p className="text-xs text-gray-400">Guardados</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-400">{workout.comments}</p>
                  <p className="text-xs text-gray-400">Comentários</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-surface-100">
                <button
                  onClick={() => handleLike(workout.id)}
                  className="flex-1 flex items-center gap-2 justify-center py-2 rounded-lg bg-surface-100 hover:bg-primary/20 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{workout.likes}</span>
                </button>
                
                <button
                  onClick={() => handleSave(workout.id)}
                  className="flex-1 flex items-center gap-2 justify-center py-2 rounded-lg bg-surface-100 hover:bg-primary/20 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{workout.saves}</span>
                </button>

                <button className="flex-1 flex items-center gap-2 justify-center py-2 rounded-lg bg-surface-100 hover:bg-primary/20 text-gray-400 hover:text-green-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{workout.comments}</span>
                </button>

                <button className="flex-1 flex items-center gap-2 justify-center py-2 rounded-lg bg-surface-100 hover:bg-primary/20 text-gray-400 hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 bg-surface-200 border border-dashed border-surface-100 rounded-2xl text-center"
        >
          <Dumbbell className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Comunidade Vazia</h3>
          <p className="text-gray-400 max-w-md mb-6">
            Nenhum plano foi partilhado na comunidade ainda. Sê o primeiro a publicar o teu plano de treino!
          </p>
          <a href="/workouts/new" className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Criar e Publicar Plano
          </a>
        </motion.div>
      )}
    </div>
  )
}
