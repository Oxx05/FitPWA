import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/authStore'

interface PlanExercise {
  id: string
  exercise_id: string
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rest_seconds: number
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

function formatRestTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  return `${seconds}s`
}

interface SortableExerciseItemProps {
  ex: PlanExercise
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof PlanExercise, value: number | null) => void
}

function SortableExerciseItem({ ex, onRemove, onUpdate }: SortableExerciseItemProps) {
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Séries</label>
          <input
            type="number"
            min={1}
            max={20}
            value={ex.sets}
            onChange={e => onUpdate(ex.id, 'sets', parseInt(e.target.value) || 1)}
            className="w-full h-10 bg-background border border-surface-200 rounded-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Reps (min-max)</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={100}
              value={ex.reps_min}
              onChange={e => onUpdate(ex.id, 'reps_min', parseInt(e.target.value) || 1)}
              className="w-full h-10 bg-background border border-surface-200 rounded-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <span className="text-gray-500 text-xs">-</span>
            <input
              type="number"
              min={1}
              max={100}
              value={ex.reps_max}
              onChange={e => onUpdate(ex.id, 'reps_max', parseInt(e.target.value) || 1)}
              className="w-full h-10 bg-background border border-surface-200 rounded-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
          <input
            type="number"
            min={0}
            step={0.5}
            placeholder="—"
            value={ex.weight_kg ?? ''}
            onChange={e => onUpdate(ex.id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full h-10 bg-background border border-surface-200 rounded-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descanso</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={15}
              value={ex.rest_seconds}
              onChange={e => onUpdate(ex.id, 'rest_seconds', parseInt(e.target.value) || 0)}
              className="w-full h-10 bg-background border border-surface-200 rounded-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
              {formatRestTime(ex.rest_seconds)}
            </span>
          </div>
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
  const templateId = searchParams.get('templateId')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [creatingCustom, setCreatingCustom] = useState(false)

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
      const { data: plan, error: planErr } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id)
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
              reps_min: (pe.reps_min as number) || 8,
              reps_max: (pe.reps_max as number) || 12,
              rest_seconds: (pe.rest_seconds as number) || 90,
              weight_kg: (pe.weight_kg as number) || null,
              is_superset: (pe.is_superset as boolean) || false,
            }
          })
          setExercises(exerciseList)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plano')
    } finally {
      setLoading(false)
    }
  }, [id])

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
              reps_min: (pe.reps_min as number) || 8,
              reps_max: (pe.reps_max as number) || 12,
              rest_seconds: (pe.rest_seconds as number) || 90,
              weight_kg: (pe.weight_kg as number) || null,
              is_superset: (pe.is_superset as boolean) || false,
            }
          })
          setExercises(exerciseList)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plano base')
    } finally {
      setLoading(false)
    }
  }, [templateId, id])

  useEffect(() => {
    if (id) loadPlan()
    if (!id) loadTemplate()
    loadExercises()
  }, [id, loadPlan, loadTemplate, loadExercises])

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: PlanExercise = {
      id: `${Date.now()}-${Math.random()}`,
      exercise_id: exercise.id,
      name: exercise.name_pt || exercise.name,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      rest_seconds: 60,
      weight_kg: null,
      is_superset: false
    }
    setExercises([...exercises, newExercise])
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
      setError('Nome do plano é obrigatório')
      return
    }
    if (exercises.length === 0) {
      setError('Adiciona pelo menos um exercício')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let planId = id
      const planData = {
        user_id: user?.id,
        name: title,
        description: description || null,
        type: 'custom' as const,
        days_per_week: 3,
      }

      if (id) {
        const { error: err } = await supabase
          .from('workout_plans')
          .update(planData)
          .eq('id', id)
        if (err) throw err
        
        await supabase.from('plan_exercises').delete().eq('plan_id', id)
      } else {
        const { data: newPlan, error: err } = await supabase
          .from('workout_plans')
          .insert([planData])
          .select()
        if (err) throw err
        if (!newPlan?.[0]) throw new Error('Falha ao criar plano')
        
        planId = newPlan[0].id
      }

      // Save exercises with user-configured values
      if (exercises.length > 0 && planId) {
        const planExercises = exercises.map((ex, idx) => ({
          plan_id: planId,
          exercise_id: ex.exercise_id,
          order_index: idx,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rest_seconds: ex.rest_seconds,
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
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally {
      setLoading(false)
    }
  }

  const filteredExercises = availableExercises.filter(ex =>
    (ex.name_pt || ex.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Plano</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Perna 5x/semana"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreve o objetivo deste plano..."
            className="w-full bg-surface-200 border border-surface-100 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-surface-200 border border-surface-100 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermédio</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Exercícios</h2>
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
            <p>Nenhum exercício adicionado ainda</p>
            <p className="text-sm text-gray-500 mt-1">Clica no botão abaixo para adicionar o primeiro exercício</p>
          </div>
        )}
      </div>

      <Button 
        variant="secondary" 
        className="w-full h-14 border border-dashed border-gray-600 hover:border-primary/50 text-gray-400 hover:bg-primary/5"
        onClick={() => setShowExerciseModal(true)}
      >
        <Plus className="w-5 h-5 mr-2 text-primary" />
        Adicionar Exercício
      </Button>

      <div className="flex gap-4">
        <Button 
          variant="secondary" 
          className="flex-1"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          className="flex-1"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Plano'}
        </Button>
      </div>

      {/* Exercise Selection Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => { setShowExerciseModal(false); setSearchTerm('') }}
        title="Seleciona Exercício"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Procura ou cria exercício..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

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
                  {creatingCustom ? 'Criando...' : `Criar "${searchTerm.trim()}"`}
                </h4>
                <p className="text-xs text-gray-400">Adicionar como exercício customizado</p>
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
                  <h4 className="font-semibold text-white">{ex.name_pt || ex.name}</h4>
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    {ex.muscle_groups && ex.muscle_groups.length > 0 && (
                      <span>{ex.muscle_groups.join(', ')}</span>
                    )}
                    {ex.difficulty && (
                      <>
                        <span>•</span>
                        <span>Nível {ex.difficulty}</span>
                      </>
                    )}
                  </div>
                </button>
              ))
            ) : searchTerm.trim().length === 0 ? (
              <p className="text-center text-gray-500 py-8">Escreve para procurar exercícios</p>
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum exercício encontrado. Usa o botão acima para criar.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
