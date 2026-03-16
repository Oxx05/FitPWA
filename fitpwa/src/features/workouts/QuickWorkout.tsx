import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronRight, Plus, Search, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { EXERCISES } from '@/shared/data/exercises'
import { useAuthStore } from '@/features/auth/authStore'
import { useNavigate } from 'react-router-dom'

interface QuickExercise {
  exerciseId: string
  sets: number
  reps: number
  weight?: number
}

export function QuickWorkout() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<QuickExercise[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)

  const muscleGroups = ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Antebraço', 'Pernas', 'Femorais', 'Glúteos', 'Abdominais', 'Core']

  const filteredExercises = EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = selectedMuscle ? ex.muscleGroups.includes(selectedMuscle) : true
    return matchesSearch && matchesMuscle
  })

  const addExercise = (exerciseId: string) => {
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId, sets: 3, reps: 10, weight: 0 }
    ])
    setShowExerciseModal(false)
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
      // Save as quick workout history
      const workoutData = {
        user_id: profile?.id,
        exercises: selectedExercises,
        started_at: new Date().toISOString(),
        duration_minutes: 0,
        title: 'Treino Rápido'
      }
      
      // For now, just save to localStorage and navigate
      localStorage.setItem('quickWorkout', JSON.stringify(workoutData))
      return workoutData
    },
    onSuccess: () => {
      navigate('/session/quick')
    }
  })

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Treino Rápido</h1>
        <p className="text-gray-400">Crie um treino individual sem seguir um plano</p>
      </div>

      {/* Selected Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Exercícios Selecionados</h2>
          <span className="text-sm text-gray-400">{selectedExercises.length} exercícios</span>
        </div>

        {selectedExercises.length > 0 ? (
          <div className="space-y-3">
            {selectedExercises.map((ex, idx) => {
              const exercise = EXERCISES.find(e => e.id === ex.exerciseId)
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface-200 border border-surface-100 p-4 rounded-xl flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{exercise?.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{exercise?.muscleGroups.join(', ')}</p>
                    
                    {exercise?.imageUrl && (
                      <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name}
                        className="w-16 h-16 rounded-lg mt-2 object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(idx, { sets: parseInt(e.target.value) || 1 })}
                      placeholder="Sets"
                      className="w-16 bg-surface-100 border border-surface-200 rounded px-2 py-1 text-white text-center text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExercise(idx, { reps: parseInt(e.target.value) || 1 })}
                      placeholder="Reps"
                      className="w-16 bg-surface-100 border border-surface-200 rounded px-2 py-1 text-white text-center text-sm"
                      min="1"
                    />
                    <input
                      type="number"
                      value={ex.weight || ''}
                      onChange={(e) => updateExercise(idx, { weight: e.target.value ? parseFloat(e.target.value) : 0 })}
                      placeholder="kg"
                      className="w-16 bg-surface-100 border border-surface-200 rounded px-2 py-1 text-white text-center text-sm"
                      step="0.5"
                    />
                    <button
                      onClick={() => removeExercise(idx)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-surface-100 rounded-2xl border border-surface-200">
            <Zap className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum exercício selecionado ainda</p>
          </div>
        )}
      </div>

      {/* Add Exercise Button */}
      <Button
        onClick={() => setShowExerciseModal(true)}
        className="w-full bg-primary hover:bg-primary/90 text-black rounded-xl py-3"
      >
        <Plus className="w-5 h-5 mr-2" />
        Adicionar Exercício
      </Button>

      {/* Start Button */}
      {selectedExercises.length > 0 && (
        <Button
          onClick={() => startWorkoutMutation.mutate()}
          disabled={startWorkoutMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3"
        >
          Começar Treino
        </Button>
      )}

      {/* Exercise Selection Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Selecionar Exercício"
        closeButton
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar exercício..."
              className="w-full pl-10 pr-4 py-2 bg-surface-100 border border-surface-200 rounded-lg text-white placeholder-gray-500"
            />
          </div>

          {/* Muscle Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedMuscle(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedMuscle === null
                  ? 'bg-primary text-black'
                  : 'bg-surface-100 text-gray-400'
              }`}
            >
              Todos
            </button>
            {muscleGroups.map(muscle => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedMuscle === muscle
                    ? 'bg-primary text-black'
                    : 'bg-surface-100 text-gray-400'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>

          {/* Exercise List */}
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <motion.button
                key={exercise.id}
                onClick={() => addExercise(exercise.id)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full text-left p-3 bg-surface-100 hover:bg-surface-200 rounded-lg transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium text-white group-hover:text-primary transition-colors">{exercise.name}</p>
                  <p className="text-xs text-gray-500">{exercise.muscleGroups.join(' • ')}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
