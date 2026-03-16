import { describe, it, expect } from 'vitest'
import { calculateLevel, getLevelProgress } from './shared/utils/gamification'

describe('Gamification Utilities', () => {
  describe('calculateLevel', () => {
    it('should stay at level 1 for < 100 XP', () => {
      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(99)).toBe(1)
    })

    it('should reach level 2 at 100 XP', () => {
      expect(calculateLevel(100)).toBe(2)
      expect(calculateLevel(399)).toBe(2)
    })

    it('should reach level 3 at 400 XP', () => {
      expect(calculateLevel(400)).toBe(3)
    })

    it('should reach level 11 at 10000 XP', () => {
      // sqrt(10000/100) + 1 = 10 + 1 = 11
      expect(calculateLevel(10000)).toBe(11)
    })
  })

  describe('getLevelProgress', () => {
    it('should return 0 progress at the start of a level', () => {
      expect(getLevelProgress(0)).toBe(0)
      expect(getLevelProgress(100)).toBe(0)
      expect(getLevelProgress(400)).toBe(0)
    })

    it('should calculate correct percentage for level 1', () => {
      // 0 to 100 range. 50 XP = 50%
      expect(getLevelProgress(50)).toBe(50)
    })

    it('should calculate correct percentage for level 2', () => {
      // Level 2 range: 100 to 400 (300 XP wide)
      // 250 XP is halfway through level 2 (150/300) = 50%
      expect(getLevelProgress(250)).toBe(50)
    })
  })
})
