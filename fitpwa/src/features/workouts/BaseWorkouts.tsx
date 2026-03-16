import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { BASE_WORKOUTS, type BaseWorkout } from './baseWorkouts'


export function BaseWorkouts() {
  const navigate = useNavigate()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<BaseWorkout | null>(null)
  const [showModal, setShowModal] = useState(false)

  const difficulties = {
    beginner: { label: 'Iniciante', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
    intermediate: { label: 'Intermédio', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
    advanced: { label: 'Avançado', color: 'text-red-400 border-red-400/30 bg-red-400/10' }
  }

  const filtered = selectedDifficulty 
    ? BASE_WORKOUTS.filter(w => w.difficulty === selectedDifficulty)
    : BASE_WORKOUTS

  const handleSelect = (workout: typeof BASE_WORKOUTS[0]) => {
    setSelectedWorkout(workout)
    setShowModal(true)
  }

  const handleConfirm = async () => {
    if (!selectedWorkout) return
    
    try {
      // Navigate to workout editor with base template
      navigate(`/workouts/new?baseTemplate=${selectedWorkout.id}`, {
        state: { baseWorkout: selectedWorkout }
      })
    } catch (error) {
      console.error('Error loading base workout:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Planos Pré-feitos</h1>
        <p className="text-gray-400">Escolhe um plano base e customiza-o conforme precisas.</p>
      </div>

      {/* Difficulty Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDifficulty(null)}
          className={`px-4 py-2 rounded-lg border transition-all ${
            selectedDifficulty === null
              ? 'bg-primary text-black border-primary'
              : 'bg-surface-200 border-surface-100 text-white hover:border-primary/50'
          }`}
        >
          Todos
        </button>
        {Object.entries(difficulties).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setSelectedDifficulty(key)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedDifficulty === key
                ? 'bg-primary text-black border-primary'
                : 'bg-surface-200 border-surface-100 text-white hover:border-primary/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((workout, idx) => (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleSelect(workout)}
            className="cursor-pointer group"
          >
            <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded border ${difficulties[workout.difficulty as keyof typeof difficulties].color}`}
                  >
                    {difficulties[workout.difficulty as keyof typeof difficulties].label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  {workout.name}
                </h3>
                <p className="text-sm text-gray-400 mt-2">{workout.description}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
                <span className="text-sm bg-surface-100 px-3 py-1 rounded text-gray-300">
                  {workout.daysPerWeek}x / semana
                </span>
                <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedWorkout?.name}
        size="sm"
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            {selectedWorkout?.description}
          </p>

          <div className="bg-surface-100 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Dificuldade:</span>
              <span className="text-white font-medium capitalize">
                {selectedWorkout && difficulties[selectedWorkout.difficulty as keyof typeof difficulties].label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frequência:</span>
              <span className="text-white font-medium">
                {selectedWorkout?.daysPerWeek}x por semana
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            Podes customizar este plano depois de o criares. Tens a certeza que queres continuar?
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 gap-2"
            >
              Usar Este Plano
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
