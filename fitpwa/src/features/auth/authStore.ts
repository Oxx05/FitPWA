import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabase'

export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  is_premium: boolean
  premium_expires_at?: string
  level?: number
  xp_total?: number
  login_streak?: number
  last_login_date?: string
  daily_xp_earned?: number
  last_xp_date?: string
  default_rest_seconds?: number
  default_reps_min?: number
  default_reps_max?: number
  default_sets?: number
  sound_enabled?: boolean
  total_volume_kg?: number
  social_likes_given?: number
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isPremium: boolean
  isLoading: boolean
  pendingLevelUp: number | null
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  addXp: (amount: number) => void
  clearPendingLevelUp: () => void
  setSoundEnabled: (enabled: boolean) => void
  addVolume: (amount: number) => void
  incrementSocialLikes: () => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isPremium: false,
  isLoading: true,
  pendingLevelUp: null,
  setSession: (session) => set({ session, user: session?.user || null }),
  setProfile: (profile) => {
    const previousLevel = get().profile?.level ?? null
    const nextLevel = profile?.level ?? null
    const pendingLevelUp = previousLevel !== null && nextLevel !== null && nextLevel > previousLevel
      ? nextLevel
      : null
    const isPremium = !!profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date())
    set({ profile, isPremium, pendingLevelUp })
  },
  setSoundEnabled: (enabled: boolean) => {
    const profile = get().profile
    if (!profile) return
    const updatedProfile = { ...profile, sound_enabled: enabled }
    set({ profile: updatedProfile })
    supabase.from('profiles').update({ sound_enabled: enabled }).eq('id', profile.id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update failed (missing column?):', error.message)
      })
  },
  addXp: (amount: number) => {
    const profile = get().profile
    if (!profile) return
    const newXp = (profile.xp_total || 0) + amount
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1
    const updatedProfile = { ...profile, xp_total: newXp, level: newLevel }
    get().setProfile(updatedProfile)

    // Update in Supabase
    supabase.from('profiles').update({
      xp_total: newXp,
      level: newLevel
    }).eq('id', profile.id).then(({ error }) => {
      if (error) console.warn('Supabase update failed:', error.message)
    })
  },
  addVolume: (amount: number) => {
    const profile = get().profile
    if (!profile) return
    const newVolume = (profile.total_volume_kg || 0) + amount
    const updatedProfile = { ...profile, total_volume_kg: newVolume }
    set({ profile: updatedProfile })
    supabase.from('profiles').update({ total_volume_kg: newVolume }).eq('id', profile.id)
      .then(({ error }) => {
        if (error) console.warn('Notice: total_volume_kg column might be missing in DB.', error.message)
      })
  },
  incrementSocialLikes: () => {
    const profile = get().profile
    if (!profile) return
    const newLikes = (profile.social_likes_given || 0) + 1
    const updatedProfile = { ...profile, social_likes_given: newLikes }
    set({ profile: updatedProfile })
    supabase.from('profiles').update({ social_likes_given: newLikes }).eq('id', profile.id)
      .then(({ error }) => {
        if (error) console.warn('Notice: social_likes_given column might be missing in DB.', error.message)
      })
  },
  setLoading: (isLoading) => set({ isLoading }),
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      get().setProfile(data)
    }
  },
  clearPendingLevelUp: () => set({ pendingLevelUp: null }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null, isPremium: false, pendingLevelUp: null })
  }
}))
