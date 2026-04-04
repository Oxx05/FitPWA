import { describe, it, expect, vi } from 'vitest'

// Mock the react-body-highlighter UI dependency so the module can be imported
// in a non-browser test environment without SVG rendering side-effects.
vi.mock('react-body-highlighter', () => ({ default: vi.fn() }))

import { mapMusclesToHighlighter, MUSCLE_NAME_MAP } from './MuscleHeatmap'
import type { ActiveMuscle } from './MuscleHeatmap'

// ---------------------------------------------------------------------------
// Contract: mapMusclesToHighlighter(activeMuscles)
//
// Collaborator contract (London School):
//   mapMusclesToHighlighter talks to MUSCLE_NAME_MAP to translate
//   ActiveMuscle[] into the data shape expected by <Model> from
//   react-body-highlighter. Each mapped highlighter id becomes a separate
//   model entry carrying the original muscle.id as its name and a frequency
//   that encodes intensity (2 = primary, 1 = secondary).
//
// We verify BEHAVIOUR through observable outputs: the shape and values of the
// returned array. We do NOT test React useMemo or the component tree.
// ---------------------------------------------------------------------------

describe('MUSCLE_NAME_MAP', () => {
  it('is a non-empty record so callers have a stable contract', () => {
    expect(typeof MUSCLE_NAME_MAP).toBe('object')
    expect(Object.keys(MUSCLE_NAME_MAP).length).toBeGreaterThan(0)
  })
})

