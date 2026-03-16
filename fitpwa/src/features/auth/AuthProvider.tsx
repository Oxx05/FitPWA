import React from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore, type Profile } from './authStore'
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, isLoading } = useAuthStore()

  const fetchProfile = React.useCallback(async (userId: string) => {
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
  }, [setLoading, setProfile])

  const handleStreak = React.useCallback(async (profile: Profile) => {
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
  }, [setProfile])

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then((profile) => {
          if (profile) void handleStreak(profile)
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
        void fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, handleStreak, setLoading, setProfile, setSession])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>
  }

  return <>{children}</>
}
