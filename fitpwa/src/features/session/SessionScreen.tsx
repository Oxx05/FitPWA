import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Square, Play, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { supabase } from '@/shared/lib/supabase'

interface SetRecord {
  id: string
  setNumber: number
  reps: number | null
  weight: number | null
  completed: boolean
  rpe?: number
}

interface ExerciseInSession {
  id: string
  order: number
  exerciseId: string
  name: string
  sets: SetRecord[]
  muscleGroups: string[]
  repsMin: number
  repsMax: number
  restSeconds: number
}

export function SessionScreen() {
  const navigate = useNavigate()
  const { id: planId } = useParams<{ id?: string }>()

  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)

  // Timer efeito
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Rest timer effet
  useEffect(() => {
    if (restTimer === null) return
    if (restTimer <= 0) {
      setRestTimer(null)
      return
    }
    const interval = setInterval(() => setRestTimer(t => (t ?? 0) - 1), 1000)
    return () => clearInterval(interval)
  }, [restTimer])

  // Load plan data
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        if (!planId) throw new Error('Plan ID missing')

        const { error: planError } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('id', planId)
          .single()

        if (planError) throw planError

        // Load exercises via the correct junction table
        const { data: planExercises, error: peError } = await supabase
          .from('plan_exercises')
          .select(`
            id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg,
            exercises ( id, name, name_pt, muscle_groups )
          `)
          .eq('plan_id', planId)
          .order('order_index', { ascending: true })

        if (peError) throw peError

        // Transform to session format
        const sessionExercises = (planExercises || []).map((pe: Record<string, unknown>, idx: number) => {
          const ex = pe.exercises as Record<string, unknown> | null
          return {
            id: pe.id as string,
            order: idx,
            exerciseId: ex?.id as string ?? '',
            name: (ex?.name_pt as string) || (ex?.name as string) || 'Exercício',
            sets: Array.from({ length: (pe.sets as number) || 3 }, (_, i) => ({
              id: `${pe.id}-${i}`,
              setNumber: i + 1,
              reps: null,
              weight: (pe.weight_kg as number) || null,
              completed: false
            })),
            muscleGroups: (ex?.muscle_groups as string[]) || [],
            repsMin: (pe.reps_min as number) || 8,
            repsMax: (pe.reps_max as number) || 12,
            restSeconds: (pe.rest_seconds as number) || 90
          }
        })

        setExercises(sessionExercises)
      } catch (error) {
        console.error('Failed to load plan:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlanData()
  }, [planId])

  const currentExercise = exercises[currentExerciseIndex]

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSetChange = (setId: string, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => prev.map(ex => ({
      ...ex,
      sets: ex.sets.map(set =>
        set.id === setId
          ? { ...set, [field]: value ? parseFloat(value) : null }
          : set
      )
    })))
  }

  const handleCompleteSet = (setId: string) => {
    setExercises(prev => prev.map(ex => ({
      ...ex,
      sets: ex.sets.map(set =>
        set.id === setId
          ? { ...set, completed: !set.completed }
          : set
      )
    })))

    // Start rest timer after completing a set
    const exercise = exercises[currentExerciseIndex]
    if (exercise) {
      setRestTimer(exercise.restSeconds)
    }
  }

  const handleAddSet = () => {
    if (!currentExercise) return
    setExercises(prev => prev.map((ex, idx) =>
      idx === currentExerciseIndex
        ? {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `${ex.id}-${ex.sets.length}`,
                setNumber: ex.sets.length + 1,
                reps: null,
                weight: null,
                completed: false
              }
            ]
          }
        : ex
    ))
  }

  const handleRemoveSet = (setId: string) => {
    setExercises(prev => prev.map((ex, idx) =>
      idx === currentExerciseIndex
        ? {
            ...ex,
            sets: ex.sets.filter(s => s.id !== setId)
          }
        : ex
    ))
  }

  const finishWorkout = async () => {
    try {
      setIsRunning(false)

      // Calculate stats
      const totalVolume = exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((setAcc, set) =>
          setAcc + ((set.weight || 0) * (set.reps || 0)), 0), 0)

      const stats = {
        volume: totalVolume,
        exercisesCount: exercises.length,
        setsCount: exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
        duration
      }

      // TODO: Save to Supabase + calculate XP

      navigate('/session/summary', { state: { stats, duration } })
    } catch (error) {
      console.error('Error finishing workout:', error)
      // TODO: Show error toast
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-2">Sem exercícios</h1>
        <p className="text-gray-400 mb-4">Este plano não tem exercícios configurados.</p>
        <Button onClick={() => navigate('/workouts')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-200/90 backdrop-blur border-b border-surface-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-white text-lg">Sessão Activa</h1>
            <p className="text-sm text-gray-400">{currentExerciseIndex + 1} / {exercises.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-primary font-mono font-bold">{formatTime(duration)}</p>
              <p className="text-xs text-gray-400">Duração</p>
            </div>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => setShowFinishModal(true)}
              className="gap-1"
            >
              <Square className="w-4 h-4" />
              Terminar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* Exercise Card */}
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentExercise.name}</h2>
              <p className="text-sm text-gray-400 capitalize mt-1">
                {currentExercise.muscleGroups.join(', ')}
              </p>
            </div>
            <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">
              {currentExercise.repsMin}–{currentExercise.repsMax} reps
            </span>
          </div>

          {/* Sets List */}
          <div className="space-y-2 mb-4">
            {currentExercise.sets.map(set => (
              <div 
                key={set.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  set.completed 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-surface-100 border border-surface-100'
                }`}
              >
                <span className="font-bold text-gray-400 w-8 text-center">
                  {set.setNumber}
                </span>

                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight || ''}
                  onChange={e => handleSetChange(set.id, 'weight', e.target.value)}
                  className="w-20 h-10 bg-background border border-surface-200 rounded text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                <span className="text-gray-500">×</span>

                <input
                  type="number"
                  placeholder="reps"
                  value={set.reps || ''}
                  onChange={e => handleSetChange(set.id, 'reps', e.target.value)}
                  className="w-20 h-10 bg-background border border-surface-200 rounded text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                <button
                  onClick={() => handleCompleteSet(set.id)}
                  className={`ml-auto w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                    set.completed
                      ? 'bg-primary text-black'
                      : 'bg-gray-700 text-gray-400 hover:bg-primary hover:text-black'
                  }`}
                >
                  {set.completed ? '✓' : '○'}
                </button>

                <button
                  onClick={() => handleRemoveSet(set.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddSet}
            className="w-full h-10 border border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Série
          </button>
        </div>

        {/* Rest Timer */}
        {restTimer !== null && (
          <div className="bg-surface-200 border-2 border-primary/50 p-6 rounded-2xl text-center">
            <p className="text-gray-400 text-sm mb-2">Tempo de Descanso</p>
            <p className="text-6xl font-bold text-primary font-mono">
              {restTimer}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setRestTimer(null)}
              className="mt-4 text-gray-400"
            >
              Pular
            </Button>
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-200 border-t border-surface-100 z-40">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            variant="secondary"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(i => i - 1)}
            className="flex-1 gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </Button>

          <Button
            variant={isRunning ? 'secondary' : 'ghost'}
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 gap-2"
          >
            {isRunning ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Em progresso
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Retomar
              </>
            )}
          </Button>

          <Button
            disabled={currentExerciseIndex === exercises.length - 1}
            onClick={() => setCurrentExerciseIndex(i => i + 1)}
            className="flex-1 gap-2"
          >
            Próximo
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Finish Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Terminar Sessão?"
        size="sm"
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            Tens a certeza que deseja terminar esta sessão? Isso vai registar toda a actividade.
          </p>

          <div className="space-y-2 bg-surface-100 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duração:</span>
              <span className="text-white font-medium">{formatTime(duration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Exercícios:</span>
              <span className="text-white font-medium">{exercises.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Séries totais:</span>
              <span className="text-white font-medium">
                {exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowFinishModal(false)}
              className="flex-1"
            >
              Continuar
            </Button>
            <Button
              variant="danger"
              onClick={finishWorkout}
              className="flex-1"
            >
              Sim, Terminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