describe('mapMusclesToHighlighter', () => {
  describe('frequency assignment', () => {
    it('assigns frequency 2 to a primary muscle', () => {
      const input: ActiveMuscle[] = [{ id: 'chest', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      expect(result.length).toBeGreaterThan(0)
      result.forEach(entry => {
        expect(entry.frequency).toBe(2)
      })
    })

    it('assigns frequency 1 to a secondary muscle', () => {
      const input: ActiveMuscle[] = [{ id: 'chest', type: 'secondary' }]
      const result = mapMusclesToHighlighter(input)

      expect(result.length).toBeGreaterThan(0)
      result.forEach(entry => {
        expect(entry.frequency).toBe(1)
      })
    })

    it('correctly assigns different frequencies when primary and secondary are both present', () => {
      const input: ActiveMuscle[] = [
        { id: 'chest', type: 'primary' },
        { id: 'triceps', type: 'secondary' },
      ]
      const result = mapMusclesToHighlighter(input)

      const chestEntries = result.filter(e => e.name === 'chest')
      const tricepsEntries = result.filter(e => e.name === 'triceps')

      chestEntries.forEach(e => expect(e.frequency).toBe(2))
      tricepsEntries.forEach(e => expect(e.frequency).toBe(1))
    })
  })

  describe('unknown muscle id behaviour', () => {
    it('returns an empty array when the id has no mapping', () => {
      const input: ActiveMuscle[] = [{ id: 'xyzunknown', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)
      expect(result).toEqual([])
    })

    it('returns an empty array for an empty input list', () => {
      const result = mapMusclesToHighlighter([])
      expect(result).toEqual([])
    })

    it('skips unmapped muscles but still returns entries for known ones', () => {
      const input: ActiveMuscle[] = [
        { id: 'xyzunknown', type: 'primary' },
        { id: 'chest', type: 'primary' },
      ]
      const result = mapMusclesToHighlighter(input)

      expect(result.length).toBeGreaterThan(0)
      const names = result.map(e => e.name)
      expect(names).not.toContain('xyzunknown')
      expect(names).toContain('chest')
    })
  })

  describe('case-insensitive and whitespace-trimming behaviour', () => {
    it('resolves an uppercased id: "CHEST"', () => {
      const input: ActiveMuscle[] = [{ id: 'CHEST', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)
      expect(result.length).toBeGreaterThan(0)
      const allMuscles = result.flatMap(e => e.muscles as string[])
      expect(allMuscles).toContain('chest')
    })

    it('resolves an id with surrounding whitespace: "  chest  "', () => {
      const input: ActiveMuscle[] = [{ id: '  chest  ', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)
      expect(result.length).toBeGreaterThan(0)
      const allMuscles = result.flatMap(e => e.muscles as string[])
      expect(allMuscles).toContain('chest')
    })

    it('resolves a mixed-case id: "Shoulders"', () => {
      const input: ActiveMuscle[] = [{ id: 'Shoulders', type: 'secondary' }]
      const result = mapMusclesToHighlighter(input)
      const allMuscles = result.flatMap(e => e.muscles as string[])
      expect(allMuscles).toContain('front-deltoids')
      expect(allMuscles).toContain('back-deltoids')
    })
  })

  describe('one-to-many mapping (muscle → multiple highlighter ids)', () => {
    it('produces one entry per highlighter id when the muscle maps to several ids', () => {
      // "shoulders" maps to ['front-deltoids', 'back-deltoids'] — two highlighter ids
      const input: ActiveMuscle[] = [{ id: 'shoulders', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      expect(result).toHaveLength(2)
    })

    it('each resulting entry holds exactly one highlighter muscle id in its muscles array', () => {
      const input: ActiveMuscle[] = [{ id: 'shoulders', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      result.forEach(entry => {
        expect((entry.muscles as string[]).length).toBe(1)
      })
    })

    it('covers both front-deltoids and back-deltoids for "shoulders"', () => {
      const input: ActiveMuscle[] = [{ id: 'shoulders', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      const allMuscles = result.flatMap(e => e.muscles as string[])
      expect(allMuscles).toContain('front-deltoids')
      expect(allMuscles).toContain('back-deltoids')
    })

    it('covers both upper-back and lower-back for "back"', () => {
      const input: ActiveMuscle[] = [{ id: 'back', type: 'secondary' }]
      const result = mapMusclesToHighlighter(input)

      const allMuscles = result.flatMap(e => e.muscles as string[])
      expect(allMuscles).toContain('upper-back')
      expect(allMuscles).toContain('lower-back')
    })
  })

  describe('model entry shape', () => {
    it('uses the original muscle.id (not the highlighter id) as the entry name', () => {
      // The name field in each entry must be the original id so the component
      // can correlate entries back to the source exercise muscle.
      const input: ActiveMuscle[] = [{ id: 'chest', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      result.forEach(entry => {
        expect(entry.name).toBe('chest')
      })
    })

    it('wraps each highlighter id in a single-element muscles array', () => {
      const input: ActiveMuscle[] = [{ id: 'biceps', type: 'primary' }]
      const result = mapMusclesToHighlighter(input)

      expect(result).toHaveLength(1)
      expect(result[0].muscles).toEqual(['biceps'])
    })
  })

  describe('known free-exercise-db name aliases', () => {
    it('maps "abdominals" to abs', () => {
      const result = mapMusclesToHighlighter([{ id: 'abdominals', type: 'primary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('abs')
    })

    it('maps "glutes" to gluteal', () => {
      const result = mapMusclesToHighlighter([{ id: 'glutes', type: 'primary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('gluteal')
    })

    it('maps "hamstrings" to hamstring', () => {
      const result = mapMusclesToHighlighter([{ id: 'hamstrings', type: 'secondary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('hamstring')
    })

    it('maps "lats" to upper-back', () => {
      const result = mapMusclesToHighlighter([{ id: 'lats', type: 'primary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('upper-back')
    })

    it('maps "quads" to quadriceps', () => {
      const result = mapMusclesToHighlighter([{ id: 'quads', type: 'primary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('quadriceps')
    })

    it('maps "traps" to trapezius', () => {
      const result = mapMusclesToHighlighter([{ id: 'traps', type: 'secondary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('trapezius')
    })

    it('maps "hip flexors" to quadriceps', () => {
      const result = mapMusclesToHighlighter([{ id: 'hip flexors', type: 'primary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('quadriceps')
    })

    it('maps "lower back" to lower-back', () => {
      const result = mapMusclesToHighlighter([{ id: 'lower back', type: 'secondary' }])
      expect(result.flatMap(e => e.muscles as string[])).toContain('lower-back')
    })
  })
})
