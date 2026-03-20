import { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Heart, Save, Dumbbell, Loader2, Zap, Clock, Eye, MessageSquare, Send, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '@/features/auth/authStore'
import { useToast } from '@/shared/contexts/ToastContext'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'

export function CommunityPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const { profile } = useAuthStore()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  
  const [selectedSort, setSelectedSort] = useState<'trending' | 'recent' | 'saves'>('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPlan, setPreviewPlan] = useState<any>(null)
  const [previewExercises, setPreviewExercises] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [cloningPlan, setCloningPlan] = useState(false)
  
  // New state for comments
  const [viewingCommentsId, setViewingCommentsId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  // Local state for optimistic updates
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { count: number, active: boolean }>>({})

  // Main workouts query
  const { data: serverWorkouts, isLoading } = useQuery({
    queryKey: ['public-workouts', selectedSort, searchQuery],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let query = supabase
        .from('workout_plans')
        .select(`
          id, name, description, user_id, difficulty, days_per_week, likes, saves, comments, created_at,
          profiles:user_id (username),
          exercise_count:plan_exercises(count)
        `)
        .eq('is_public', true)

      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`)

      if (selectedSort === 'trending') query = query.order('likes', { ascending: false })
      else if (selectedSort === 'recent') query = query.order('created_at', { ascending: false })
      else if (selectedSort === 'saves') query = query.order('saves', { ascending: false })

      const { data, error } = await query.limit(20)
      if (error) throw error
      
      return (data || []).map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        author_name: (w.profiles as any)?.username || t('community.athlete'),
        author_id: w.user_id,
        difficulty: w.difficulty || 'intermediate',
        days_per_week: w.days_per_week || 0,
        likesCount: w.likes || 0,
        savesCount: w.saves || 0,
        commentsCount: w.comments || 0,
        exercise_count: (w.exercise_count as any)?.[0]?.count || 0,
        created_at: w.created_at
      }))
    }
  })

  // Fetch current user's interactions
  const { data: userInteractions } = useQuery({
    queryKey: ['user-community-interactions', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const [likes, clones] = await Promise.all([
        supabase.from('workout_likes').select('workout_id').eq('user_id', profile!.id),
        supabase.from('workout_plans').select('parent_plan_id').eq('user_id', profile!.id).not('parent_plan_id', 'is', null)
      ])
      return {
        likedIds: new Set((likes.data || []).map(l => l.workout_id)),
        clonedIds: new Set((clones.data || []).map(c => c.parent_plan_id))
      }
    }
  })

  // Merge server data with optimistic state
  const workouts = useMemo(() => {
    if (!serverWorkouts) return []
    return serverWorkouts.map(w => ({
      ...w,
      likes: optimisticLikes[w.id]?.count ?? w.likesCount,
      isLiked: optimisticLikes[w.id]?.active ?? userInteractions?.likedIds.has(w.id) ?? false,
      saves: w.savesCount,
      isSaved: userInteractions?.clonedIds.has(w.id) ?? false
    }))
  }, [serverWorkouts, optimisticLikes, userInteractions])

  const likeMutation = useMutation({
    mutationFn: async ({ workoutId, active }: { workoutId: string, active: boolean }) => {
      if (active) {
        const { data: existing } = await supabase.from('workout_likes').select('id').eq('workout_id', workoutId).eq('user_id', profile!.id).maybeSingle()
        if (existing) {
          await supabase.from('workout_likes').delete().eq('id', existing.id)
          await supabase.rpc('decrement_workout_likes', { workout_id: workoutId })
        }
      } else {
        await supabase.from('workout_likes').insert({ workout_id: workoutId, user_id: profile!.id })
        await supabase.rpc('increment_workout_likes', { workout_id: workoutId })
        useAuthStore.getState().incrementSocialLikes()
      }
    },
    onMutate: async ({ workoutId, active }) => {
      const current = workouts.find(w => w.id === workoutId)
      setOptimisticLikes(prev => ({
        ...prev,
        [workoutId]: {
          count: (current?.likes ?? 0) + (active ? -1 : 1),
          active: !active
        }
      }))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-community-interactions'] })
    }
  })

  // Combined Save/Clone logic
  const handleClone = async (workoutId: string) => {
    if (cloningPlan || !profile?.id) return
    const workout = workouts.find(w => w.id === workoutId)
    if (!workout || workout.isSaved) return

    setCloningPlan(true)
    try {
      // Fetch source exercises
      const { data: exercises } = await supabase.from('plan_exercises').select('*').eq('plan_id', workoutId)
      
      // Create clone
      const { data: newPlan, error: planError } = await supabase.from('workout_plans').insert({
        user_id: profile.id,
        name: `${workout.name} (Saved)`,
        description: workout.description,
        difficulty: workout.difficulty,
        days_per_week: workout.days_per_week,
        type: 'custom',
        is_public: false,
        parent_plan_id: workoutId
      }).select().single()
      
      if (planError) throw planError

      if (newPlan && exercises && exercises.length > 0) {
        const cleanExercises = exercises.map(({ id, created_at, updated_at, ...rest }: any) => ({
          ...rest,
          plan_id: newPlan.id
        }))
        await supabase.from('plan_exercises').insert(cleanExercises)
      }

      // Update global saves count
      await supabase.rpc('increment_workout_saves', { workout_id: workoutId })
      
      showToast(t('community.clonedSuccess'), 'success')
      queryClient.invalidateQueries({ queryKey: ['user-community-interactions'] })
    } catch (err) {
      console.error('Cloning error:', err)
      showToast(t('community.clonedError'), 'error')
    } finally {
      setCloningPlan(false)
    }
  }

  // Comments Query & Mutation
  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['workout-comments', viewingCommentsId],
    enabled: !!viewingCommentsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_comments')
        .select(`
          id, content, created_at, user_id,
          profiles:user_id (username)
        `)
        .eq('workout_id', viewingCommentsId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        username: (c.profiles as any)?.username || t('community.athlete')
      }))
    }
  })

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!viewingCommentsId || !profile?.id) return
      await supabase.from('workout_comments').insert({
        workout_id: viewingCommentsId,
        user_id: profile.id,
        content
      })
      await supabase.rpc('increment_workout_comments', { workout_id: viewingCommentsId })
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['workout-comments', viewingCommentsId] })
      queryClient.invalidateQueries({ queryKey: ['public-workouts'] }) // Update comment count
    }
  })

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 ${hideHeader ? '!pt-0 !px-0' : ''}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold italic uppercase tracking-tighter">{t('community.title')}</h1>
            <p className="text-gray-400">{t('community.subtitle')}</p>
          </div>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['public-workouts'] })}
            className="p-2 bg-surface-200 border border-surface-100 rounded-lg hover:border-primary/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('community.searchPlaceholder')}
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
            className={`px-4 py-2 rounded-xl border transition-all capitalize flex items-center gap-2 font-bold ${
              selectedSort === sort
                ? 'bg-primary text-black border-primary'
                : 'bg-surface-200 border-surface-100 text-white hover:border-primary/50'
            }`}
          >
            {sort === 'trending' ? <Zap className="w-4 h-4" /> : sort === 'recent' ? <Clock className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {sort === 'trending' ? t('community.trending') : sort === 'recent' ? t('community.recent') : t('community.saved')}
          </button>
        ))}
      </div>

      {/* Workouts Feed */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2 md:line-clamp-none whitespace-pre-wrap">{workout.description}</p>
                </div>
                <span className="text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full whitespace-nowrap font-bold">
                  {workout.days_per_week}x/{t('common.week')}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-100">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    {t('common.by')} <span className="text-white font-bold">{workout.author_name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(workout.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-white">{workout.exercise_count || '-'}</p>
                  <p className="text-xs text-gray-400 tracking-tighter uppercase font-bold">{t('common.exercises')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-red-400">{workout.likes}</p>
                  <p className="text-xs text-gray-400 tracking-tighter uppercase font-bold">{t('common.likes')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-400">{workout.commentsCount}</p>
                  <p className="text-xs text-gray-400 tracking-tighter uppercase font-bold">{t('common.comments')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-primary">{workout.saves}</p>
                  <p className="text-xs text-gray-400 tracking-tighter uppercase font-bold">{t('community.saved')}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-surface-100">
                <button
                  onClick={() => likeMutation.mutate({ workoutId: workout.id, active: workout.isLiked })}
                  disabled={likeMutation.isPending}
                  className={`flex-1 flex items-center gap-2 justify-center py-2 rounded-lg transition-all duration-200 ${
                    workout.isLiked 
                      ? 'bg-red-400/10 text-red-400 border border-red-400/20' 
                      : 'bg-surface-100 text-gray-400 hover:text-red-400 hover:bg-red-400/5'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${workout.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-bold">{workout.likes}</span>
                </button>
                
                <button
                  onClick={() => setViewingCommentsId(workout.id)}
                  className="flex-1 flex items-center gap-2 justify-center py-2 rounded-lg bg-surface-100 text-gray-400 hover:text-green-400 hover:bg-green-400/5 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-bold">{workout.commentsCount}</span>
                </button>

                <button
                  onClick={async () => {
                    setPreviewPlan(workout)
                    setLoadingPreview(true)
                    try {
                      const { data: exercises } = await supabase
                        .from('plan_exercises')
                        .select(`
                          id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg, is_superset,
                          exercises ( id, name, name_pt, muscle_groups )
                        `)
                        .eq('plan_id', workout.id)
                        .order('order_index', { ascending: true })
                      setPreviewExercises(exercises || [])
                    } catch {
                      setPreviewExercises([])
                    } finally {
                      setLoadingPreview(false)
                    }
                  }}
                  className="flex-[2] flex items-center gap-2 justify-center py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm uppercase tracking-tighter font-black">{t('workouts.usePlan')}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-surface-200 border border-dashed border-surface-100 rounded-2xl text-center">
          <Dumbbell className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{t('community.emptyTitle')}</h3>
          <p className="text-gray-400 max-w-md mb-6">{t('community.emptyDesc')}</p>
        </div>
      )}

      {/* Plan Preview Modal */}
      <Modal
        isOpen={!!previewPlan}
        onClose={() => { setPreviewPlan(null); setPreviewExercises([]) }}
        title={previewPlan?.name || ''}
        size="lg"
        closeButton
      >
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold capitalize">
              {previewPlan?.difficulty}
            </span>
            <span className="px-3 py-1 bg-surface-100 text-gray-300 rounded-full text-xs font-bold">
              {previewPlan?.days_per_week}x/{t('common.week')}
            </span>
          </div>

          {loadingPreview ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {previewExercises.map((pe: any, idx: number) => (
                <div key={pe.id || idx} className="flex items-center gap-3 bg-surface-100 p-3 rounded-lg">
                  <div className="w-6 h-6 flex items-center justify-center bg-primary text-black rounded text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{pe.exercises?.name}</h4>
                    <p className="text-xs text-gray-400">
                      {pe.sets} × {pe.reps_min}-{pe.reps_max} reps
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" className="flex-1" onClick={() => setPreviewPlan(null)}>
              {t('common.close')}
            </Button>
            <Button
              className="flex-1 gap-2 font-black uppercase tracking-tighter"
              disabled={cloningPlan || previewExercises.length === 0 || workouts.find(w => w.id === previewPlan?.id)?.isSaved}
              onClick={() => previewPlan && handleClone(previewPlan.id)}
            >
              {cloningPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {workouts.find(w => w.id === previewPlan?.id)?.isSaved ? t('community.saved') : t('community.cloneAndUse')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={!!viewingCommentsId}
        onClose={() => setViewingCommentsId(null)}
        title={t('common.comments')}
        size="md"
        closeButton
      >
        <div className="flex flex-col h-[60vh]">
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-4">
            {loadingComments ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : (
              <AnimatePresence mode="popLayout">
                {comments && comments.length > 0 ? (
                  comments.map((c) => (
                    <motion.div 
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-surface-100 p-3 rounded-xl border border-surface-50"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-primary uppercase tracking-tighter">{c.username}</span>
                        <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-200">{c.content}</p>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center text-gray-500"
                  >
                    <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                    <p>{t('community.noCommentsYet')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
          
          <div className="flex gap-2 p-2 bg-surface-200 rounded-xl border border-surface-100">
            <input
              type="text"
              placeholder={t('community.addComment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && commentMutation.mutate(newComment)}
              className="flex-grow bg-transparent border-none text-sm text-white focus:ring-0 px-2"
            />
            <button
              onClick={() => newComment.trim() && commentMutation.mutate(newComment)}
              disabled={commentMutation.isPending || !newComment.trim()}
              className="p-2 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
