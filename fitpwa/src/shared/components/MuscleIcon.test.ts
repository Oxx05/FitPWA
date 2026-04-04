import { describe, it, expect, vi } from 'vitest'

// Mock the react-body-highlighter UI dependency so the module can be imported
// in a non-browser test environment without SVG rendering errors.
vi.mock('react-body-highlighter', () => ({ default: vi.fn() }))

import { buildModelData, MUSCLE_MAP } from './MuscleIcon'

// ---------------------------------------------------------------------------
// Contract: buildModelData(muscleNames)
//
// Collaborator contract (London School):
//   buildModelData talks to MUSCLE_MAP to translate raw muscle name strings
//   into react-body-highlighter muscle ids. The caller (MuscleIcon) receives
//   a model-data array it can hand to the <Model> component without needing
//   to know anything about the mapping table.
//
// We verify BEHAVIOUR through observable outputs, not internal state.
// ---------------------------------------------------------------------------

describe('MUSCLE_MAP', () => {
  it('is a non-empty record so that callers have a contract to rely on', () => {
    expect(typeof MUSCLE_MAP).toBe('object')
    expect(Object.keys(MUSCLE_MAP).length).toBeGreaterThan(0)
  })
})

describe('buildModelData', () => {
  describe('English muscle names', () => {
    it('maps "chest" to the chest highlighter id', () => {
      const result = buildModelData(['chest'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
    })

    it('maps "shoulders" to both front-deltoids and back-deltoids', () => {
      const result = buildModelData(['shoulders'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('front-deltoids')
      expect(result[0].muscles).toContain('back-deltoids')
    })

    it('maps "biceps" to the biceps highlighter id', () => {
      const result = buildModelData(['biceps'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('biceps')
    })

    it('maps "back" to both upper-back and lower-back', () => {
      const result = buildModelData(['back'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('upper-back')
      expect(result[0].muscles).toContain('lower-back')
    })

    it('maps "lats" to upper-back', () => {
      const result = buildModelData(['lats'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('upper-back')
    })

    it('maps "lower back" (two words) to lower-back', () => {
      const result = buildModelData(['lower back'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('lower-back')
    })

    it('maps "upper back" (two words) to upper-back', () => {
      const result = buildModelData(['upper back'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('upper-back')
    })
  })

  describe('Portuguese muscle names', () => {
    it('maps "peito" to chest', () => {
      const result = buildModelData(['peito'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
    })

    it('maps "ombros" to front-deltoids and back-deltoids', () => {
      const result = buildModelData(['ombros'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('front-deltoids')
      expect(result[0].muscles).toContain('back-deltoids')
    })

    it('maps "costas" to upper-back and lower-back', () => {
      const result = buildModelData(['costas'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('upper-back')
      expect(result[0].muscles).toContain('lower-back')
    })

    it('maps "abdominais" to abs', () => {
      const result = buildModelData(['abdominais'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('abs')
    })

    it('maps "panturrilha" to calves', () => {
      const result = buildModelData(['panturrilha'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('calves')
    })
  })

  describe('case-insensitive and whitespace-trimming behaviour', () => {
    it('accepts fully uppercased input: "CHEST"', () => {
      const result = buildModelData(['CHEST'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
    })

    it('accepts title-cased input: "Chest"', () => {
      const result = buildModelData(['Chest'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
    })

    it('trims surrounding whitespace: "  chest  "', () => {
      const result = buildModelData(['  chest  '])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
    })

    it('handles mixed case with whitespace: "  SHOULDERS  "', () => {
      const result = buildModelData(['  SHOULDERS  '])
      expect(result[0].muscles).toContain('front-deltoids')
      expect(result[0].muscles).toContain('back-deltoids')
    })
  })

  describe('unknown muscle name behaviour', () => {
    it('returns an empty array for a completely unknown name', () => {
      const result = buildModelData(['xyzunknown'])
      expect(result).toEqual([])
    })

    it('returns an empty array for an empty input list', () => {
      const result = buildModelData([])
      expect(result).toEqual([])
    })

    it('skips unknown names when mixed with known ones', () => {
      const result = buildModelData(['xyzunknown', 'chest'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
      expect(result[0].muscles).not.toContain('xyzunknown')
    })
  })

  describe('multiple muscle inputs', () => {
    it('collects the union of all mapped ids into a single model entry', () => {
      const result = buildModelData(['chest', 'biceps'])
      expect(result).toHaveLength(1)
      expect(result[0].muscles).toContain('chest')
      expect(result[0].muscles).toContain('biceps')
    })

    it('always names the single model entry "exercise"', () => {
      const result = buildModelData(['chest', 'biceps'])
      expect(result[0].name).toBe('exercise')
    })

    it('always assigns frequency 1 to the model entry', () => {
      const result = buildModelData(['chest', 'biceps'])
      expect(result[0].frequency).toBe(1)
    })
  })

  describe('deduplication (Set behaviour)', () => {
    // Both "lats" and "upper back" map to "upper-back".
    // The Set must ensure it only appears once in the output.
    it('deduplicates highlighter ids that appear in multiple input mappings', () => {
      const result = buildModelData(['lats', 'upper back'])
      expect(result).toHaveLength(1)
      const upperBackCount = result[0].muscles.filter((m: string) => m === 'upper-back').length
      expect(upperBackCount).toBe(1)
    })

    it('deduplicates when the same muscle name is passed twice', () => {
      const result = buildModelData(['chest', 'chest'])
      expect(result).toHaveLength(1)
      const chestCount = result[0].muscles.filter((m: string) => m === 'chest').length
      expect(chestCount).toBe(1)
    })
  })
})
