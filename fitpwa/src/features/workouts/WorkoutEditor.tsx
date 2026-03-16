import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { Plus, GripVertical, Trash2, AlertCircle, Dumbbell } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Modal } from '@/shared/components/Modal'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/AuthProvider'

interface PlanExercise {
  id: string
  exercise_id: string
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rest_seconds: number
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

function SortableExerciseItem({ ex, onRemove }: { ex: PlanExercise, onRemove: (id: string) => void }) {
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
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 bg-surface-200 p-4 rounded-xl border border-surface-100 shadow-sm ${ex.is_superset ? 'ml-8 border-l-4 border-l-primary' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-white">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-grow flex flex-col gap-1">
        <h4 className="font-bold text-white">{ex.name}</h4>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>{ex.sets} sets</span>
          <span>{ex.reps_min}-{ex.reps_max} reps</span>
          <span>{ex.rest_seconds}s rest</span>
        </div>
      </div>

      <button onClick={() => onRemove(ex.id)} className="p-2 text-gray-500 hover:text-error transition-colors">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

export function WorkoutEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (id) {
      loadPlan()
    }
    loadExercises()
  }, [id])

  const loadPlan = async () => {
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
        
        // Load exercises for this plan from plan_exercises junction table
        const { data: planExercises, error: exErr } = await supabase
          .from('plan_exercises')
          .select(`
            exercise_id,
            exercises (id, name, name_pt, muscle_groups, equipment, difficulty)
          `)
          .eq('plan_id', id)
          .order('order_index', { ascending: true })
        
        if (exErr) throw exErr
        
        if (planExercises && planExercises.length > 0) {
          const exerciseList = planExercises
            .map((pe: any) => pe.exercises)
            .filter(Boolean)
          setExercises(exerciseList)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar plano')
    } finally {
      setLoading(false)
    }
  }

  const loadExercises = async () => {
    try {
      // Load exercises from database
      const { data, error: err } = await supabase
        .from('exercises')
        .select('id, name, name_pt, muscle_groups, equipment, difficulty, instructions')
        .eq('is_custom', false)
        .order('name')
        .limit(200)

      if (err) console.error('Erro a carregar exercícios:', err)
      if (data && data.length > 0) {
        setAvailableExercises(data.map((e: any) => ({
          id: e.id,
          name: e.name,
          name_pt: e.name_pt,
          muscle_groups: e.muscle_groups || [],
          equipment: e.equipment || [],
          difficulty: e.difficulty || 3,
          instructions: e.instructions
        })))
      } else {
        // Fallback com exercícios básicos se BD estiver vazia
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
  }

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: PlanExercise = {
      id: `${Date.now()}-${Math.random()}`,
      exercise_id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      rest_seconds: 60,
      is_superset: false
    }
    setExercises([...exercises, newExercise])
    setShowExerciseModal(false)
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
      const planData: Record<string, any> = {
        user_id: user?.id,
        name: title,
        description: description || null,
        type: 'custom',
        days_per_week: 3,
      }

      if (id) {
        const { error: err } = await supabase
          .from('workout_plans')
          .update(planData)
          .eq('id', id)
        if (err) throw err
        
        // Delete existing exercises for this plan
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

      // Save exercises to plan_exercises table
      if (exercises.length > 0 && planId) {
        const planExercises = exercises.map((ex, idx) => ({
          plan_id: planId,
          exercise_id: ex.id,
          order_index: idx,
          sets: 3,
          reps_min: 8,
          reps_max: 12,
          rest_seconds: 90,
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
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && id) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
          <AlertCircle className="w-5 h-5" />
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
                  <SortableExerciseItem key={ex.id} ex={ex} onRemove={handleRemove} />
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
        onClose={() => setShowExerciseModal(false)}
        title="Seleciona Exercício"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Procura exercício..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {filteredExercises.length > 0 ? (
              filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="w-full text-left p-3 bg-surface-100 hover:bg-surface-100/80 rounded-lg transition-colors border border-surface-100 hover:border-primary"
                >
                  <h4 className="font-semibold text-white">{ex.name}</h4>
                  <div className="flex gap-2 text-xs text-gray-400 mt-1">
                    {ex.muscle_groups && ex.muscle_groups.length > 0 && (
                      <span>{ex.muscle_groups.join(', ')}</span>
                    )}
                    {ex.difficulty && (
                      <span>•</span>
                    )}
                    {ex.difficulty && (
                      <span>Nível {ex.difficulty}</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Nenhum exercício encontrado</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
