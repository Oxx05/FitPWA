import React from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore, type Profile } from './authStore'
import { initializeOfflineSync, OfflineSyncService } from '@/shared/lib/offlineSync'

const PROFILE_COLUMNS = 'id,username,full_name,avatar_url,is_premium,premium_expires_at,level,xp_total,login_streak,last_login_date,daily_xp_earned,last_xp_date,default_rest_seconds,default_reps_min,default_reps_max,default_sets,sound_enabled,profile_visibility,total_volume_kg,social_likes_given'

/** Safe defaults so no component ever gets `undefined` from a stub/partial profile. */
function makeStubProfile(userId: string): Profile {
  return {
    id: userId,
    is_premium: false,
    level: 1,
    xp_total: 0,
    login_streak: 0,
    sound_enabled: true,
    profile_visibility: 'private',
    total_volume_kg: 0,
    social_likes_given: 0,
    default_rest_seconds: 90,
    default_reps_min: 8,
    default_reps_max: 12,
    default_sets: 3,
  }
}

/** Apply nullish defaults to a row fetched from the DB. */
function normalizeProfile(data: Record<string, unknown>, userId: string): Profile {
  return {
    ...(data as unknown as Profile),
    id: userId,
    sound_enabled: (data.sound_enabled as boolean | null) ?? true,
    profile_visibility: (data.profile_visibility as Profile['profile_visibility'] | null) ?? 'private',
    total_volume_kg: (data.total_volume_kg as number | null) ?? 0,
    social_likes_given: (data.social_likes_given as number | null) ?? 0,
    level: (data.level as number | null) ?? 1,
    xp_total: (data.xp_total as number | null) ?? 0,
    login_streak: (data.login_streak as number | null) ?? 0,
    default_rest_seconds: (data.default_rest_seconds as number | null) ?? 90,
    default_reps_min: (data.default_reps_min as number | null) ?? 8,
    default_reps_max: (data.default_reps_max as number | null) ?? 12,
    default_sets: (data.default_sets as number | null) ?? 3,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading, setProfileFetchFailed, isLoading } = useAuthStore()

  /**
   * Deduplicate concurrent fetches for the same user.
   * `onAuthStateChange` + `getSession` can both fire almost simultaneously;
   * we should only run one fetch at a time.
   */
  const fetchInProgressRef = React.useRef<string | null>(null)

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
   * Loads the profile for `userId`.
   * - On success: sets the full normalised profile.
   * - On network/DB error: sets a fully-defaulted stub and marks `profileFetchFailed`.
   *   ProtectedRoute uses this flag to avoid bouncing returning users to onboarding.
   * - On missing row: inserts a minimal row (new user, e.g. Google OAuth).
   */
  const fetchProfile = React.useCallback(async (userId: string): Promise<Profile | null> => {
    // Deduplicate: skip if a fetch for this user is already in-flight
    if (fetchInProgressRef.current === userId) return null
    fetchInProgressRef.current = userId

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Profile fetch error:', error.message)
        // Mark the failure so ProtectedRoute won't send returning users to onboarding
        setProfileFetchFailed(true)
        setProfile(makeStubProfile(userId))
        return null
      }

      if (data) {
        const profile = normalizeProfile(data as Record<string, unknown>, userId)
        setProfile(profile)
        setProfileFetchFailed(false)
        return profile
      }

      // No row yet — new user (e.g. Google OAuth). Create a minimal row.
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select(PROFILE_COLUMNS)
        .maybeSingle()

      if (!insertError && inserted) {
        const profile = normalizeProfile(inserted as Record<string, unknown>, userId)
        setProfile(profile)
        setProfileFetchFailed(false)
        return profile
      }

      console.warn('Profile insert failed:', insertError?.message)
      // Insert failed — set a stub but don't mark as fetch-failed (row might exist now)
      setProfile(makeStubProfile(userId))
      return null
    } catch (e) {
      console.error('fetchProfile unexpected error:', e)
      setProfileFetchFailed(true)
      setProfile(makeStubProfile(userId))
      return null
    } finally {
      fetchInProgressRef.current = null
      setLoading(false)
    }
  }, [setLoading, setProfile, setProfileFetchFailed])

  const handleStreak = React.useCallback(async (profile: Profile) => {
    // Only update streak for real profiles (not stubs — no full_name)
    if (!profile.full_name) return

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
        fetchProfile(session.user.id).then((profile) => {
          if (profile) void handleStreak(profile)
        })
      } else {
        setProfile(null)
        setProfileFetchFailed(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, handleStreak, setLoading, setProfile, setProfileFetchFailed, setSession, preFetchOfflineData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
