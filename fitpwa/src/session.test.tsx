import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ActiveSessionProvider, useActiveSession } from './features/session/ActiveSessionProvider'
import React from 'react'

// Mock Dexie DB
vi.mock('@/db/fitpwa.db', () => ({
  db: {
    activeSessions: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([])
        }))
      })),
      put: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true),
    },
    pendingSync: {
      add: vi.fn().mockResolvedValue(true)
    }
  }
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}))

// Mock AuthStore
const mockAddXp = vi.fn()
vi.mock('./features/auth/AuthProvider', () => ({
  useAuthStore: Object.assign(vi.fn(() => ({
    session: { user: { id: 'user-1' } },
    profile: { login_streak: 5 },
  })), {
    getState: vi.fn(() => ({
      session: { user: { id: 'user-1' } },
      profile: { login_streak: 5 },
      addXp: mockAddXp
    }))
  })
}))

// Mock AchievementsStore
vi.mock('./features/gamification/useAchievementsStore', () => ({
  useAchievementsStore: {
    getState: vi.fn(() => ({
      checkAchievements: vi.fn().mockResolvedValue([])
    }))
  }
}))

describe('Active Session Logic (useActiveSession)', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ActiveSessionProvider>{children}</ActiveSessionProvider>
  )

  it('should manage a session lifecycle correctly', async () => {
    const { result } = renderHook(() => useActiveSession(), { wrapper })

    // 1. Initial state should be null
    expect(result.current.activeSession).toBeNull()

    // 2. Start session
    await act(async () => {
      await result.current.startSession('plan-1', 'Test Plan')
    })

    expect(result.current.activeSession).not.toBeNull()
    expect(result.current.activeSession?.planName).toBe('Test Plan')

    // 3. End session
    await act(async () => {
      await result.current.endSession({ volume: 1000, exercisesCount: 5, setsCount: 15 })
    })

    expect(result.current.activeSession).toBeNull()
    expect(mockAddXp).toHaveBeenCalled()
  })
})
