import React from 'react'
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
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isPremium: boolean
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  addXp: (amount: number) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isPremium: false,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user || null }),
  setProfile: (profile) => {
    const isPremium = !!profile?.is_premium && 
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date())
    set({ profile, isPremium })
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
    }).eq('id', profile.id).then()
  },
  setLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null, isPremium: false })
  }
}))


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, isLoading } = useAuthStore()

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          if (profile) handleStreak(profile)
        })
      } else {
        setLoading(false)
      }
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,is_premium,premium_expires_at,level,xp_total,login_streak,last_login_date')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setProfile(data)
        return data as Profile
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStreak = async (profile: Profile) => {
    const today = new Date().toISOString().split('T')[0]
    const lastLogin = profile.last_login_date ? profile.last_login_date.split('T')[0] : null
    
    if (lastLogin === today) return // Already updated today

    let newStreak = (profile.login_streak || 0)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastLogin === yesterdayStr) {
      newStreak += 1
    } else {
      newStreak = 1 // Reset streak if missed a day
    }

    await supabase.from('profiles').update({
      login_streak: newStreak,
      last_login_date: new Date().toISOString()
    }).eq('id', profile.id)
    
    setProfile({ ...profile, login_streak: newStreak, last_login_date: new Date().toISOString() })
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>
  }

  return <>{children}</>
}
