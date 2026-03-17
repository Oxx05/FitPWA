import { useState, useMemo } from 'react'
import { Search, Filter, SearchIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExerciseCard } from './ExerciseCard'
import { Input } from '@/shared/components/Input'
import { EmptyState } from '@/shared/components/EmptyState'
import { CustomSelect } from '@/shared/components/CustomSelect'

import { useOfflineExercises } from '@/shared/hooks/useOfflineData'
import { Modal } from '@/shared/components/Modal'
import { ExerciseEvolution } from './components/ExerciseEvolution'

interface Exercise {
  id: string
  name: string
  muscle_groups: string[]
}

export function ExerciseLibrary() {
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>('all')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const { data: exercises, isLoading } = useOfflineExercises()

  const filteredExercises = useMemo(() => exercises?.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = muscleFilter === 'all' || ex.muscle_groups.includes(muscleFilter)
    return matchesSearch && matchesMuscle
  }), [exercises, search, muscleFilter])

  // get unique muscles for filter
  const muscleOptions = useMemo(() => {
    const uniqueMuscles = Array.from(new Set(exercises?.flatMap(e => e.muscle_groups) || []))
    return [
      { value: 'all', label: 'Todos os Músculos' },
      ...uniqueMuscles.map(m => ({ value: m, label: m }))
    ]
  }, [exercises])

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Exercícios</h1>
        <p className="text-gray-400">Encontra a execução perfeita para cada movimento.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Input 
            placeholder="Pesquisar exercício..."
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
              >
                <ExerciseCard 
                  exercise={exercise} 
                  onClick={() => setSelectedExercise(exercise)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredExercises?.length === 0 && (
            <div className="col-span-full">
              <EmptyState 
                icon={<SearchIcon className="w-8 h-8" />}
                title="Sem Resultados"
                description={`Não encontrámos nenhum exercício para "${search}". Tenta procurar por outro nome.`}
              />
            </div>
          )}
        </div>
      )}
      <Modal
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title="Evolução"
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
    </div>
  )
}
