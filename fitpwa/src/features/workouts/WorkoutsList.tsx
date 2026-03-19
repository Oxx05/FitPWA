import { Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Plus, ChevronRight, Zap, Dumbbell, Layers, Loader2, Heart, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'

import { useOfflinePlans } from '@/shared/hooks/useOfflineData'
import { supabase } from '@/shared/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/contexts/ToastContext'

export function WorkoutsList() {
  const { profile } = useAuthStore()
  const { t } = useTranslation()
  
  const { data: plans, isLoading } = useOfflinePlans(profile?.id)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const displayPlans = useMemo(() => {
    if (!plans) return []
    if (!showFavoritesOnly) return plans
    return plans.filter((p: any) => p.is_favorite)
  }, [plans, showFavoritesOnly])

  const toggleFavorite = async (planId: string, currentValue: boolean) => {
    const newValue = !currentValue
    // Optimistic update
    queryClient.setQueryData(['plans', profile?.id], (old: any[]) =>
      old?.map((p: any) => p.id === planId ? { ...p, is_favorite: newValue } : p)
    )
    const { error } = await supabase
      .from('workout_plans')
      .update({ is_favorite: newValue })
      .eq('id', planId)
    if (error) {
      // Rollback
      queryClient.setQueryData(['plans', profile?.id], (old: any[]) =>
        old?.map((p: any) => p.id === planId ? { ...p, is_favorite: currentValue } : p)
      )
    } else {
      showToast(newValue ? t('workouts.addedToFavorites') : t('workouts.removedFromFavorites'), 'success')
    }
  }

  const confirmDelete = (plan: any) => {
    setPlanToDelete(plan)
  }

  const handleDeletePlan = async () => {
    if (!planToDelete || !profile?.id) return
    
    try {
      setIsDeleting(true)
      // Check if it's a "saved" workout (different table) or owned
      // In this app, WorkoutsList currently only shows owned 'workout_plans'
      // but we add a check just in case.
      
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planToDelete.id)
        .eq('user_id', profile.id)

      if (error) throw error

      queryClient.setQueryData(['plans', profile.id], (old: any[]) =>
        old?.filter((p: any) => p.id !== planToDelete.id)
      )
      
      showToast(t('workouts.planDeletedSuccess'), 'success')
      setPlanToDelete(null)
    } catch (err) {
      console.error('Error deleting plan:', err)
      showToast(t('workouts.planDeletedError'), 'error')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const activeSession = useMemo(() => {
    const raw = localStorage.getItem('titanpulse_active_session')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  }, [])

  const workoutOptions = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: t('workouts.basePlan'),
      description: t('workouts.basePlanDesc'),
      path: '/workouts/base',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('workouts.quickWorkout'),
      description: t('workouts.quickWorkoutDesc'),
      path: '/workouts/quick',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: t('workouts.newPlan'),
      description: t('workouts.newPlanDesc'),
      path: '/workouts/new',
      color: 'from-green-500 to-green-600'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold">{t('workouts.title')}</h1>
        <p className="text-gray-400">{t('workouts.chooseHowToTrain')}</p>
      </div>
      
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/10 border-2 border-primary/30 p-6 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-all shadow-xl shadow-primary/5"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
            <Zap className="w-24 h-24 text-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h3 className="text-primary font-black uppercase italic tracking-widest text-sm">
                {t('session.resumeActiveSession')}
              </h3>
            </div>
            
            <p className="text-white text-lg font-bold mb-4">
              {t('session.activeWorkoutDescription', { planName: activeSession.planName || t('workouts.quickWorkout') })}
            </p>
            
            <Link to={activeSession.planId === 'quick' ? '/session/quick' : `/workouts/${activeSession.planId}/start`}>
              <Button className="bg-primary text-black font-black uppercase italic px-8 h-12 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                {t('common.next')}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quick Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workoutOptions.map((option, idx) => (
          <Link key={option.path} to={option.path} className="flex w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex-1 bg-gradient-to-br ${option.color} p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-white/10 cursor-pointer group`}
            >
              <div className="mb-4 text-white group-hover:scale-110 transition-transform">
                {option.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{option.title}</h3>
              <p className="text-white/80 text-sm">{option.description}</p>
              <ChevronRight className="w-5 h-5 text-white/60 mt-4 group-hover:translate-x-2 transition-transform" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-100"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-gray-500">{t('workouts.myPlans')}</span>
        </div>
      </div>

      {/* Favorites Filter */}
      {plans && plans.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
              showFavoritesOnly
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-surface-200 border-surface-100 text-gray-400 hover:border-primary/50'
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-red-400' : ''}`} />
            {t('workouts.favorites')}
          </button>
        </div>
      )}

      {/* My Workouts */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (displayPlans && displayPlans.length > 0) ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayPlans.map((plan: any, idx: number) => (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-surface-200/40 border border-white/5 p-6 rounded-3xl hover:border-primary/50 hover:bg-surface-200 transition-all hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden"
            >
               {/* Background Glow */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-surface-100 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(plan.id, !!plan.is_favorite) }}
                    className="p-2 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${plan.is_favorite ? 'fill-red-400 text-red-400' : 'text-gray-600 hover:text-red-400'}`} />
                  </button>
                  {idx === 0 && (
                    <span className="bg-primary text-black text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                      {t('workouts.recent')}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-white capitalize italic tracking-tighter mb-2 group-hover:text-primary transition-colors">
                {plan.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] leading-relaxed">
                {plan.description || t('common.noDescription')}
              </p>
              
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('workouts.frequency')}</span>
                  <span className="text-sm text-white font-bold">
                    {plan.days_per_week ? t('workouts.perWeek', { count: plan.days_per_week }) : t('common.free')}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/workouts/${plan.id}/edit`}>
                    <Button size="sm" variant="secondary" className="rounded-xl px-3 h-10 bg-surface-100 hover:bg-surface-200 border border-white/5" title={t('common.edit')}>
                      <Pencil className="w-4 h-4 text-primary" />
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="rounded-xl px-3 h-10 bg-surface-100 hover:text-red-400 border border-white/5" 
                    title={t('common.delete')}
                    onClick={(e) => { e.stopPropagation(); confirmDelete(plan) }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Link to={`/workouts/${plan.id}/start`}>
                    <Button size="sm" variant="primary" className="rounded-xl font-black uppercase tracking-tighter text-xs h-10 px-6 shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all">
                      {t('workouts.start')}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState 
          icon={<Dumbbell className="w-16 h-16" />}
          title={t('workouts.noPlanYet')}
          description={t('workouts.noPlanDescription')}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        title={t('workouts.deletePlanTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {t('workouts.deleteConfirmText', { name: planToDelete?.name })}
            </p>
          </div>
          
          <p className="text-xs text-gray-500 italic">
            {t('workouts.deleteWarningText')}
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setPlanToDelete(null)}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeletePlan}
              isLoading={isDeleting}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
