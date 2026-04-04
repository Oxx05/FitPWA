import { useState, useMemo } from 'react'
import { Search, Filter, SearchIcon, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExerciseCard } from './ExerciseCard'
import { Input } from '@/shared/components/Input'
import { EmptyState } from '@/shared/components/EmptyState'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'

import { useOfflineExercises } from '@/shared/hooks/useOfflineData'
import { Modal } from '@/shared/components/Modal'
import { ExerciseEvolution } from './components/ExerciseEvolution'
import { supabase } from '@/shared/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/contexts/ToastContext'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'
import { humanizeMuscle } from '@/shared/utils/muscleUtils'

interface Exercise {
  id: string
  name: string
  muscle_groups: string[]
  is_custom?: boolean
  created_by?: string
}

export function ExerciseLibrary() {
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>('all')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: exercises, isLoading } = useOfflineExercises()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const handleDeleteCustomExercise = async () => {
    if (!exerciseToDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseToDelete.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      showToast(t('workouts.customExerciseDeleted'), 'success')
      setExerciseToDelete(null)
    } catch (err) {
      console.error('Error deleting exercise:', err)
      showToast(t('common.error'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredExercises = useMemo(() => exercises?.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = muscleFilter === 'all' ||
      ex.muscle_groups.some((g: string) => g.toLowerCase() === muscleFilter.toLowerCase())
    return matchesSearch && matchesMuscle
  }), [exercises, search, muscleFilter])

  // Deduplicate case-insensitively — keep first occurrence (lowercase) as canonical value
  const muscleOptions = useMemo(() => {
    const seen = new Map<string, string>() // lowercase key → first raw value
    for (const ex of exercises ?? []) {
      for (const g of ex.muscle_groups as string[]) {
        const key = g.toLowerCase()
        if (!seen.has(key)) seen.set(key, g)
      }
    }
    const unique = Array.from(seen.values()).sort()
    return [
      { value: 'all', label: t('common.all') },
      ...unique.map(m => ({ value: m, label: humanizeMuscle(m, t) }))
    ]
  }, [exercises, t])

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">{t('exercisesExtra.libraryTitle')}</h1>
        <p className="text-gray-400">{t('exercisesExtra.librarySubtitle')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            placeholder={t('session.searchExercisePlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>

        <div className="shrink-0 w-full md:w-64">
          <CustomSelect
            value={muscleFilter}
            onChange={setMuscleFilter}
            options={muscleOptions}
            icon={<Filter className="w-5 h-5" />}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredExercises?.map((exercise, idx) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group/card"
              >
                <ExerciseCard
                  exercise={exercise}
                  onClick={() => setSelectedExercise(exercise)}
                />
                {exercise.is_custom && exercise.created_by === user?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setExerciseToDelete(exercise) }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface-200/90 border border-surface-100 text-gray-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all opacity-0 group-hover/card:opacity-100"
                    title={t('workouts.deleteCustomExercise')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredExercises?.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<SearchIcon className="w-8 h-8" />}
                title={t('exercisesExtra.noResultsTitle')}
                description={t('exercisesExtra.noResultsDesc', { search })}
              />
            </div>
          )}
        </div>
      )}
      <Modal
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title={t('exercisesExtra.evolutionTitle')}
        size="md"
        closeButton
      >
        {selectedExercise && (
          <ExerciseEvolution
            exerciseId={selectedExercise.id}
            exerciseName={selectedExercise.name}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleDeleteCustomExercise}
        title={t('workouts.deleteCustomExercise')}
        message={t('workouts.deleteCustomConfirm')}
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={deleting}
      />
    </div>
  )
}
