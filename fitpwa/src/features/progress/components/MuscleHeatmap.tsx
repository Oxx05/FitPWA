import React from 'react'
import Model from 'react-body-highlighter'

type MuscleIntensity = 'primary' | 'secondary'

export interface ActiveMuscle {
  id: string
  type: MuscleIntensity
}

export interface MuscleHeatmapProps {
  activeMuscles?: ActiveMuscle[]
  className?: string
}

const PRIMARY_FILL = '#FF3B30'
const SECONDARY_FILL = '#FF9500'

// Map app muscle ids (including free-exercise-db names) to react-body-highlighter muscle names
export const MUSCLE_NAME_MAP: Record<string, string[]> = {
  // free-exercise-db names
  abdominals: ['abs'],
  abductors: ['abductors'],
  adductors: ['adductor'],
  biceps: ['biceps'],
  calves: ['calves'],
  chest: ['chest'],
  forearms: ['forearm'],
  forearm: ['forearm'],
  glutes: ['gluteal'],
  gluteal: ['gluteal'],
  hamstrings: ['hamstring'],
  hamstring: ['hamstring'],
  'hip flexors': ['quadriceps'],
  lats: ['upper-back'],
  'lower back': ['lower-back'],
  'middle back': ['upper-back'],
  neck: ['neck'],
  obliques: ['obliques'],
  quads: ['quadriceps'],
  quadriceps: ['quadriceps'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  traps: ['trapezius'],
  trapezius: ['trapezius'],
  triceps: ['triceps'],
  'upper back': ['upper-back'],
  // legacy / PT-origin names
  pectoralis: ['chest'],
  deltoids: ['front-deltoids', 'back-deltoids'],
  'front deltoids': ['front-deltoids'],
  'rear deltoids': ['back-deltoids'],
  abs: ['abs'],
  back: ['upper-back', 'lower-back'],
  legs: ['quadriceps'],
}

export function mapMusclesToHighlighter(activeMuscles: ActiveMuscle[]) {
  return activeMuscles.flatMap(muscle => {
    const mapped = MUSCLE_NAME_MAP[muscle.id.toLowerCase().trim()]
    if (!mapped) return []
    return mapped.map(m => ({
      name: muscle.id,
      muscles: [m] as any[],
      frequency: muscle.type === 'primary' ? 2 : 1,
    }))
  })
}

export function MuscleHeatmap({ activeMuscles = [], className }: MuscleHeatmapProps) {
  const data = React.useMemo(() => mapMusclesToHighlighter(activeMuscles), [activeMuscles])

  return (
    <div className={`mx-auto w-full max-w-lg ${className ?? ''}`}>
      <div className="grid grid-cols-2 gap-4 w-full place-items-center">
        <div className="w-full flex justify-center">
          <Model
            type="anterior"
            data={data}
            highlightedColors={[SECONDARY_FILL, PRIMARY_FILL]}
            bodyColor="#2C2C2E"
            style={{ width: '100%' }}
            svgStyle={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
        <div className="w-full flex justify-center">
          <Model
            type="posterior"
            data={data}
            highlightedColors={[SECONDARY_FILL, PRIMARY_FILL]}
            bodyColor="#2C2C2E"
            style={{ width: '100%' }}
            svgStyle={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </div>
    </div>
  )
}
