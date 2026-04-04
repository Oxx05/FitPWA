import { cn } from '@/shared/utils/cn'
import { MuscleIcon } from '@/shared/components/MuscleIcon'
import { useTranslation } from 'react-i18next'
import { humanizeMuscle } from '@/shared/utils/muscleUtils'

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
  const { t } = useTranslation()

  const muscleLabel = exercise.muscle_groups?.length
    ? exercise.muscle_groups.map(m => humanizeMuscle(m, t)).join(', ')
    : t('common.exercise')

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-surface-200 border border-surface-100 rounded-xl p-3 flex gap-4 items-center cursor-pointer transition-colors hover:border-primary/50",
        selected && "border-primary bg-primary/5"
      )}
    >
      <div className="w-16 h-16 bg-surface-100 rounded-lg flex-shrink-0 overflow-hidden p-1">
        <MuscleIcon muscles={exercise.muscle_groups} size="sm" />
      </div>
      <div className="flex-grow">
        <h4 className="text-white font-medium text-sm md:text-base">{exercise.name}</h4>
        <p className="text-gray-400 text-xs">
          {muscleLabel}
        </p>
      </div>
    </div>
  )
}
