import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session, User } from '@supabase/supabase-js'
import { useAuthStore } from './features/auth/authStore'

// Mock Supabase client
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn(),
    })),
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

describe('Auth Store (useAuthStore)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Zustand state manually for each test
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isPremium: false,
      isLoading: true,
      pendingLevelUp: null
    })
  })

  it('should initialize with default values', () => {
    const state = useAuthStore.getState()
    expect(state.session).toBeNull()
    expect(state.profile).toBeNull()
    expect(state.isLoading).toBe(true)
  })

  it('should update profile and premium status correctly', () => {
    const mockProfile = {
      id: '123',
      full_name: 'Test User',
      is_premium: true,
      premium_expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    }

    useAuthStore.getState().setProfile(mockProfile)
    
    const state = useAuthStore.getState()
    expect(state.profile).toEqual(mockProfile)
    expect(state.isPremium).toBe(true)
  })

  it('should mark as non-premium if expired', () => {
    const mockProfile = {
      id: '123',
      is_premium: true,
      premium_expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    }

    useAuthStore.getState().setProfile(mockProfile)
    
    expect(useAuthStore.getState().isPremium).toBe(false)
  })

  it('should calculate XP and level up correctly', () => {
    const initialProfile = {
      id: '123',
      xp_total: 0,
      level: 1,
      is_premium: false
    }

    useAuthStore.setState({ profile: initialProfile })
    
    // Level 2 requires 100 XP (Math.floor(Math.sqrt(100/100)) + 1 = 2)
    useAuthStore.getState().addXp(150)
    
    const state = useAuthStore.getState()
    expect(state.profile?.xp_total).toBe(150)
    expect(state.profile?.level).toBe(2)
  })

  it('should handle signOut', async () => {
    const mockUser = { id: '123' } as User
    const mockSession = { user: mockUser } as Session
    useAuthStore.setState({ user: mockUser, session: mockSession })
    
    await useAuthStore.getState().signOut()
    
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.profile).toBeNull()
  })
})
