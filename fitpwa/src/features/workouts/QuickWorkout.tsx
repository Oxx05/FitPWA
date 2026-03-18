import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, Plus, Sparkles, Dumbbell } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { useAuthStore } from '@/features/auth/authStore'
import { useNavigate } from 'react-router-dom'
import { useOfflineExercises } from '@/shared/hooks/useOfflineData'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/lib/supabase'
import Fuse from 'fuse.js'

const TRANSLATION_MAP: Record<string, string> = {
  'supino': 'bench press',
  'agachamento': 'squat',
  'levantamento terra': 'deadlift',
  'rosca direta': 'bicep curl',
  'flexao': 'push up',
  'abdominal': 'crunch',
  'remada': 'row',
  'puxada': 'lat pulldown',
  'extensao': 'extension',
  'flexao de pernas': 'leg curl',
  'press militar': 'military press',
  'elevaçao lateral': 'lateral raise'
}

interface QuickExercise {
  exerciseId: string
  sets: number
  reps: number
  weight?: number
}

interface Exercise {
  id: string
  name: string
  name_pt?: string
  muscle_groups?: string[]
  equipment?: string[]
  difficulty?: number
}

export function QuickWorkout() {
  const { profile, user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<QuickExercise[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [creatingCustom, setCreatingCustom] = useState(false)

  const { data: availableExercises = [] } = useOfflineExercises()

  const muscleGroups = useMemo(() => [
    { id: 'chest', label: t('common.muscles.chest') },
    { id: 'back', label: t('common.muscles.back') },
    { id: 'shoulders', label: t('common.muscles.shoulders') },
    { id: 'biceps', label: t('common.muscles.biceps') },
    { id: 'triceps', label: t('common.muscles.triceps') },
    { id: 'forearms', label: t('common.muscles.forearms') },
    { id: 'legs', label: t('common.muscles.legs') },
    { id: 'hamstrings', label: t('common.muscles.hamstrings') },
    { id: 'glutes', label: t('common.muscles.glutes') },
    { id: 'abs', label: t('common.muscles.abs') },
    { id: 'core', label: t('common.muscles.core') }
  ], [t])

  const [showActiveSessionModal, setShowActiveSessionModal] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)

  const fuse = useMemo(() => new Fuse(availableExercises as Exercise[], {
    keys: ['name', 'name_pt'],
    threshold: 0.4,
    ignoreLocation: true,
  }), [availableExercises])

  const filteredExercises = useMemo(() => {
    let results = (availableExercises as Exercise[])
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      const searchTerms = [term]
      
      // Add translated term to search if found in map
      for (const [pt, en] of Object.entries(TRANSLATION_MAP)) {
        if (term.includes(pt) || pt.includes(term)) {
          searchTerms.push(en)
        }
      }
      
      // Perform multi-term search
      const fuseResults = new Set<string>()
      let searchResults: Exercise[] = []
      
      searchTerms.forEach(t => {
        fuse.search(t).forEach(r => {
          if (!fuseResults.has(r.item.id)) {
            fuseResults.add(r.item.id)
            searchResults.push(r.item)
          }
        })
      })
      results = searchResults
    }

    if (selectedMuscle) {
      results = results.filter(ex => ex.muscle_groups?.some(mg => mg.toLowerCase().includes(selectedMuscle.toLowerCase())))
    }

    return results
  }, [searchTerm, selectedMuscle, availableExercises, fuse])

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: exercise.id, sets: 3, reps: 10, weight: 0 }
    ])
    setShowExerciseModal(false)
    setSearchTerm('')
  }

  const handleCreateCustomExercise = async () => {
    if (!searchTerm.trim() || !user) return

    try {
      setCreatingCustom(true)
      const { data, error: insertErr } = await supabase
        .from('exercises')
        .insert({
          name: searchTerm.trim(),
          name_pt: searchTerm.trim(),
          muscle_groups: selectedMuscle ? [selectedMuscle] : [],
          equipment: [],
          difficulty: 3,
          is_custom: true,
          created_by: user.id,
        })
        .select()
        .single()

      if (insertErr) throw insertErr
      if (data) {
        addExercise(data)
      }
    } catch (err) {
      console.error('Erro ao criar exercício:', err)
    } finally {
      setCreatingCustom(false)
    }
  }

  const updateExercise = (index: number, updates: Partial<QuickExercise>) => {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], ...updates }
    setSelectedExercises(updated)
  }

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  const startWorkoutMutation = useMutation({
    mutationFn: async () => {
      const raw = localStorage.getItem('fitpwa_active_session')
      if (raw) {
        const session = JSON.parse(raw)
        setActiveSession(session)
        setShowActiveSessionModal(true)
        throw new Error('Active session exists')
      }

      const workoutData = {
        user_id: profile?.id,
        exercises: selectedExercises,
        started_at: new Date().toISOString(),
        duration_minutes: 0,
        title: t('workouts.quickWorkout')
      }
      
      localStorage.setItem('quickWorkout', JSON.stringify(workoutData))
      return workoutData
    },
    onSuccess: () => {
      navigate('/session/quick')
    }
  })

  const confirmDiscardAndStart = () => {
    localStorage.removeItem('fitpwa_active_session')
    setShowActiveSessionModal(false)
    startWorkoutMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold italic uppercase tracking-tighter">{t('workouts.quickWorkout')}</h1>
        <p className="text-gray-400">{t('workouts.quickWorkoutDesc')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('workouts.exercisesSelected')}</h2>
          <span className="text-sm text-gray-400">{selectedExercises.length} {t('workouts.exercises')}</span>
        </div>

        {selectedExercises.length > 0 ? (
          <div className="space-y-3">
            {selectedExercises.map((ex, idx) => {
              const exercise = (availableExercises as Exercise[]).find(e => e.id === ex.exerciseId)
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface-200 border border-surface-100 p-4 rounded-xl flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-white">
                      {i18n.language.startsWith('pt') && exercise?.name_pt ? exercise.name_pt : exercise?.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{exercise?.muscle_groups?.join(', ')}</p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">{t('editor.sets')}</span>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, { sets: parseInt(e.target.value) || 1 })}
                        className="w-14 bg-surface-100 border border-surface-200 rounded-lg px-2 py-1.5 text-white text-center text-sm focus:border-primary focus:outline-none"
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reps</span>
                      <input
                        type="number"
                        value={ex.reps}
                        onChange={(e) => updateExercise(idx, { reps: parseInt(e.target.value) || 1 })}
                        className="w-14 bg-surface-100 border border-surface-200 rounded-lg px-2 py-1.5 text-white text-center text-sm focus:border-primary focus:outline-none"
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Kg</span>
                      <input
                        type="number"
                        value={ex.weight || ''}
                        onChange={(e) => updateExercise(idx, { weight: e.target.value ? parseFloat(e.target.value) : 0 })}
                        placeholder="kg"
                        className="w-14 bg-surface-100 border border-surface-200 rounded-lg px-2 py-1.5 text-white text-center text-sm focus:border-primary focus:outline-none"
                        step="0.5"
                      />
                    </div>
                    <button
                      onClick={() => removeExercise(idx)}
                      className="self-end p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-surface-100 rounded-2xl border border-surface-200">
            <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>{t('workouts.noExercisesSelected')}</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => setShowExerciseModal(true)}
        className="w-full h-14 bg-surface-200 border border-dashed border-surface-100 hover:border-primary/50 text-white rounded-xl"
      >
        <Plus className="w-5 h-5 mr-2 text-primary" />
        {t('workouts.addExercise')}
      </Button>

      {selectedExercises.length > 0 && (
        <Button
          onClick={() => startWorkoutMutation.mutate()}
          disabled={startWorkoutMutation.isPending}
          className="w-full h-14 bg-primary text-black font-black uppercase tracking-tighter italic rounded-xl shadow-lg shadow-primary/20"
        >
          {startWorkoutMutation.isPending ? t('workouts.starting') : t('workouts.startWorkout')}
        </Button>
      )}

      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title={t('workouts.selectExercise')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder={t('workouts.searchOrCreate')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm.trim().length > 1 && (
            <button
              onClick={handleCreateCustomExercise}
              disabled={creatingCustom}
              className="w-full text-left p-3 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors border border-primary/30 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-primary">
                  {creatingCustom ? t('workouts.creating') : t('common.create') + ` "${searchTerm.trim()}"`}
                </h4>
                <p className="text-[10px] text-primary/60 uppercase font-black">{t('workouts.addCustomExercise')}</p>
              </div>
            </button>
          )}

          <div className="flex gap-2 flex-wrap mb-2">
            <button
              onClick={() => setSelectedMuscle(null)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedMuscle === null ? 'bg-primary text-black' : 'bg-surface-100 text-gray-500 hover:text-white'
              }`}
            >
              {t('workouts.all')}
            </button>
            {muscleGroups.map(muscle => (
              <button
                key={muscle.id}
                onClick={() => setSelectedMuscle(muscle.label)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedMuscle === muscle.label ? 'bg-primary text-black' : 'bg-surface-100 text-gray-500 hover:text-white'
                }`}
              >
                {muscle.label}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise)}
                  className="w-full text-left p-4 bg-surface-100 hover:bg-surface-200 rounded-xl transition-all border border-transparent hover:border-primary/30 group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white group-hover:text-primary transition-colors">
                        {i18n.language.startsWith('pt') && exercise.name_pt ? exercise.name_pt : exercise.name}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">
                        {exercise.muscle_groups?.join(' • ')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? t('workouts.noExercisesFound') : t('workouts.startTyping')}
              </div>
            )}
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showActiveSessionModal}
        onClose={() => setShowActiveSessionModal(false)}
        title={t('session.newSessionConfirmTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            {t('session.newSessionConfirmDesc', { planName: activeSession?.planName || t('workouts.quickWorkout') })}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(activeSession?.planId === 'quick' ? '/session/quick' : `/workouts/${activeSession?.planId}/start`)}
              className="w-full"
            >
              {t('session.keepTraining')}
            </Button>
            <Button
              variant="secondary"
              onClick={confirmDiscardAndStart}
              className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              {t('session.discardAndStart')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
