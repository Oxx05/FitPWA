import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, Save, Dumbbell, Loader2, Zap, Clock, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
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
  const [selectedSort, setSelectedSort] = useState<'trending' | 'recent' | 'saves'>('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewPlan, setPreviewPlan] = useState<any>(null)
  const [previewExercises, setPreviewExercises] = useState<any[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [cloningPlan, setCloningPlan] = useState(false)

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
          profiles:user_id (username),
          exercise_count:plan_exercises(count)
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
        author_name: (w.profiles as any)?.username || t('community.athlete'),
        author_id: w.user_id,
        difficulty: w.difficulty || 'intermediate',
        days_per_week: w.days_per_week || 0,
        likes: w.likes || 0,
        saves: w.saves || 0,
        exercise_count: (w.exercise_count as any)?.[0]?.count || 0,
        comments: 0,
        created_at: w.created_at
      })) as any[]
    }
  })

  const handleLike = async (workoutId: string) => {
    if (!profile?.id) return
    try {
      // Check if already liked
      const { data: existing } = await supabase
        .from('workout_likes')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        // Unlike
        await supabase
          .from('workout_likes')
          .delete()
          .eq('id', existing.id)
        
        await supabase.rpc('decrement_workout_likes', { workout_id: workoutId })
      } else {
        // Like
        await supabase
          .from('workout_likes')
          .insert({
            workout_id: workoutId,
            user_id: profile.id
          })
        
        await supabase.rpc('increment_workout_likes', { workout_id: workoutId })
        
        const auth = useAuthStore.getState()
        auth.incrementSocialLikes()
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSave = async (workoutId: string) => {
    if (!profile?.id) return
    try {
      const { data: existing } = await supabase
        .from('saved_workouts')
        .select('id')
        .eq('workout_id', workoutId)
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        await supabase
          .from('saved_workouts')
          .delete()
          .eq('id', existing.id)
        
        await supabase.rpc('decrement_workout_saves', { workout_id: workoutId })
      } else {
        await supabase
          .from('saved_workouts')
          .insert({
            workout_id: workoutId,
            user_id: profile.id
          })
        
        await supabase.rpc('increment_workout_saves', { workout_id: workoutId })
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24 ${hideHeader ? '!pt-0 !px-0' : ''}`}>
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-bold italic uppercase tracking-tighter">{t('community.title')}</h1>
          <p className="text-gray-400">{t('community.subtitle')}</p>
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
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{workout.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{workout.description}</p>
                </div>
                <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full whitespace-nowrap">
                  {workout.days_per_week}x/{t('common.week')}
                </span>
              </div>

              {/* Author Info */}
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

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-white">{workout.exercise_count || '-'}</p>
                  <p className="text-xs text-gray-400">{t('common.exercises')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-red-400">{workout.likes}</p>
                  <p className="text-xs text-gray-400">{t('common.likes')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-400">{workout.saves}</p>
                  <p className="text-xs text-gray-400">{t('community.saved')}</p>
                </div>
                <div className="bg-surface-100 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-green-400">{workout.comments}</p>
                  <p className="text-xs text-gray-400">{t('common.comments')}</p>
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
                  title={t('community.saved')}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">{workout.saves}</span>
                </button>

                <button
                  onClick={async () => {
                    // Preview the plan first
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
                  <span className="text-sm">{t('workouts.usePlan')}</span>
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
          <h3 className="text-xl font-bold text-white mb-2">{t('community.emptyTitle')}</h3>
          <p className="text-gray-400 max-w-md mb-6">
            {t('community.emptyDesc')}
          </p>
          <a href="/workouts/new" className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
            {t('community.createAndPublish')}
          </a>
        </motion.div>
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
          {previewPlan?.description && (
            <p className="text-sm text-gray-400">{previewPlan.description}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full capitalize font-bold">
              {previewPlan?.difficulty}
            </span>
            <span className="text-xs bg-surface-100 text-gray-300 px-2.5 py-1 rounded-full font-bold">
              {previewPlan?.days_per_week}x/{t('common.week')}
            </span>
            <span className="text-xs bg-surface-100 text-gray-300 px-2.5 py-1 rounded-full font-bold">
              {previewExercises.length} {t('common.exercises')}
            </span>
          </div>

          {loadingPreview ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {previewExercises.map((pe: any, idx: number) => {
                const ex = pe.exercises
                return (
                  <div key={pe.id || idx} className="flex items-center gap-3 bg-surface-100 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">
                        {ex?.name || t('common.exercise')}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {pe.sets} × {pe.reps_min === pe.reps_max ? pe.reps_min : `${pe.reps_min}-${pe.reps_max}`} reps
                        {pe.weight_kg ? ` · ${pe.weight_kg}kg` : ''}
                      </p>
                    </div>
                    {ex?.muscle_groups && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {(ex.muscle_groups as string[]).slice(0, 2).map((mg: string) => (
                          <span key={mg} className="text-[9px] bg-surface-200 text-gray-500 px-1.5 py-0.5 rounded capitalize">{mg}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {previewExercises.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center p-4">{t('community.noExercises')}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setPreviewPlan(null); setPreviewExercises([]) }}
            >
              {t('common.close')}
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={cloningPlan || previewExercises.length === 0}
              onClick={async () => {
                if (!previewPlan || !profile?.id) return
                setCloningPlan(true)
                try {
                  const { data: newPlan, error: planErr } = await supabase
                    .from('workout_plans')
                    .insert({
                      user_id: profile.id,
                      name: `${previewPlan.name} (Clone)`,
                      description: previewPlan.description,
                      difficulty: previewPlan.difficulty,
                      days_per_week: previewPlan.days_per_week,
                      type: 'custom',
                      is_public: false
                    })
                    .select()
                    .single()

                  if (planErr) throw planErr

                  if (previewExercises.length > 0) {
                    await supabase
                      .from('plan_exercises')
                      .insert(previewExercises.map((ex: any) => ({
                        plan_id: newPlan.id,
                        exercise_id: ex.exercise_id,
                        order_index: ex.order_index,
                        sets: ex.sets,
                        reps_min: ex.reps_min,
                        reps_max: ex.reps_max,
                        rest_seconds: ex.rest_seconds,
                        weight_kg: ex.weight_kg,
                        is_superset: ex.is_superset
                      })))
                  }

                  showToast(t('community.clonedSuccess'), 'success')
                  setPreviewPlan(null)
                  setPreviewExercises([])
                } catch (err) {
                  console.error('Error cloning plan:', err)
                  showToast(t('community.clonedError'), 'error')
                } finally {
                  setCloningPlan(false)
                }
              }}
            >
              {cloningPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
              {t('community.cloneAndUse')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
