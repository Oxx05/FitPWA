import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { ExerciseCard } from './ExerciseCard'
import { Input } from '@/shared/components/Input'
import { EmptyState } from '@/shared/components/EmptyState'
import { SearchIcon } from 'lucide-react'

export function ExerciseLibrary() {
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>('all')

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    }
  })

  const filteredExercises = useMemo(() => exercises?.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = muscleFilter === 'all' || ex.muscle_groups.includes(muscleFilter)
    return matchesSearch && matchesMuscle
  }), [exercises, search, muscleFilter])

  // get unique muscles for filter
  const muscles = useMemo(() => 
    Array.from(new Set(exercises?.flatMap(e => e.muscle_groups) || []))
  , [exercises])

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
        
        <div className="relative shrink-0">
          <select 
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="w-full md:w-48 appearance-none bg-surface-100 border border-surface-200 text-white rounded-md h-10 px-3 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Músculos</option>
            {muscles.map(m => (
              <option key={m} value={m} className="capitalize">{m}</option>
            ))}
          </select>
          <Filter className="absolute left-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises?.map(exercise => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
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
    </div>
  )
}
