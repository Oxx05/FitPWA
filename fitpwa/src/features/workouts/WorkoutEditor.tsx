import { useState } from 'react'
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
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'

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
  const [exercises, setExercises] = useState<PlanExercise[]>([
    { id: '1', exercise_id: 'ex1', name: 'Agachamento com Barra', sets: 4, reps_min: 6, reps_max: 10, rest_seconds: 90, is_superset: false },
    { id: '2', exercise_id: 'ex2', name: 'Leg Press 45°', sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 90, is_superset: true },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Criar Plano</h1>
          <p className="text-gray-400">Constrói o teu treino ideal.</p>
        </div>
        <Button>Guardar</Button>
      </div>

      <div className="space-y-4">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={exercises}
            strategy={verticalListSortingStrategy}
          >
            {exercises.map((ex) => (
              <SortableExerciseItem key={ex.id} ex={ex} onRemove={handleRemove} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <Button variant="secondary" className="w-full h-14 border border-dashed border-gray-600 hover:border-primary/50 text-gray-400 hover:bg-primary/5">
        <Plus className="w-5 h-5 mr-2 text-primary" />
        Adicionar Exercício
      </Button>
    </div>
  )
}
