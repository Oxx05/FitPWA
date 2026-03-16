import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Dumbbell, ChevronRight } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { supabase } from '@/shared/lib/supabase'

interface TemplatePlan {
  id: string
  name: string
  description: string | null
  type: string | null
  days_per_week: number | null
}

const getDifficulty = (plan: TemplatePlan) => {
  const name = plan.name.toLowerCase()
  if (name.includes('iniciante')) return 'beginner'
  if (name.includes('intermédio') || name.includes('intermedio')) return 'intermediate'
  if (name.includes('avançado') || name.includes('avancado')) return 'advanced'
  if (name.includes('strength') || name.includes('power') || name.includes('athletic')) return 'advanced'
  return 'intermediate'
}

export function BaseWorkouts() {
  const navigate = useNavigate()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<TemplatePlan | null>(null)
  const [showModal, setShowModal] = useState(false)

  const difficulties = {
    beginner: { label: 'Iniciante', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
    intermediate: { label: 'Intermédio', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
    advanced: { label: 'Avançado', color: 'text-red-400 border-red-400/30 bg-red-400/10' }
  }

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['template-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id,name,description,type,days_per_week')
        .eq('is_template', true)
        .order('name')
      if (error) throw error
      return (data || []) as TemplatePlan[]
    }
  })

  const filtered = useMemo(() => {
    if (!selectedDifficulty) return templates
    return templates.filter(t => getDifficulty(t) === selectedDifficulty)
  }, [templates, selectedDifficulty])

  const handleSelect = (workout: TemplatePlan) => {
    setSelectedWorkout(workout)
    setShowModal(true)
  }

  const handleConfirm = async () => {
    if (!selectedWorkout) return
    
    try {
      // Navigate to workout editor with template
      navigate(`/workouts/new?templateId=${selectedWorkout.id}`)
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
        {isLoading && (
          <div className="col-span-full flex justify-center p-8 text-gray-400">
            A carregar planos...
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 bg-surface-100 rounded-2xl border border-surface-200 p-8">
            Nenhum plano disponível.
          </div>
        )}
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
                    className={`text-xs font-bold px-2 py-1 rounded border ${difficulties[getDifficulty(workout)].color}`}
                  >
                    {difficulties[getDifficulty(workout)].label}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  {workout.name}
                </h3>
                <p className="text-sm text-gray-400 mt-2">{workout.description || 'Plano base para customizar'}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
                <span className="text-sm bg-surface-100 px-3 py-1 rounded text-gray-300">
                  {workout.days_per_week || 0}x / semana
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
                {selectedWorkout && difficulties[getDifficulty(selectedWorkout)].label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frequência:</span>
              <span className="text-white font-medium">
                {selectedWorkout?.days_per_week || 0}x por semana
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
