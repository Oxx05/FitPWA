import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, AlertCircle, Dumbbell, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { DebouncedNumericInput } from '@/shared/components/DebouncedNumericInput'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/authStore'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'

interface PlanExercise {
  id: string
  exercise_id: string
  name: string
  sets: number
  weight_kg: number | null
  is_superset: boolean
}

interface Exercise {
  id: string
  name: string
  name_pt?: string
  muscle_groups?: string[]
  equipment?: string[]
  difficulty?: number
  instructions?: string
}


interface SortableExerciseItemProps {
  ex: PlanExercise
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof PlanExercise, value: number | null) => void
}

function SortableExerciseItem({ ex, onRemove, onUpdate }: SortableExerciseItemProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ex.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={`bg-surface-200 p-4 rounded-xl border border-surface-100 shadow-sm ${ex.is_superset ? 'ml-8 border-l-4 border-l-primary' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-white">
          <GripVertical className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-white flex-grow">{ex.name}</h4>
        <button onClick={() => onRemove(ex.id)} className="p-2 text-gray-500 hover:text-error transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">{t('editor.sets')}</label>
          <DebouncedNumericInput
            min={1}
            max={20}
            value={ex.sets}
            onChange={val => onUpdate(ex.id, 'sets', val || 1)}
            className="w-full h-12 bg-background border border-surface-100 rounded-xl text-center text-white focus:ring-2 focus:ring-primary/50 text-lg font-bold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">{t('editor.weight')}</label>
          <DebouncedNumericInput
            min={0}
            step={0.5}
            placeholder="—"
            value={ex.weight_kg}
            onChange={val => onUpdate(ex.id, 'weight_kg', val)}
            className="w-full h-12 bg-background border border-surface-100 rounded-xl text-center text-white focus:ring-2 focus:ring-primary/50 text-lg font-bold"
          />
        </div>
      </div>
    </div>
  )
}

export function WorkoutEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const templateId = searchParams.get('templateId')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [creatingCustom, setCreatingCustom] = useState(false)
  const [isActivePlan, setIsActivePlan] = useState(false)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')
  const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1)
  const location = useLocation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadExercises = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('exercises')
        .select('id, name, name_pt, muscle_groups, equipment, difficulty, instructions')
        .order('name')
        .limit(300)

      if (err) console.error('Erro a carregar exercícios:', err)
      if (data && data.length > 0) {
        setAvailableExercises(data.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          name: e.name as string,
          name_pt: e.name_pt as string | undefined,
          muscle_groups: (e.muscle_groups as string[]) || [],
          equipment: (e.equipment as string[]) || [],
          difficulty: (e.difficulty as number) || 3,
          instructions: e.instructions as string | undefined
        })))
      } else {
        console.warn('Nenhum exercício encontrado. Use o SQL seed para popular.')
        setAvailableExercises([
          { id: 'squat', name: 'Agachamento', muscle_groups: ['legs'], difficulty: 3 },
          { id: 'bench-press', name: 'Supino', muscle_groups: ['chest'], difficulty: 3 },
          { id: 'deadlift', name: 'Levantamento Terra', muscle_groups: ['back', 'legs'], difficulty: 5 }
        ])
      }
    } catch (err) {
      console.error('Erro:', err)
    }
  }, [])

  const loadPlan = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)

      const rawSession = localStorage.getItem('titanpulse_active_session')
      if (rawSession) {
        try {
          const sessionData = JSON.parse(rawSession)
          if (sessionData.planId === id) {
            setIsActivePlan(true)
            setError(t('editor.cannotEditActivePlan'))
          }
        } catch(e) {}
      }

      const { data: plan, error: planErr } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id)
        .single()

      if (planErr) throw planErr
      if (plan) {
        setTitle(plan.name)
        setDescription(plan.description || '')
        setIsPublic(plan.is_public ?? false)
        
        const { data: planExercises, error: exErr } = await supabase
          .from('plan_exercises')
          .select(`
            id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg, is_superset,
            exercises (id, name, name_pt, muscle_groups, equipment, difficulty)
          `)
          .eq('plan_id', id)
          .order('order_index', { ascending: true })
        
        if (exErr) throw exErr
        
        if (planExercises && planExercises.length > 0) {
          const exerciseList: PlanExercise[] = planExercises.map((pe: Record<string, unknown>) => {
            const ex = pe.exercises as Record<string, unknown> | null
            return {
              id: pe.id as string,
              exercise_id: (ex?.id as string) || (pe.exercise_id as string),
              name: (ex?.name_pt as string) || (ex?.name as string) || 'Exercício',
              sets: (pe.sets as number) || 3,
              weight_kg: (pe.weight_kg as number) || null,
              is_superset: (pe.is_superset as boolean) || false,
            }
          })
          setExercises(exerciseList)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.errorLoadingPlan'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  const loadTemplate = useCallback(async () => {
    if (!templateId || id) return
    try {
      setLoading(true)
      const { data: plan, error: planErr } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', templateId)
        .single()

      if (planErr) throw planErr
      if (plan) {
        setTitle(plan.name)
        setDescription(plan.description || '')

        const { data: planExercises, error: exErr } = await supabase
          .from('plan_exercises')
          .select(`
            id, exercise_id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg, is_superset,
            exercises (id, name, name_pt, muscle_groups, equipment, difficulty)
          `)
          .eq('plan_id', templateId)
          .order('order_index', { ascending: true })
        
        if (exErr) throw exErr
        
        if (planExercises && planExercises.length > 0) {
          const exerciseList: PlanExercise[] = planExercises.map((pe: Record<string, unknown>, idx: number) => {
            const ex = pe.exercises as Record<string, unknown> | null
            return {
              id: `${pe.id}-${idx}`,
              exercise_id: (ex?.id as string) || (pe.exercise_id as string),
              name: (ex?.name_pt as string) || (ex?.name as string) || 'Exercício',
              sets: (pe.sets as number) || 3,
              weight_kg: (pe.weight_kg as number) || null,
              is_superset: (pe.is_superset as boolean) || false,
            }
          })
          setExercises(exerciseList)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.errorLoadingBase'))
    } finally {
      setLoading(false)
    }
  }, [templateId, id, t])

  useEffect(() => {
    if (id) {
      loadPlan()
    } else if (templateId) {
      loadTemplate()
    } else {
      const state = location.state as any
      if (state?.initialData) {
        setTitle(state.initialData.name || '')
        setDescription(state.initialData.description || '')
        if (state.initialData.exercises) {
          const mapped: PlanExercise[] = state.initialData.exercises.map((ex: any, idx: number) => ({
            id: `new-${idx}-${Date.now()}`,
            exercise_id: ex.exerciseId || ex.exercise_id,
            name: ex.name,
            sets: ex.sets?.length || ex.sets || 3,
            weight_kg: ex.weight || ex.weight_kg || null,
            is_superset: false
          }))
          setExercises(mapped)
        }
      }
    }
    loadExercises()
  }, [id, templateId, loadPlan, loadTemplate, loadExercises, location.state])

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: PlanExercise = {
      id: `${Date.now()}-${Math.random()}`,
      exercise_id: exercise.id,
      name: i18n.language.startsWith('pt') ? (exercise.name_pt || exercise.name) : exercise.name,
      sets: 3,
      weight_kg: null,
      is_superset: false
    }
    // Insert after the current edit index (or at the end if -1)
    if (currentEditIndex >= 0 && currentEditIndex < exercises.length) {
      const newList = [...exercises]
      newList.splice(currentEditIndex + 1, 0, newExercise)
      setExercises(newList)
    } else {
      setExercises([...exercises, newExercise])
    }
    setShowExerciseModal(false)
    setSearchTerm('')
    setSelectedMuscleGroup('')
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
          muscle_groups: [],
          equipment: [],
          difficulty: 3,
          is_custom: true,
          created_by: user.id,
        })
        .select('id, name, name_pt, muscle_groups, equipment, difficulty')
        .single()

      if (insertErr) throw insertErr
      if (data) {
        const newEx: Exercise = {
          id: data.id,
          name: data.name,
          name_pt: data.name_pt,
          muscle_groups: data.muscle_groups || [],
          equipment: data.equipment || [],
          difficulty: data.difficulty || 3,
        }
        // Add to available exercises so it shows up next time
        setAvailableExercises(prev => [newEx, ...prev])
        // Add directly to plan
        handleAddExercise(newEx)
      }
    } catch (err) {
      console.error('Erro ao criar exercício:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar exercício customizado')
    } finally {
      setCreatingCustom(false)
    }
  }

  const handleUpdateExercise = (exerciseId: string, field: keyof PlanExercise, value: number | null) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleRemove = (id: string) => {
    setExercises(items => items.filter(i => i.id !== id))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t('editor.planNameRequired'))
      return
    }
    if (exercises.length === 0) {
      setError(t('editor.addAtLeastOne'))
      return
    }

    try {
      setLoading(true)
      setError(null)

      let planId = id

      if (id) {
        const { error: err } = await supabase
          .from('workout_plans')
          .update({
            name: title,
            description: description || null,
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user?.id)
        if (err) throw err
        
        await supabase.from('plan_exercises').delete().eq('plan_id', id)
      } else {
        const { data: newPlan, error: err } = await supabase
          .from('workout_plans')
          .insert([{
            user_id: user?.id,
            name: title,
            description: description || null,
            type: 'custom',
            days_per_week: 3,
            is_public: isPublic,
          }])
          .select()
        if (err) throw err
        if (!newPlan?.[0]) throw new Error(t('editor.failedToCreatePlan'))
        
        planId = newPlan[0].id
      }

      // Save exercises with user-configured values
      if (exercises.length > 0 && planId) {
        const planExercises = exercises.map((ex, idx) => ({
          plan_id: planId,
          exercise_id: ex.exercise_id,
          order_index: idx,
          sets: ex.sets,
          weight_kg: ex.weight_kg,
          is_superset: ex.is_superset,
        }))
        
        const { error: exErr } = await supabase
          .from('plan_exercises')
          .insert(planExercises)
        if (exErr) throw exErr
      }

      navigate('/workouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.errorSaving'))
    } finally {
      setLoading(false)
    }
  }

  const fuse = useMemo(() => new Fuse<Exercise>(availableExercises, {
    keys: ['name', 'name_pt'],
    threshold: 0.3, // Fuzzy matching
    ignoreLocation: true,
  }), [availableExercises])

  const allMuscleGroups = useMemo(() => {
    const groups = new Set<string>()
    availableExercises.forEach(ex => {
      (ex.muscle_groups || []).forEach((g: string) => groups.add(g))
    })
    return Array.from(groups).sort()
  }, [availableExercises])

  const filteredExercises = useMemo(() => {
    let list = availableExercises
    if (selectedMuscleGroup) {
      list = list.filter(ex => (ex.muscle_groups || []).includes(selectedMuscleGroup))
    }
    if (!searchTerm.trim()) return list
    return fuse.search(searchTerm).map(result => result.item).filter(ex => {
      if (!selectedMuscleGroup) return true
      return (ex.muscle_groups || []).includes(selectedMuscleGroup)
    })
  }, [searchTerm, availableExercises, fuse, selectedMuscleGroup])

  if (loading && (id || templateId)) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4 pb-24 animate-pulse">
        <div className="h-10 bg-surface-200 rounded-lg w-2/3" />
        <div className="h-24 bg-surface-200 rounded-lg" />
        <div className="h-10 bg-surface-200 rounded-lg w-1/3" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-surface-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('editor.planName')}</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('editor.planNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('editor.description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('editor.descriptionPlaceholder')}
            className="w-full bg-surface-200 border border-surface-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            rows={3}
          />
        </div>



        <div className="flex items-center justify-between p-4 bg-surface-200 border border-surface-100 rounded-lg">
          <div>
            <h4 className="font-bold text-white">{t('editor.publicWorkout')}</h4>
            <p className="text-sm text-gray-500">{t('editor.publicWorkoutDesc')}</p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-primary' : 'bg-surface-100'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">{t('editor.exercisesTitle')}</h2>
        {exercises.length > 0 ? (
          <div className="space-y-4">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={exercises.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {exercises.map((ex) => (
                  <SortableExerciseItem
                    key={ex.id}
                    ex={ex}
                    onRemove={handleRemove}
                    onUpdate={handleUpdateExercise}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-surface-100 rounded-xl border border-surface-200">
            <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>{t('editor.noExercisesYet')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('editor.clickToAddFirst')}</p>
          </div>
        )}
      </div>

      <Button 
        variant="secondary" 
        className="w-full h-14 border border-dashed border-gray-600 hover:border-primary/50 text-gray-400 hover:bg-primary/5"
        onClick={() => { setCurrentEditIndex(exercises.length - 1); setShowExerciseModal(true) }}
      >
        <Plus className="w-5 h-5 mr-2 text-primary" />
        {t('editor.addExercise')}
      </Button>

      <div className="flex gap-4">
        <Button 
          variant="secondary" 
          className="flex-1"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          className="flex-1"
          onClick={handleSave}
          disabled={loading || isActivePlan}
        >
          {loading ? t('editor.saving') : t('editor.savePlan')}
        </Button>
      </div>

      {/* Exercise Selection Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => { setShowExerciseModal(false); setSearchTerm(''); setSelectedMuscleGroup('') }}
        title={t('editor.selectExercise')}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder={t('editor.searchOrCreate')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Muscle group filter chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMuscleGroup('')}
              className={`text-xs px-2.5 py-1 rounded-full border font-bold transition-all ${!selectedMuscleGroup ? 'bg-primary text-black border-primary' : 'bg-surface-100 border-surface-200 text-gray-400 hover:border-primary/50'}`}
            >
              {t('common.all')}
            </button>
            {allMuscleGroups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === group ? '' : group)}
                className={`text-xs px-2.5 py-1 rounded-full border font-bold capitalize transition-all ${selectedMuscleGroup === group ? 'bg-primary text-black border-primary' : 'bg-surface-100 border-surface-200 text-gray-400 hover:border-primary/50'}`}
              >
                {group}
              </button>
            ))}
          </div>

          {/* Custom exercise creation */}
          {searchTerm.trim().length > 1 && (
            <button
              onClick={handleCreateCustomExercise}
              disabled={creatingCustom}
              className="w-full text-left p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors border border-primary/30 hover:border-primary/50 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-primary">
                  {creatingCustom ? t('editor.creating') : t('editor.createCustom', { name: searchTerm.trim() })}
                </h4>
                <p className="text-xs text-gray-400">{t('editor.addAsCustom')}</p>
              </div>
            </button>
          )}

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="w-full text-left p-3 bg-surface-100 hover:bg-surface-100/80 rounded-lg transition-colors border border-surface-100 hover:border-primary"
                >
                  <h4 className="font-semibold text-white">
                    {i18n.language.startsWith('pt') && ex.name_pt ? ex.name_pt : ex.name}
                  </h4>
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    {ex.muscle_groups && ex.muscle_groups.length > 0 && (
                      <span>{ex.muscle_groups.join(', ')}</span>
                    )}

                  </div>
                </button>
              ))
            ) : searchTerm.trim().length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('editor.typeToSearch')}</p>
            ) : (
              <p className="text-center text-gray-500 py-4">{t('editor.noExerciseFound')}</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
