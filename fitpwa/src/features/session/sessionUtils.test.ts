import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSetId, reindexSets } from './sessionUtils'

describe('sessionUtils', () => {
  describe('reindexSets', () => {
    it('reindexes set numbers sequentially', () => {
      const input = [
        { id: 'a', setNumber: 3 },
        { id: 'b', setNumber: 7 },
        { id: 'c', setNumber: 9 },
      ]
      const result = reindexSets(input)
      expect(result.map(s => s.setNumber)).toEqual([1, 2, 3])
      expect(result.map(s => s.id)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('createSetId', () => {
    const originalCrypto = (globalThis as { crypto?: Crypto }).crypto

    beforeEach(() => {
      ;(globalThis as { crypto?: Crypto }).crypto = {
        randomUUID: vi.fn()
          .mockReturnValueOnce('uuid-1')
          .mockReturnValueOnce('uuid-2')
      } as unknown as Crypto
    })

    afterEach(() => {
      ;(globalThis as { crypto?: Crypto }).crypto = originalCrypto
    })

    it('prefixes with exercise id and stays unique', () => {
      const first = createSetId('ex-1')
      const second = createSetId('ex-1')
      expect(first).toBe('ex-1-uuid-1')
      expect(second).toBe('ex-1-uuid-2')
    })
  })
})
