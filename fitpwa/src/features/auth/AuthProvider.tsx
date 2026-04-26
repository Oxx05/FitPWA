import React from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore, type Profile } from './authStore'
import { initializeOfflineSync, OfflineSyncService } from '@/shared/lib/offlineSync'

const PROFILE_COLUMNS = 'id,username,full_name,avatar_url,is_premium,premium_expires_at,level,xp_total,login_streak,last_login_date,daily_xp_earned,last_xp_date,default_rest_seconds,default_reps_min,default_reps_max,default_sets,sound_enabled,profile_visibility,total_volume_kg,social_likes_given'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, isLoading } = useAuthStore()

  const preFetchOfflineData = React.useCallback(async (userId: string) => {
    try {
      const { data: plans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)

      if (plans) {
        await OfflineSyncService.cachePlans(plans.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          exercises: p.exercises || [],
          difficulty: p.difficulty,
          updatedAt: p.updated_at || new Date().toISOString()
        })))
      }

      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')

      if (exercises) {
        await OfflineSyncService.cacheExercises(exercises.map(e => ({
          id: e.id,
          name: e.name,
          name_pt: e.name_pt,
          muscleGroups: e.muscle_groups || [],
          movementType: e.movement_type || '',
          equipment: e.equipment || [],
          difficulty: e.difficulty || ''
        })))
      }
    } catch (error) {
      console.warn('Failed to pre-fetch offline data:', error)
    }
  }, [])

  /**
   * Loads the profile for `userId`. If the profile row doesn't exist yet,
   * lazily inserts a minimal one so that subsequent queries succeed.
   * Returns the profile (or null on hard failure).
   */
  const fetchProfile = React.useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Profile fetch error:', error.message)
        // Don't trap user in onboarding because of a transient query failure —
        // hand them an empty-but-non-null profile so the app can still render.
        setProfile({
          id: userId,
          is_premium: false,
        } as Profile)
        return null
      }

      if (data) {
        setProfile({
          ...data,
          sound_enabled: data.sound_enabled ?? true,
          profile_visibility: data.profile_visibility ?? 'private',
          total_volume_kg: data.total_volume_kg ?? 0,
          social_likes_given: data.social_likes_given ?? 0,
        })
        return data as Profile
      }

      // No row yet — create one. This prevents new social-auth users (who
      // never went through register-page profile creation) from being blocked.
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select(PROFILE_COLUMNS)
        .maybeSingle()

      if (!insertError && inserted) {
        setProfile({
          ...inserted,
          sound_enabled: inserted.sound_enabled ?? true,
          profile_visibility: inserted.profile_visibility ?? 'private',
          total_volume_kg: inserted.total_volume_kg ?? 0,
          social_likes_given: inserted.social_likes_given ?? 0,
        })
        return inserted as Profile
      }

      console.warn('Profile insert failed:', insertError?.message)
      setProfile({ id: userId, is_premium: false } as Profile)
      return null
    } catch (e) {
      console.error(e)
      // Be safe — render with stub profile so guards behave predictably.
      setProfile({ id: userId, is_premium: false } as Profile)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setProfile])

  const handleStreak = React.useCallback(async (profile: Profile) => {
    const today = new Date().toISOString().split('T')[0]
    const lastLogin = profile.last_login_date ? profile.last_login_date.split('T')[0] : null

    if (lastLogin === today) return

    let newStreak = (profile.login_streak || 0)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastLogin === yesterdayStr) {
      newStreak += 1
    } else {
      newStreak = 1
    }

    const { error } = await supabase.from('profiles').update({
      login_streak: newStreak,
      last_login_date: new Date().toISOString()
    }).eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, login_streak: newStreak, last_login_date: new Date().toISOString() })
    } else {
      console.warn('Failed to update streak:', error.message)
    }
  }, [setProfile])

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        initializeOfflineSync(session.user.id)
        void preFetchOfflineData(session.user.id)
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
        initializeOfflineSync(session.user.id)
        void preFetchOfflineData(session.user.id)
        void fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, handleStreak, setLoading, setProfile, setSession, preFetchOfflineData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
