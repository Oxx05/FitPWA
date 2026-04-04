import React from 'react'
import Model from 'react-body-highlighter'

const HIGHLIGHT_COLOR = '#FF3B30'
const BODY_COLOR = '#2C2C2E'

// Maps both Portuguese and English muscle names to react-body-highlighter muscle ids
export const MUSCLE_MAP: Record<string, string[]> = {
  // Portuguese
  'peito': ['chest'],
  'tríceps': ['triceps'],
  'ombro': ['front-deltoids', 'back-deltoids'],
  'ombros': ['front-deltoids', 'back-deltoids'],
  'deltóides': ['front-deltoids', 'back-deltoids'],
  'costas': ['upper-back', 'lower-back'],
  'dorsais': ['upper-back', 'lower-back'],
  'bíceps': ['biceps'],
  'braços': ['biceps', 'triceps'],
  'pernas': ['quadriceps'],
  'quadríceps': ['quadriceps'],
  'femorais': ['hamstring'],
  'glúteos': ['gluteal'],
  'gluteos': ['gluteal'],
  'isquiotibiais': ['hamstring'],
  'panturrilla': ['calves'],
  'panturrilha': ['calves'],
  'gémeos': ['calves'],
  'abdominais': ['abs'],
  'abdominal': ['abs'],
  'core': ['abs'],
  'oblíquos': ['obliques'],
  'obliquos': ['obliques'],
  'antebraços': ['forearm'],
  'antebraço': ['forearm'],
  'trapézio': ['trapezius'],
  'trapezio': ['trapezius'],
  'lombares': ['lower-back'],
  'lombar': ['lower-back'],
  'grip': ['forearm'],
  // English
  'chest': ['chest'],
  'triceps': ['triceps'],
  'shoulders': ['front-deltoids', 'back-deltoids'],
  'back': ['upper-back', 'lower-back'],
  'biceps': ['biceps'],
  'legs': ['quadriceps'],
  'quads': ['quadriceps'],
  'quadriceps': ['quadriceps'],
  'glutes': ['gluteal'],
  'gluteal': ['gluteal'],
  'hamstrings': ['hamstring'],
  'hamstring': ['hamstring'],
  'calves': ['calves'],
  'abs': ['abs'],
  'abdominals': ['abs'],
  'obliques': ['obliques'],
  'forearms': ['forearm'],
  'forearm': ['forearm'],
  'traps': ['trapezius'],
  'trapezius': ['trapezius'],
  'lats': ['upper-back'],
  'upper back': ['upper-back'],
  'lower back': ['lower-back'],
  'front deltoids': ['front-deltoids'],
  'rear deltoids': ['back-deltoids'],
  'adductors': ['adductor'],
  'adductor': ['adductor'],
}

export function buildModelData(muscleNames: string[]) {
  const collected = new Set<string>()
  for (const raw of muscleNames) {
    const mapped = MUSCLE_MAP[raw.toLowerCase().trim()]
    if (mapped) mapped.forEach(m => collected.add(m))
  }
  if (collected.size === 0) return []
  return [{ name: 'exercise', muscles: Array.from(collected) as any[], frequency: 1 }]
}

interface MuscleIconProps {
  muscles: string[]
  /** sm = compact thumbnail (64px), lg = full modal size */
  size?: 'sm' | 'lg'
  className?: string
}

export function MuscleIcon({ muscles, size = 'sm', className }: MuscleIconProps) {
  const data = React.useMemo(() => buildModelData(muscles), [muscles])

  const modelProps = {
    data,
    highlightedColors: [HIGHLIGHT_COLOR] as [string],
    bodyColor: BODY_COLOR,
    svgStyle: { width: '100%', height: 'auto', display: 'block' } as React.CSSProperties,
  }

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-0.5 w-full h-full ${className ?? ''}`}>
        <div className="flex-1 min-w-0">
          <Model type="anterior" {...modelProps} />
        </div>
        <div className="flex-1 min-w-0">
          <Model type="posterior" {...modelProps} />
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 gap-6 w-full ${className ?? ''}`}>
      <div>
        <Model type="anterior" {...modelProps} />
      </div>
      <div>
        <Model type="posterior" {...modelProps} />
      </div>
    </div>
  )
}
