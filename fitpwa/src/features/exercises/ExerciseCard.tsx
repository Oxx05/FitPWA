import { cn } from '@/shared/utils/cn'

interface ExerciseCardProps {
  exercise: {
    id: string
    name: string
    muscle_groups: string[]
    difficulty?: number
    gif_url?: string
  }
  onClick?: () => void
  selected?: boolean
}

export function ExerciseCard({ exercise, onClick, selected }: ExerciseCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-surface-200 border border-surface-100 rounded-xl p-3 flex gap-4 items-center cursor-pointer transition-colors hover:border-primary/50",
        selected && "border-primary bg-primary/5"
      )}
    >
      <div className="w-16 h-16 bg-surface-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
        {exercise.gif_url ? (
          <img src={exercise.gif_url} alt={exercise.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-gray-500 text-xs">Sem Imagem</span>
        )}
      </div>
      <div className="flex-grow">
        <h4 className="text-white font-medium text-sm md:text-base">{exercise.name}</h4>
        <p className="text-gray-400 text-xs capitalize">
          {exercise.muscle_groups.join(', ')}
        </p>
      </div>
    </div>
  )
}
