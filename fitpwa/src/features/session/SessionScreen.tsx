import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import { ChevronLeft, ChevronRight, Square, Play, Plus, Trash2, Clock, Zap, Loader2, Target, Pause, Minimize2, Search, StickyNote, TrendingUp, RotateCcw, Volume2, VolumeX, Save, AlertCircle, Dumbbell, X, Info, History, Calculator, Shuffle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { MuscleIcon } from '@/shared/components/MuscleIcon'
import { Modal } from '@/shared/components/Modal'
import { DebouncedNumericInput } from '@/shared/components/DebouncedNumericInput'
import { useVoiceGuide } from '@/shared/hooks/useVoiceGuide'
import { supabase } from '@/shared/lib/supabase'
import { calculateEstimated1RM } from '@/shared/lib/calculations'
import { OfflineSyncService } from '@/shared/lib/offlineSync'
import { useAuthStore } from '@/features/auth/authStore'
import { XP_PER_EXERCISE, XP_PER_SET, XP_PER_WORKOUT, XP_STREAK_MULTIPLIER } from '@/shared/utils/gamification'
import { motion, AnimatePresence } from 'framer-motion'
import { createSetId, reindexSets } from './sessionUtils'
import {
  clearSpotifyToken,
  exchangeSpotifyCode,
  getSpotifyNowPlaying,
  getSpotifyAuthUrl,
  getStoredSpotifyState,
  hasValidSpotifyToken,
  clearStoredSpotifyState,
  spotifyNext,
  spotifyPause,
  spotifyPlay,
  spotifyPrevious
} from '@/shared/lib/spotify'

interface SetRecord {
  id: string
  setNumber: number
  reps: number | null
  weight: number | null
  completed: boolean
  notes?: string
  rpe?: number
}

interface ExerciseInSession {
  id: string
  order: number
  exerciseId: string
  name: string
  name_pt?: string
  sets: SetRecord[]
  muscleGroups: string[]
  repsMin: number
  repsMax: number
  restSeconds: number
  planExerciseId?: string
  notes?: string
  gifUrl?: string | null
  tips?: string | null
}

export function SessionScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: planId } = useParams<{ id?: string }>()
  const { user, profile, addXp } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isPt = i18n.language === 'pt'

  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [hasStartedSession, setHasStartedSession] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restEndAt, setRestEndAt] = useState<number | null>(null)
  const [targetRestTimer, setTargetRestTimer] = useState<number>(90)
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [planName, setPlanName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'workout' | 'control'>('workout')
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(() => hasValidSpotifyToken())
  const [spotifyPlaying, setSpotifyPlaying] = useState<boolean | null>(null)
  const [spotifyTrack, setSpotifyTrack] = useState<{ name: string; artist: string; albumArt?: string } | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => profile?.sound_enabled !== false)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [availableExercises, setAvailableExercises] = useState<any[]>([])
  const [previousExerciseData, setPreviousExerciseData] = useState<{
    date: string;
    sets: { weight_kg: number; reps: number }[];
    notes: string | null;
  } | null>(null)
  
  const [isTimerMinimized, setIsTimerMinimized] = useState(false)
  const [recentRestTimes, setRecentRestTimes] = useState<number[]>([60, 90, 120])
  const [showSuspiciousModal, setShowSuspiciousModal] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  const [tipsExercise, setTipsExercise] = useState<ExerciseInSession | null>(null)
  const [focusSetIndex, setFocusSetIndex] = useState<number | null>(null)
  const [hasAutoRestStarted, setHasAutoRestStarted] = useState(false)
  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const [historySheetData, setHistorySheetData] = useState<{ date: string; sets: { weight_kg: number; reps: number }[] }[]>([])
  const [historySheetLoading, setHistorySheetLoading] = useState(false)
  const [showPlateMath, setShowPlateMath] = useState(false)
  const [plateMathWeight, setPlateMathWeight] = useState(0)
  const [barbellWeight, setBarbellWeight] = useState(20)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapSearchTerm, setSwapSearchTerm] = useState('')
  
  const { speak } = useVoiceGuide()

  // Effect to announce rest end or new exercise
  useEffect(() => {
    if (!voiceEnabled) return

    if (restTimer === 0) {
      speak(t('session.restFinished') + '. ' + t('session.restFinishedBody'))
    }
  }, [restTimer, voiceEnabled, speak])

  const handleAddInSessionExercise = async (exercise: any) => {
    const newEx: ExerciseInSession = {
      id: `ext-${Date.now()}`,
      order: currentExerciseIndex + 1,
      exerciseId: exercise.id,
      name: exercise.name,
      name_pt: exercise.name_pt,
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: createSetId(exercise.id),
        setNumber: i + 1,
        reps: 0,
        weight: 0,
        completed: false
      })),
      muscleGroups: exercise.muscle_groups || [],
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90
    }
    // Insert after current exercise instead of at end
    const newList = [...exercises]
    newList.splice(currentExerciseIndex + 1, 0, newEx)
    // Re-index order
    setExercises(newList.map((ex, idx) => ({ ...ex, order: idx })))
    setShowAddExerciseModal(false)
    showToast(`${newEx.name} ${t('session.setAdded').toLowerCase()}`, 'success')
  }

  const fetchAvailableExercises = async () => {
    const { data } = await supabase.from('exercises').select('id, name, name_pt, muscle_groups').order('name')
    if (data) setAvailableExercises(data)
  }

  useEffect(() => {
    if (showAddExerciseModal && availableExercises.length === 0) {
      fetchAvailableExercises()
    }
  }, [showAddExerciseModal])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const durationBaseRef = useRef(0)
  const durationStartRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationUpdatedAtRef = useRef<number | null>(null)

  const syncDuration = () => {
    if (!durationStartRef.current) return
    const elapsed = Math.floor((Date.now() - durationStartRef.current) / 1000)
    const next = durationBaseRef.current + Math.max(0, elapsed)
    setDuration(next)
    durationUpdatedAtRef.current = Date.now()
  }

  // Timer efeito (resiliente a background)
  useEffect(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    if (!isRunning) {
      if (durationStartRef.current) {
        const elapsed = Math.floor((Date.now() - durationStartRef.current) / 1000)
        const finalDuration = durationBaseRef.current + Math.max(0, elapsed)
        setDuration(finalDuration)
        durationBaseRef.current = finalDuration
        durationStartRef.current = null
      }
      return
    }

    durationBaseRef.current = duration
    durationStartRef.current = Date.now()
    durationUpdatedAtRef.current = Date.now()
    durationIntervalRef.current = setInterval(syncDuration, 1000)

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [isRunning])

  // Document Title Effect
  useEffect(() => {
    let title = 'RepTrack'
    if (restTimer !== null) {
      const status = isRestTimerRunning ? t('session.resting') : t('session.restPaused')
      title = `${status.toUpperCase()} ${formatTime(restTimer)} | RepTrack`
    } else if (isRunning && duration > 0) {
      title = `${formatTime(duration)} | RepTrack`
    } else if (!isRunning) {
      title = `(${t('session.pause')}) | RepTrack`
    }
    document.title = title
  }, [isRunning, duration, restTimer, isRestTimerRunning, t])

  // Persistent Active Session Effect
  useEffect(() => {
    if (exercises.length === 0) return
    const currentState = {
      exercises,
      currentExerciseIndex,
      duration,
      durationUpdatedAt: durationUpdatedAtRef.current,
      restTimer,
      restEndAt,
      targetRestTimer,
      isRestTimerRunning,
      hasAutoRestStarted,
      sessionNotes,
      planId,
      planName,
      isRunning
    }
    localStorage.setItem('titanpulse_active_session', JSON.stringify(currentState))
  }, [exercises, currentExerciseIndex, duration, restTimer, targetRestTimer, isRestTimerRunning, sessionNotes, planId, planName, isRunning])

  // Rest timer effet
  useEffect(() => {
    if (!isRestTimerRunning || !restEndAt) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000))
      setRestTimer(remaining)

      if (remaining <= 0) {
        setRestTimer(null)
        setRestEndAt(null)
        setIsRestTimerRunning(false)

        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate && profile?.sound_enabled !== false) {
          navigator.vibrate([200, 100, 200])
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(t('session.restFinished'), {
            body: t('session.restFinishedBody'),
            icon: '/logo.png'
          })
        }
        try {
          if (profile?.sound_enabled !== false) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
            audio.play().catch(() => {})
          }
        } catch { /* audio playback can fail silently on mobile */ }
      }

      if (voiceEnabled && remaining <= 3 && remaining > 0) {
        speak(remaining.toString())
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [restEndAt, isRestTimerRunning, t, profile?.sound_enabled, voiceEnabled, speak])

  // Load recent timers
  useEffect(() => {
    const saved = localStorage.getItem('titanpulse_recent_timers')
    if (saved) {
      try {
        setRecentRestTimes(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent timers:', e)
      }
    }
  }, [])

  const saveRecentTimer = (time: number) => {
    localStorage.setItem('titanpulse_last_rest_time', time.toString())
    setTargetRestTimer(time)
    setRecentRestTimes(prev => {
      const filtered = prev.filter(v => v !== time)
      const next = [time, ...filtered].slice(0, 3)
      localStorage.setItem('titanpulse_recent_timers', JSON.stringify(next))
      return next
    })
  }



  // Load plan data
  useEffect(() => {
    const loadPlanData = async () => {
      const prefillSets = async (exs: ExerciseInSession[]): Promise<ExerciseInSession[]> => {
        if (!user) return exs
        const ids = [...new Set(exs.map(e => e.exerciseId).filter(Boolean))]
        if (!ids.length) return exs
        try {
          const { data } = await supabase
            .from('session_sets')
            .select('exercise_id, weight_kg, reps, completed_at, session_id')
            .in('exercise_id', ids)
            .order('completed_at', { ascending: false })
            .limit(ids.length * 10)
          if (!data?.length) return exs
          const seenEx = new Set<string>()
          const lastSessId = new Map<string, string>()
          for (const r of data) {
            if (!seenEx.has(r.exercise_id)) {
              seenEx.add(r.exercise_id)
              lastSessId.set(r.exercise_id, r.session_id)
            }
          }
          const setsMap = new Map<string, { weight_kg: number; reps: number }[]>()
          for (const [eId, sId] of lastSessId) {
            setsMap.set(eId, data.filter((r: { exercise_id: string; session_id: string; weight_kg: number; reps: number }) => r.exercise_id === eId && r.session_id === sId).map((r: { weight_kg: number; reps: number }) => ({ weight_kg: r.weight_kg, reps: r.reps })))
          }
          return exs.map(ex => {
            const prev = setsMap.get(ex.exerciseId)
            if (!prev?.length) return ex
            return {
              ...ex,
              sets: ex.sets.map((s: SetRecord, i: number) => ({
                ...s,
                weight: prev[i]?.weight_kg ?? prev[0].weight_kg ?? s.weight,
                reps: prev[i]?.reps ?? prev[0].reps ?? s.reps,
              }))
            }
          })
        } catch { return exs }
      }

      try {
        const rawActiveSession = localStorage.getItem('titanpulse_active_session')
        if (rawActiveSession) {
          try {
            const activeSession = JSON.parse(rawActiveSession)
            // Resume conditions:
            //   1. Same plan id (mid-plan resume)
            //   2. Both sides are quick (`!planId` here + `'quick'` saved)
            //   3. The user landed on the bare `/session` URL — that's the
            //      "Resume" CTA from the dashboard banner, so we should pick
            //      up whatever session is in storage regardless of its plan id.
            const isResumeFromBanner = !planId && location.pathname === '/session'
            const sameContext =
              activeSession.planId === planId ||
              (!planId && activeSession.planId === 'quick') ||
              isResumeFromBanner
            if (sameContext) {
              setExercises(activeSession.exercises)
              setCurrentExerciseIndex(activeSession.currentExerciseIndex || 0)
              const savedDuration = activeSession.duration || 0
              const savedDurationUpdatedAt = activeSession.durationUpdatedAt || Date.now()
              const catchUpSeconds = activeSession.isRunning
                ? Math.max(0, Math.floor((Date.now() - savedDurationUpdatedAt) / 1000))
                : 0
              const nextDuration = savedDuration + catchUpSeconds
              setDuration(nextDuration)
              durationBaseRef.current = nextDuration
              durationStartRef.current = activeSession.isRunning ? Date.now() : null
              durationUpdatedAtRef.current = Date.now()

              const savedRestEndAt = activeSession.restEndAt as number | undefined
              const recoveredRestEndAt = savedRestEndAt && savedRestEndAt > Date.now()
                ? savedRestEndAt
                : null
              const recoveredRestTimer = recoveredRestEndAt
                ? Math.max(0, Math.ceil((recoveredRestEndAt - Date.now()) / 1000))
                : (activeSession.restTimer || null)

              setRestEndAt(recoveredRestEndAt)
              setRestTimer(recoveredRestTimer)
              setTargetRestTimer(activeSession.targetRestTimer || recoveredRestTimer || 90)
              setIsRestTimerRunning(!!recoveredRestEndAt)
              setHasAutoRestStarted(!!activeSession.hasAutoRestStarted)
              setSessionNotes(activeSession.sessionNotes || '')
              setPlanName(activeSession.planName || null)
              if (activeSession.isRunning !== undefined) {
                setIsRunning(activeSession.isRunning)
              }
              setHasStartedSession(true)
              setIsLoading(false)
              return
            } else {
              // DIFFERENT session is active!
              setError(t('session.anotherActiveSession'))
              setIsLoading(false)
              return
            }
          } catch (e) { console.error('Error recovering active session:', e) }
        }

        if (!planId) {
          // Handle Quick Workout
          const quickData = localStorage.getItem('quickWorkout')
          if (!quickData) throw new Error('No workout data found')
          
          const workout = JSON.parse(quickData)
          setPlanName(workout.title || t('session.quickWorkout'))
          
          const exerciseIds = workout.exercises.map((ex: any) => ex.exerciseId)
          const { data: exerciseDetails, error: exError } = await supabase
            .from('exercises')
            .select('id, name, name_pt, muscle_groups, gif_url, tips')
            .in('id', exerciseIds)
            
          if (exError) throw exError
          
          const exerciseMap = new Map(exerciseDetails.map(ex => [ex.id, ex]))
          
          const sessionExercises = workout.exercises.map((ex: any, idx: number) => {
            const detail = exerciseMap.get(ex.exerciseId)
            return {
              id: `${ex.exerciseId}-${idx}`,
              order: idx,
              exerciseId: ex.exerciseId,
              name: detail?.name || t('common.exercise'),
              name_pt: detail?.name_pt,
              sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
                id: createSetId(ex.exerciseId),
                setNumber: i + 1,
                reps: 0,
                weight: ex.weight || 0,
                completed: false
              })),
              muscleGroups: detail?.muscle_groups || [],
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: '',
              gifUrl: detail?.gif_url || null,
              tips: detail?.tips || null,
            }
          })
          
          setExercises(await prefillSets(sessionExercises))
          setIsLoading(false)
          return
        }

        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('id, name')
          .eq('id', planId)
          .maybeSingle()

        if (planError) throw planError
        setPlanName(planData?.name ?? null)

        // Load profile XP stats for the daily cap
        const today = new Date().toISOString().split('T')[0]
        if (profile?.last_xp_date !== today) {
          // Reset daily XP if it's a new day
          await supabase.from('profiles').update({ daily_xp_earned: 0, last_xp_date: today }).eq('id', user?.id)
        }

        // Load exercises via the correct junction table
        const { data: planExercises, error: peError } = await supabase
          .from('plan_exercises')
          .select(`
            id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg, notes,
            exercises ( id, name, name_pt, muscle_groups, gif_url, tips )
          `)
          .eq('plan_id', planId)
          .order('order_index', { ascending: true })

        if (peError) throw peError

        // Transform to session format
        const sessionExercises = (planExercises || []).map((pe: Record<string, unknown>, idx: number) => {
          const ex = pe.exercises as Record<string, unknown> | null
          return {
            id: pe.id as string,
            order: idx,
            exerciseId: ex?.id as string ?? '',
            name: (ex?.name as string) || t('common.exercise'),
            name_pt: ex?.name_pt as string,
            sets: Array.from({ length: (pe.sets as number) || profile?.default_sets || 3 }, (_, i) => ({
              id: createSetId(pe.id as string),
              setNumber: i + 1,
              reps: 0,
              weight: (pe.weight_kg as number) || 0,
              completed: false,
              notes: ''
            })),
            muscleGroups: (ex?.muscle_groups as string[]) || [],
            repsMin: (pe.reps_min as number) || profile?.default_reps_min || 8,
            repsMax: (pe.reps_max as number) || profile?.default_reps_max || 12,
            restSeconds: (pe.rest_seconds as number) || profile?.default_rest_seconds || 90,
            planExerciseId: pe.id as string,
            notes: (pe.notes as string) || '',
            gifUrl: (ex?.gif_url as string) || null,
            tips: (ex?.tips as string) || null,
          }
        })

        setExercises(await prefillSets(sessionExercises))
      } catch (error) {
        console.error('Failed to load plan:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlanData()
  }, [planId, user?.id, profile?.default_sets, profile?.default_reps_min, profile?.default_reps_max, profile?.default_rest_seconds, profile?.last_xp_date])

  // Fetch previous experience for the current exercise
  useEffect(() => {
    const fetchPreviousData = async () => {
      if (!user || exercises.length === 0) return
      
      const currentEx = exercises[currentExerciseIndex]
      if (!currentEx) return

      try {
        // Find the last session that included this exercise
        const { data: lastSet, error } = await supabase
          .from('session_sets')
          .select(`
            weight_kg,
            reps,
            completed_at,
            session_id
          `)
          .eq('exercise_id', currentEx.exerciseId)
          .order('completed_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (lastSet && lastSet.length > 0) {
          // Get the most recent session's sets
          const lastSessionId = lastSet[0].session_id
          const sessionSets = lastSet
            .filter(s => s.session_id === lastSessionId)
            .map(s => ({
              weight_kg: s.weight_kg,
              reps: s.reps
            }))
            .reverse() // Keep original order if possible

          setPreviousExerciseData({
            date: lastSet[0].completed_at,
            sets: sessionSets,
            notes: null // We don't fetch notes from session_sets anymore to avoid complex joins
          })
        } else {
          setPreviousExerciseData(null)
        }
      } catch (err) {
        console.error('Error fetching previous data:', err)
      }
    }

    fetchPreviousData()
    setFocusSetIndex(null) // reset set cursor when exercise changes
  }, [currentExerciseIndex, exercises, user])

  useEffect(() => {
    if (!spotifyConnected) return
    let active = true
    const loadNowPlaying = async () => {
      const now = await getSpotifyNowPlaying()
      if (!active) return
      if (!now) {
        setSpotifyPlaying(false)
        setSpotifyTrack(null)
        return
      }
      setSpotifyPlaying(now.isPlaying)
      setSpotifyTrack({
        name: now.trackName,
        artist: now.artistName,
        albumArt: now.albumArtUrl
      })
    }
    void loadNowPlaying()
    const timer = setInterval(loadNowPlaying, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [spotifyConnected])

  // Handle Spotify OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const storedState = getStoredSpotifyState()
    if (!code || !state || state !== storedState) return

    const redirectUri = window.location.origin + '/session'
    exchangeSpotifyCode(code, redirectUri).then((token) => {
      if (token) {
        setSpotifyConnected(true)
        showToast(t('session.spotifyConnected'), 'success')
      } else {
        showToast(t('session.spotifyError'), 'error')
      }
      clearStoredSpotifyState()
      const returnPath = sessionStorage.getItem('titanpulse.spotify.returnPath')
      sessionStorage.removeItem('titanpulse.spotify.returnPath')
      const nextPath = returnPath || window.location.pathname
      navigate(nextPath, { replace: true })
    }).catch(() => {
      showToast(t('session.spotifyError'), 'error')
      clearStoredSpotifyState()
    })
  }, [navigate])

  const currentExercise = exercises[currentExerciseIndex]

  useEffect(() => {
    if (!currentExercise) return
    const preferred = currentExercise.restSeconds ?? profile?.default_rest_seconds
    if (typeof preferred === 'number' && Number.isFinite(preferred)) {
      setTargetRestTimer(preferred)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (isRunning) {
        syncDuration()
      }
      if (isRestTimerRunning && restEndAt) {
        const remaining = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000))
        setRestTimer(remaining)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning, isRestTimerRunning, restEndAt])

  // Effect to announce new exercise (moved after currentExercise declaration)
  useEffect(() => {
    if (!voiceEnabled || !currentExercise || !hasStartedSession) return
    const msg = isPt
      ? `Próximo exercício: ${currentExercise.name_pt || currentExercise.name}. Objetivo: ${currentExercise.repsMin} a ${currentExercise.repsMax} repetições.`
      : `Next exercise: ${currentExercise.name}. Goal: ${currentExercise.repsMin} to ${currentExercise.repsMax} reps.`
    speak(msg)
  }, [currentExerciseIndex, voiceEnabled, speak, currentExercise, isPt, hasStartedSession])

  const completedVolume = exercises.reduce((acc, ex) =>
    acc + ex.sets.reduce((setAcc, set) =>
      set.completed ? setAcc + ((set.weight || 0) * (set.reps || 0)) : setAcc, 0), 0)
  const completedSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)
  const isBottomOverlayActive = isFocusMode

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`
  }

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const handleExerciseNotesChange = async (val: string) => {
    setExercises(prev => prev.map((ex, idx) =>
      idx === currentExerciseIndex ? { ...ex, notes: val } : ex
    ))

    // Persist to DB if it's a plan exercise
    const ex = exercises[currentExerciseIndex]
    if (ex?.planExerciseId) {
      try {
        await supabase
          .from('plan_exercises')
          .update({ notes: val })
          .eq('id', ex.planExerciseId)
      } catch (e) {
        console.error('Error saving exercise notes:', e)
      }
    }
  }

  const handleSetChange = (setId: string, field: 'weight' | 'reps', value: number | string | null) => {
    setExercises(prev => prev.map(ex => ({
      ...ex,
      sets: ex.sets.map(set =>
        set.id === setId
          ? { ...set, [field]: value }
          : set
      )
    })))
  }

  const handleCompleteSet = (setId: string) => {
    let shouldStartRest = false
    let nextRestTime: number | null = null

    setExercises(prev => prev.map((ex, idx) => {
      const isActive = idx === currentExerciseIndex
      const nextSets = ex.sets.map(set => {
        if (set.id !== setId) return set
        const nextCompleted = !set.completed
        if (nextCompleted && isActive) {
          shouldStartRest = true
          const lastRest = localStorage.getItem('titanpulse_last_rest_time')
          const parsedLast = lastRest ? parseInt(lastRest) : null
          const preferred = hasAutoRestStarted
            ? (parsedLast ?? profile?.default_rest_seconds ?? ex.restSeconds ?? 90)
            : (profile?.default_rest_seconds ?? ex.restSeconds ?? 90)
          nextRestTime = (typeof preferred === 'number' && Number.isFinite(preferred)) ? preferred : 90
        }
        return { ...set, completed: nextCompleted }
      })

      return { ...ex, sets: nextSets }
    }))

    if (!shouldStartRest) return
    const restTime = nextRestTime ?? 90
    if ('vibrate' in navigator && profile?.sound_enabled !== false) navigator.vibrate(50)
    if (isRestTimerRunning && restEndAt && restTimer && restTimer > 0) {
      showToast(t('session.setCompletedSuccess'), 'success')
      return
    }

    localStorage.setItem('titanpulse_last_rest_time', restTime.toString())
    if (!hasAutoRestStarted) setHasAutoRestStarted(true)
    setTargetRestTimer(restTime)
    setRestTimer(restTime)
    setRestEndAt(Date.now() + restTime * 1000)
    setIsRestTimerRunning(true)
    // Bottom sheet é opt-in: o utilizador abre clicando no timer do header
    showToast(t('session.setCompletedSuccess'), 'success')
  }

  const handleCopyPreviousSet = (setId: string) => {
    setExercises(prev => prev.map(ex => ({
      ...ex,
      sets: ex.sets.map((set, idx, arr) => {
        if (set.id !== setId) return set
        const prevSet = arr[idx - 1]
        if (!prevSet) return set
        return {
          ...set,
          weight: prevSet.weight,
          reps: prevSet.reps
        }
      })
    })))
    showToast(t('session.copySetSuccess'), 'success')
  }

  const calculatePlates = (totalKg: number, barbell: number): { plate: number; count: number }[] => {
    const plateSizes = [25, 20, 15, 10, 5, 2.5, 1.25]
    let remaining = Math.max(0, Math.round((totalKg - barbell) / 2 * 100) / 100)
    const result: { plate: number; count: number }[] = []
    for (const plate of plateSizes) {
      if (remaining < 0.01) break
      const count = Math.floor(Math.round(remaining / plate * 1000) / 1000)
      if (count > 0) {
        result.push({ plate, count })
        remaining = Math.round((remaining - count * plate) * 100) / 100
      }
    }
    return result
  }

  const openExerciseHistory = async (exerciseId: string) => {
    if (!user) return
    setShowHistorySheet(true)
    setHistorySheetLoading(true)
    try {
      const { data } = await supabase
        .from('session_sets')
        .select('weight_kg, reps, completed_at, session_id')
        .eq('exercise_id', exerciseId)
        .order('completed_at', { ascending: false })
        .limit(30)

      if (!data || data.length === 0) {
        setHistorySheetData([])
        return
      }

      const sessions: { date: string; sets: { weight_kg: number; reps: number }[] }[] = []
      const seenSessions = new Set<string>()

      for (const row of data) {
        if (!seenSessions.has(row.session_id)) {
          seenSessions.add(row.session_id)
          const sessionSets = data
            .filter((r: { session_id: string; weight_kg: number; reps: number }) => r.session_id === row.session_id)
            .map((r: { weight_kg: number; reps: number }) => ({ weight_kg: r.weight_kg, reps: r.reps }))
          sessions.push({ date: row.completed_at, sets: sessionSets })
          if (sessions.length >= 3) break
        }
      }

      setHistorySheetData(sessions)
    } catch {
      setHistorySheetData([])
    } finally {
      setHistorySheetLoading(false)
    }
  }

  const handleSwapExercise = async (exercise: { id: string; name: string; name_pt?: string; muscle_groups?: string[] }) => {
    const { data: detail } = await supabase
      .from('exercises')
      .select('id, name, name_pt, muscle_groups, gif_url, tips')
      .eq('id', exercise.id)
      .maybeSingle()

    setExercises(prev => prev.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex
      return {
        ...ex,
        exerciseId: exercise.id,
        name: detail?.name || exercise.name,
        name_pt: detail?.name_pt || exercise.name_pt,
        muscleGroups: detail?.muscle_groups || exercise.muscle_groups || [],
        gifUrl: detail?.gif_url || null,
        tips: detail?.tips || null,
      }
    }))
    setShowSwapModal(false)
    setSwapSearchTerm('')
    setPreviousExerciseData(null)
    showToast(t('session.swapSuccess'), 'success')
  }

  const handleApplyLastSet = (setId: string, setIdx: number) => {
    if (!previousExerciseData?.sets[setIdx]) return
    const lastSet = previousExerciseData.sets[setIdx]
    setExercises(exs => exs.map(ex => ({
      ...ex,
      sets: ex.sets.map(set =>
        set.id === setId
          ? { ...set, weight: lastSet.weight_kg, reps: lastSet.reps }
          : set
      )
    })))
    showToast(t('session.applyLastSuccess'), 'success')
  }

  const handleAddSet = () => {
    if (!currentExercise) return
    setExercises(prev => prev.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex
      const lastSet = ex.sets[ex.sets.length - 1]
      return {
        ...ex,
        sets: reindexSets([
          ...ex.sets,
          {
            id: createSetId(ex.id),
            setNumber: ex.sets.length + 1,
            reps: lastSet?.reps ?? 0,
            weight: lastSet?.weight ?? 0,
            completed: false
          }
        ])
      }
    }))
    showToast(t('session.setAdded'), 'info')
  }

  const handleRemoveSet = (setId: string) => {
    let nextLength = 0
    setExercises(prev => prev.map((ex, idx) => {
      if (idx !== currentExerciseIndex) return ex
      const nextSets = reindexSets(
        ex.sets.filter(s => s.id !== setId)
      )
      nextLength = nextSets.length
      return { ...ex, sets: nextSets }
    }))
    setFocusSetIndex(prev => {
      if (prev === null) return prev
      if (nextLength === 0) return null
      return Math.min(prev, nextLength - 1)
    })
    showToast(t('session.setRemoved'), 'info')
  }

  const finishWorkout = async (force?: boolean) => {
    try {
      setIsRunning(false)

      // Calculate stats
      const totalVolume = exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((setAcc, set) =>
          set.completed ? setAcc + ((set.weight || 0) * (set.reps || 0)) : setAcc, 0), 0)

      const stats = {
        volume: totalVolume,
        exercisesCount: exercises.filter(ex => ex.sets.some(s => s.completed)).length,
        setsCount: exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0),
        duration
      }

      const streakBonus = profile?.login_streak
        ? Math.min(1 + ((profile.login_streak - 1) * (XP_STREAK_MULTIPLIER - 1)), 1.5)
        : 1
      
      // ANTI-CHEAT LOGIC
      // 1. Minimum duration: 5 minutes (300s)
      // 2. Minimum sets: 3
      // 3. XP Cap per workout: 500
      // 4. Daily XP Cap: 1500 (handled via DB)
      
      let xpGained = 0
      if (stats.duration >= 300 && stats.setsCount >= 3) {
        xpGained = Math.round(
          (XP_PER_WORKOUT + (stats.exercisesCount * XP_PER_EXERCISE) + (stats.setsCount * XP_PER_SET)) * streakBonus
        )
      } else {
        // Partial XP for short workouts? Let's be strict as requested.
        xpGained = Math.round((stats.setsCount * XP_PER_SET) * streakBonus)
      }

      // Cap at 500 XP
      xpGained = Math.min(xpGained, 500)

      // EXTRA ANTI-CHEAT: Check for suspicious values
      const isSuspiciousValue = exercises.some(ex => 
        ex.sets.some(s => s.completed && ((s.reps || 0) > 60 || (s.weight || 0) > 500))
      ) || (stats.setsCount > 10 && stats.duration < 300)

      if (isSuspiciousValue && !showSuspiciousModal && !force) {
        setShowSuspiciousModal(true)
        return
      }

      if (isSuspiciousValue) {
        xpGained = Math.min(xpGained, 10)
      }

      // Daily cap check
      const dailyXpLimit = 1500
      const remainingDailyXp = Math.max(0, dailyXpLimit - (profile?.daily_xp_earned || 0))
      xpGained = Math.min(xpGained, remainingDailyXp)

      if (user?.id) {
        const workoutId = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)
        const exerciseNameMap = new Map(exercises.map(ex => [ex.exerciseId, ex.name]))
        const completedExercises = exercises
          .map(ex => ({
            exerciseId: ex.exerciseId,
            setsCompleted: ex.sets.filter(s => s.completed).length,
            durationSeconds: duration
          }))
          .filter(ex => ex.setsCompleted > 0)

        const completedSets = exercises.flatMap(ex =>
          ex.sets
            .filter(s => s.completed)
            .map(s => ({
              exerciseId: ex.exerciseId,
              exerciseName: ex.name,
              setNumber: s.setNumber,
              reps: s.reps,
              weight: s.weight,
              notes: s.notes || null
            }))
        )

        const bestSets = exercises.map(ex => {
          const best = ex.sets
            .filter(s => s.completed && s.weight !== null && s.reps !== null)
            .sort((a, b) => ((b.weight ?? 0) * (b.reps ?? 0)) - ((a.weight ?? 0) * (a.reps ?? 0)))[0]
          return {
            exerciseId: ex.exerciseId,
            weight: best?.weight ?? null,
            reps: best?.reps ?? null
          }
        }).filter(b => b.weight !== null && b.reps !== null)

        const newPrs: Array<{ exerciseName: string; weight: number; reps: number; oneRepMax: number; exerciseId: string }> = []

        try {
          if (navigator.onLine) {
            const { data: sessionRow, error: sessionError } = await supabase
              .from('workout_sessions')
              .insert({
                user_id: user.id,
                plan_id: planId || null,
                plan_name: planName,
                duration_seconds: duration,
                total_volume_kg: totalVolume,
                notes: sessionNotes || null,
                finished_at: new Date().toISOString(),
                xp_earned: xpGained
              })
              .select('id')
              .maybeSingle()

            if (sessionError) throw sessionError

            if (completedSets.length > 0 && sessionRow) {
              await supabase.from('session_sets').insert(
                completedSets.map(s => ({
                  session_id: sessionRow.id,
                  exercise_id: s.exerciseId,
                  exercise_name: s.exerciseName,
                  set_number: s.setNumber,
                  reps: s.reps,
                  weight_kg: s.weight,
                  notes: s.notes
                }))
              )
            }

            if (completedExercises.length > 0) {
              await supabase.from('workout_history').insert(
                completedExercises.map(ex => ({
                  user_id: user.id,
                  plan_id: planId || null,
                  exercise_id: ex.exerciseId,
                  sets_completed: ex.setsCompleted,
                  duration_seconds: ex.durationSeconds,
                  created_at: new Date().toISOString()
                }))
              )
            }

            if (bestSets.length > 0) {
              const exerciseIds = bestSets.map(b => b.exerciseId)
              const { data: existing } = await supabase
                .from('personal_records')
                .select('exercise_id, weight_kg, reps, one_rep_max')
                .eq('user_id', user.id)
                .in('exercise_id', exerciseIds)

              const existingMap = new Map(
                (existing || []).map(pr => [pr.exercise_id as string, pr])
              )

              const toUpsert = bestSets
                .map(b => {
                  const oneRepMax = calculateEstimated1RM(b.weight, b.reps)
                  const current = existingMap.get(b.exerciseId)
                  
                  // Calculate existing ORM safely
                  const currentOrm = current?.one_rep_max || calculateEstimated1RM(current?.weight_kg || 0, current?.reps || 0)
                  
                  if (oneRepMax <= currentOrm) return null
                  
                  newPrs.push({
                    exerciseName: exerciseNameMap.get(b.exerciseId) || t('common.exercise'),
                    weight: b.weight ?? 0,
                    reps: b.reps ?? 0,
                    oneRepMax,
                    exerciseId: b.exerciseId
                  })
                  return {
                    user_id: user.id,
                    exercise_id: b.exerciseId,
                    weight_kg: b.weight,
                    reps: b.reps,
                    one_rep_max: oneRepMax,
                    achieved_at: new Date().toISOString()
                  }
                })
                .filter(Boolean)

              if (toUpsert.length > 0) {
                await supabase.from('personal_records').upsert(toUpsert)
                await supabase.from('personal_record_history').insert(
                  newPrs.map(pr => ({
                    user_id: user.id,
                    exercise_id: pr.exerciseId,
                    weight_kg: pr.weight,
                    reps: pr.reps,
                    one_rep_max: pr.oneRepMax,
                    achieved_at: new Date().toISOString()
                  }))
                )
                
                // CELEBRATION! 🎉
                confetti({
                  particleCount: 200,
                  spread: 100,
                  origin: { y: 0.6 },
                  colors: ['#00ff87', '#ffffff', '#00e5ff'],
                  scalar: 1.2,
                  gravity: 0.8
                })
                // Secondary burst for PR
                setTimeout(() => {
                  confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#00ff87', '#00e5ff']
                  })
                  confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#00ff87', '#00e5ff']
                  })
                }, 250)
              }
            }
            showToast(t('session.workoutSavedCloud'), 'success')
          } else {
            // New Robust Offline Saving
            await OfflineSyncService.saveSessionOffline(
              {
                sessionId: workoutId,
                userId: user.id,
                planId: planId || undefined,
                planName: planName || undefined,
                durationSeconds: duration,
                totalVolumeKg: totalVolume,
                notes: sessionNotes || undefined,
                finishedAt: new Date().toISOString(),
                synced: false
              },
              completedSets.map(s => ({
                sessionId: workoutId,
                exerciseId: s.exerciseId,
                exerciseName: s.exerciseName,
                setNumber: s.setNumber,
                reps: s.reps,
                weightKg: s.weight,
                notes: s.notes || undefined,
                synced: false
              }))
            )
            
            // Save PRs offline too
            for (const pr of newPrs) {
              await OfflineSyncService.savePROffline({
                prId: crypto.randomUUID(),
                userId: user.id,
                exerciseId: pr.exerciseId,
                weightKg: pr.weight,
                reps: pr.reps,
                oneRepMax: pr.oneRepMax,
                dateSet: new Date().toISOString(),
                synced: false
              })
            }

            showToast(t('session.workoutSavedOffline'), 'info')
          }
        } catch (saveError) {
          console.error('Error saving workout:', saveError)
          // Fallback to offline even on error
          await OfflineSyncService.saveSessionOffline(
            {
              sessionId: workoutId,
              userId: user.id,
              planId: planId || undefined,
              planName: planName || undefined,
              durationSeconds: duration,
              totalVolumeKg: totalVolume,
              notes: sessionNotes || undefined,
              finishedAt: new Date().toISOString(),
              synced: false
            },
            completedSets.map(s => ({
              sessionId: workoutId,
              exerciseId: s.exerciseId,
              exerciseName: s.exerciseName,
              setNumber: s.setNumber,
              reps: s.reps,
              weightKg: s.weight,
              notes: s.notes || undefined,
              synced: false
            }))
          )
          showToast(t('session.workoutSavedOfflineFallback'), 'info')
        }
        
        // Update daily XP in profile
        if (xpGained > 0) {
          await supabase
            .from('profiles')
            .update({ 
              daily_xp_earned: (profile?.daily_xp_earned || 0) + xpGained,
              xp_total: (profile?.xp_total || 0) + xpGained 
            })
            .eq('id', user.id)
        }

        addXp(xpGained)
        localStorage.removeItem('titanpulse_active_session')
        navigate('/session/summary', { state: { stats, duration, xpGained, newPrs, exercises } })
        return
      }

      localStorage.removeItem('titanpulse_active_session')
      navigate('/session/summary', { state: { stats, duration, xpGained, exercises } })
    } catch (error) {
      console.error('Error finishing workout:', error)
      // Ensure the active-session breadcrumb in localStorage is cleared even
      // if the Supabase save failed — otherwise the dashboard banner and the
      // /session route guard will show a stale "active session" indefinitely.
      try { localStorage.removeItem('titanpulse_active_session') } catch { /* noop */ }
      showToast(t('session.workoutSaveError'), 'error')
    }
  }

  const handleSpotifyConnect = async () => {
    const redirectUri = window.location.origin + '/session'
    const authUrl = await getSpotifyAuthUrl(redirectUri)
    if (!authUrl) {
      showToast(t('session.spotifyConfigError'), 'error')
      return
    }
    sessionStorage.setItem('titanpulse.spotify.returnPath', window.location.pathname)
    window.location.href = authUrl
  }

  const handleSpotifyDisconnect = () => {
    clearSpotifyToken()
    setSpotifyConnected(false)
    showToast(t('session.spotifyDisconnected'), 'info')
  }

  const handleSpotifyPlayPause = async () => {
    try {
      if (spotifyPlaying) {
        await spotifyPause()
        setSpotifyPlaying(false)
      } else {
        await spotifyPlay()
        setSpotifyPlaying(true)
      }
    } catch {
      showToast(t('session.spotifyControlError'), 'error')
    }
  }

  const handleSpotifyNext = async () => {
    try {
      await spotifyNext()
      const now = await getSpotifyNowPlaying()
      if (now) {
        setSpotifyTrack({ name: now.trackName, artist: now.artistName, albumArt: now.albumArtUrl })
        setSpotifyPlaying(now.isPlaying)
      }
    } catch {
      showToast(t('session.spotifyNextError'), 'error')
    }
  }

  const handleSpotifyPrev = async () => {
    try {
      await spotifyPrevious()
      const now = await getSpotifyNowPlaying()
      if (now) {
        setSpotifyTrack({ name: now.trackName, artist: now.artistName, albumArt: now.albumArtUrl })
        setSpotifyPlaying(now.isPlaying)
      }
    } catch {
      showToast(t('session.spotifyPrevError'), 'error')
    }
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6 border border-error/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{t('common.error')}</h1>
        <p className="text-gray-400 mb-8 max-w-sm">{error}</p>
        <Button onClick={() => navigate('/workouts')} variant="primary" className="px-12 h-14 rounded-xl font-black uppercase italic shadow-lg shadow-primary/20">
          <ChevronLeft className="w-5 h-5 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-2">{t('session.noExercises')}</h1>
        <p className="text-gray-400 mb-4">{t('session.noExercisesDesc')}</p>
        <Button onClick={() => navigate('/workouts')} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
      </div>
    )
  }

  if (!hasStartedSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-8 border-4 border-primary shadow-[0_0_30px_rgba(var(--color-primary),0.3)]">
          <Dumbbell className="w-12 h-12 rotate-[-45deg]" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">{planName || t('session.workout')}</h1>
        <p className="text-gray-400 mb-12 max-w-sm text-lg">
          {exercises.length} {t('session.exercises')} • ~{exercises.reduce((acc, ex) => acc + (ex.sets.length * 2), 0)} min
        </p>
        <Button 
          onClick={() => {
            setHasStartedSession(true)
            setIsRunning(true)
          }} 
          variant="primary" 
          className="w-full max-w-xs h-16 rounded-3xl font-black uppercase italic tracking-widest text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          {t('common.start')}
        </Button>
        <Button 
          onClick={() => navigate('/workouts')} 
          variant="ghost" 
          className="mt-6 text-gray-500 hover:text-white font-bold uppercase tracking-widest text-sm"
        >
          {t('common.cancel')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-200/90 backdrop-blur border-b border-surface-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-white text-lg truncate">{t('session.activeSession')}</h1>
            <p className="text-sm text-gray-400">{currentExerciseIndex + 1} / {exercises.length}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right flex items-center gap-2">
              {restTimer !== null && (
                <div
                  onClick={() => { setShowRestTimer(true); setIsTimerMinimized(false) }}
                  className="bg-primary/20 px-2 py-1 rounded border border-primary/30 animate-pulse cursor-pointer hover:bg-primary/30 transition-colors flex flex-col items-center"
                  title={t('session.manualRest')}
                >
                   <p className="text-primary font-mono font-bold leading-none">{formatTime(restTimer)}</p>
                   <p className="text-[8px] text-primary/70 uppercase">{t('session.rest')}</p>
                </div>
              )}
              <div>
                <p className="text-white font-mono font-bold leading-none">{formatTime(duration)}</p>
                <p className="text-[8px] text-gray-400 uppercase">{t('session.duration')}</p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowFinishModal(true)}
              className="gap-1"
            >
              <Square className="w-4 h-4" />
              {t('common.finish')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 max-w-4xl mx-auto w-full min-w-0 space-y-6 overflow-x-hidden">
        <div className="flex gap-2 bg-surface-200/80 border border-surface-100 p-2 rounded-xl">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'workout' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('session.workout')}
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'control' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('session.session') || 'Sessão'}
          </button>
        </div>

        {/* Exercise Progress Dots — sempre visíveis na tab de treino */}
        {activeTab === 'workout' && exercises.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {exercises.map((ex, idx) => {
              const allDone = ex.sets.length > 0 && ex.sets.every(s => s.completed)
              const isCurrent = idx === currentExerciseIndex
              return (
                <button
                  key={ex.id}
                  onClick={() => setCurrentExerciseIndex(idx)}
                  aria-label={`Exercício ${idx + 1}: ${ex.name}`}
                  className={`transition-all rounded-full ${
                    isCurrent
                      ? 'w-6 h-2 bg-primary'
                      : allDone
                        ? 'w-2 h-2 bg-primary/40'
                        : 'w-2 h-2 bg-surface-100 hover:bg-primary/30'
                  }`}
                />
              )
            })}
          </div>
        )}


        {activeTab === 'workout' ? (
          <>
            {/* Exercise Card */}
            <div className="bg-surface-200 border border-surface-100 p-4 sm:p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white truncate">
                      {i18n.language.startsWith('pt') && currentExercise.name_pt ? currentExercise.name_pt : currentExercise.name}
                    </h2>
                    {(currentExercise.muscleGroups?.length > 0 || currentExercise.tips) && (
                      <button
                        onClick={() => { setTipsExercise(currentExercise); setShowTipsModal(true) }}
                        className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors shrink-0"
                        title={t('session.exerciseTipsTitle')}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openExerciseHistory(currentExercise.exerciseId)}
                      className="p-1.5 rounded-lg bg-surface-100 border border-surface-100/50 text-gray-400 hover:text-white transition-colors shrink-0"
                      title={t('session.historyTitle')}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (availableExercises.length === 0) fetchAvailableExercises()
                        setShowSwapModal(true)
                      }}
                      className="p-1.5 rounded-lg bg-surface-100 border border-surface-100/50 text-gray-400 hover:text-white transition-colors shrink-0"
                      title={t('session.swapExercise')}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 capitalize mt-1">
                    {currentExercise.muscleGroups.map(mg => t(`common.muscles.${mg.toLowerCase()}`)).join(', ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {currentExercise.repsMin}–{currentExercise.repsMax} {t('session.reps')}
                  </span>
                  <button
                    onClick={() => {
                      const lastWeight = currentExercise.sets[currentExercise.sets.length - 1]?.weight || 0
                      setPlateMathWeight(lastWeight)
                      setShowPlateMath(true)
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-100 border border-surface-100/50 text-gray-400 hover:text-white text-[9px] font-black uppercase tracking-wider transition-colors"
                    title={t('session.plateMathTitle')}
                  >
                    <Calculator className="w-3 h-3" />
                    {t('session.plates')}
                  </button>
                </div>
              </div>

              {/* Pro Insights: Last Performance (Normal UI) */}
              <AnimatePresence>
                {previousExerciseData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 bg-surface-100 border border-primary/20 p-4 rounded-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{t('session.lastTime')}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{new Date(previousExerciseData.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {previousExerciseData.sets.map((s, i) => (
                        <div key={i} className="bg-background px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-center min-w-[60px]">
                           <span className="text-[8px] text-gray-500 font-bold uppercase">{t('session.set').charAt(0).toUpperCase()}{i+1}</span>
                           <span className="text-xs text-white font-black">{s.weight_kg}kg × {s.reps}</span>
                        </div>
                      ))}
                    </div>

                    {previousExerciseData.notes && (
                      <div className="mt-2 flex items-start gap-2 bg-black/10 p-3 rounded-xl border border-white/5">
                        <StickyNote className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-[10px] text-gray-300 font-medium leading-relaxed italic">
                          "{previousExerciseData.notes}"
                        </p>
                      </div>
                    )}

                    {/* Progressive Overload Suggestion */}
                    {(() => {
                      const totalReps = previousExerciseData.sets.reduce((acc, s) => acc + (s.reps || 0), 0)
                      const avgReps = totalReps / previousExerciseData.sets.length
                      
                      if (avgReps >= currentExercise.repsMax) {
                        return (
                          <div className="mt-3 flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
                            <TrendingUp className="w-3 h-3 text-primary animate-bounce-slow" />
                            <span className="text-[10px] font-black text-white uppercase italic tracking-tight">{t('session.evolution')}: {t('session.evolutionSuggested')}</span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-[32px_1fr_1fr_64px] gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-2 items-center">
                <span className="text-center">{t('session.set')}</span>
                <span className="text-center">Kg</span>
                <span className="text-center">Reps</span>
                <span className="text-center">{t('common.done')}</span>
              </div>

              {/* Sets List */}
              <div className="space-y-3 mb-4">
                {currentExercise.sets.map((set, idx) => (
                  <div 
                    key={set.id}
                    className={`flex flex-col gap-2 p-2.5 sm:p-4 rounded-xl transition-colors shadow-sm ${
                      set.completed 
                        ? 'bg-primary/10 border border-primary/30 shadow-primary/5' 
                        : 'bg-surface-100 border border-surface-100/50 hover:border-surface-100 hover:bg-surface-100/80'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <span className={`font-black w-5 sm:w-8 text-center text-base sm:text-xl shrink-0 ${set.completed ? 'text-primary/80' : 'text-gray-500'}`}>
                        {set.setNumber}
                      </span>

                      <div className="flex-1 flex gap-1.5 sm:gap-2 min-w-0">
                        {/* Weight with steppers */}
                        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 min-w-0">
                          <button
                            onClick={() => handleSetChange(set.id, 'weight', Math.max(0, (set.weight || 0) - 2.5))}
                            className="w-7 sm:w-8 h-11 sm:h-14 flex items-center justify-center bg-surface-100 rounded-lg text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-sm sm:text-base font-black border border-surface-100/50 shrink-0"
                          >−</button>
                          <DebouncedNumericInput
                            value={set.weight}
                            onChange={val => handleSetChange(set.id, 'weight', val)}
                            className={`flex-1 min-w-0 w-0 h-11 sm:h-14 bg-background border ${set.completed ? 'border-primary/20' : 'border-surface-200'} rounded-xl text-center text-white font-bold text-sm sm:text-lg placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner`}
                            placeholder="kg"
                          />
                          <button
                            onClick={() => handleSetChange(set.id, 'weight', (set.weight || 0) + 2.5)}
                            className="w-7 sm:w-8 h-11 sm:h-14 flex items-center justify-center bg-surface-100 rounded-lg text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-sm sm:text-base font-black border border-surface-100/50 shrink-0"
                          >+</button>
                        </div>
                        <div className="flex items-center justify-center text-gray-500 font-bold opacity-50 shrink-0 text-xs">×</div>
                        {/* Reps with steppers */}
                        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 min-w-0">
                          <button
                            onClick={() => handleSetChange(set.id, 'reps', Math.max(0, (set.reps || 0) - 1))}
                            className="w-7 sm:w-8 h-11 sm:h-14 flex items-center justify-center bg-surface-100 rounded-lg text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-sm sm:text-base font-black border border-surface-100/50 shrink-0"
                          >−</button>
                          <DebouncedNumericInput
                            value={set.reps}
                            onChange={val => handleSetChange(set.id, 'reps', val)}
                            className={`flex-1 min-w-0 w-0 h-11 sm:h-14 bg-background border ${set.completed ? 'border-primary/20' : 'border-surface-200'} rounded-xl text-center text-white font-bold text-sm sm:text-lg placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner`}
                            placeholder="reps"
                          />
                          <button
                            onClick={() => handleSetChange(set.id, 'reps', (set.reps || 0) + 1)}
                            className="w-7 sm:w-8 h-11 sm:h-14 flex items-center justify-center bg-surface-100 rounded-lg text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-sm sm:text-base font-black border border-surface-100/50 shrink-0"
                          >+</button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompleteSet(set.id)}
                        className={`w-11 sm:w-14 h-11 sm:h-14 flex items-center justify-center rounded-xl transition-all font-bold text-base sm:text-xl shadow-sm active:scale-95 shrink-0 ${
                          set.completed
                            ? 'bg-primary text-black shadow-primary/20 scale-[0.98]'
                            : 'bg-surface-200 border border-surface-100 text-gray-400 hover:bg-primary/20 hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {set.completed ? '✓' : '○'}
                      </button>
                    </div>

                    {/* Secondary Row (Actions) */}
                    <div className="flex items-center justify-end gap-2 pr-2 mt-2 border-t border-surface-100/50 pt-2">
                      {previousExerciseData?.sets[idx] && (
                        <button
                          onClick={() => handleApplyLastSet(set.id, idx)}
                          className="text-[10px] uppercase tracking-wider font-bold text-primary/70 hover:text-primary bg-primary/10 rounded-md px-2 py-1 transition-colors border border-primary/20 flex items-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          {t('session.applyLast')}
                        </button>
                      )}
                      {idx > 0 && (
                        <button
                          onClick={() => handleCopyPreviousSet(set.id)}
                          className="text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-white bg-surface-200 rounded-md px-2 py-1 transition-colors"
                        >
                          {t('session.copyPrevious')}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSet(set.id)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exercise Notes */}
              <div className="mb-4">
                <textarea
                  value={currentExercise.notes || ''}
                  onChange={(e) => handleExerciseNotesChange(e.target.value)}
                  placeholder={t('session.addNotePlaceholder')}
                  className="w-full bg-surface-100/50 border border-surface-100 rounded-xl p-3 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-primary focus:bg-surface-100 transition-all resize-none min-h-[60px]"
                />
              </div>

              <button
                onClick={handleAddSet}
                className="w-full h-10 border border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                {t('session.addSet')}
              </button>
            </div>

            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-gray-400 hover:text-primary hover:border-primary/20 transition-all font-black uppercase text-xs tracking-widest bg-surface-200/50"
            >
              <Plus className="w-4 h-4 mx-auto mb-1" />
              {t('session.addExercise')}
            </button>

          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
              <h3 className="text-gray-400 text-sm font-medium mb-2">{t('session.workoutNotes')}</h3>
              <textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder={t('session.workoutNotesPlaceholder')}
                className="w-full bg-surface-100 border border-surface-200 rounded-lg p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary resize-none h-24 shadow-inner mt-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">{t('session.duration')}</p>
                <p className="text-2xl font-bold text-white">{formatTime(duration)}</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">{t('session.rest')}</p>
                <p className="text-2xl font-bold text-white">{restTimer !== null ? `${restTimer}s` : '—'}</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">{t('session.volume')} ({t('session.completed').toLowerCase()})</p>
                <p className="text-2xl font-bold text-white">{completedVolume.toFixed(0)} kg</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">{t('session.setsCompletedTitle')}</p>
                <p className="text-2xl font-bold text-white">{completedSetsCount}</p>
              </div>
            </div>

            <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-bold text-sm">Spotify</h3>
                  <p className="text-xs text-gray-400">{t('session.spotifyDescription')}</p>
                </div>
                <Button
                  variant={spotifyConnected ? 'secondary' : 'primary'}
                  onClick={spotifyConnected ? handleSpotifyDisconnect : handleSpotifyConnect}
                  className="shrink-0"
                >
                  {spotifyConnected ? t('session.disconnect') : t('session.connectSpotify')}
                </Button>
              </div>

              {spotifyConnected && (
                <div className="mt-4 flex items-center gap-3">
                  {spotifyTrack?.albumArt ? (
                    <img
                      src={spotifyTrack.albumArt}
                      alt={spotifyTrack.name}
                      className="w-12 h-12 rounded-lg object-cover border border-surface-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-100 border border-surface-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                      {t('session.noMusic')}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {spotifyTrack?.name ?? t('session.noMusic')}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {spotifyTrack?.artist ?? ''}
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={handleSpotifyPrev}
                      className="w-9 h-9 rounded-lg bg-surface-100 text-gray-400 hover:text-white hover:bg-surface-200 border border-surface-100/50 transition-colors"
                      title={t('session.prevExercise')}
                    >
                      <ChevronLeft className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={handleSpotifyPlayPause}
                      className="w-9 h-9 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors"
                      title={spotifyPlaying ? t('session.pause') : t('session.resume')}
                    >
                      {spotifyPlaying ? (
                        <Pause className="w-4 h-4 mx-auto" />
                      ) : (
                        <Play className="w-4 h-4 mx-auto" />
                      )}
                    </button>
                    <button
                      onClick={handleSpotifyNext}
                      className="w-9 h-9 rounded-lg bg-surface-100 text-gray-400 hover:text-white hover:bg-surface-200 border border-surface-100/50 transition-colors"
                      title={t('session.nextExercise')}
                    >
                      <ChevronRight className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(true)}
              className="w-full gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              {t('session.cancelWorkout')}
            </Button>

            <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">{t('session.exercisesOrder')}</h3>
              <div className="space-y-3">
                {exercises.map((ex, idx) => {
                  const completed = ex.sets.filter(s => s.completed).length
                  const total = ex.sets.length
                  const isCurrent = idx === currentExerciseIndex
                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        setCurrentExerciseIndex(idx)
                        setActiveTab('workout')
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform ${
                        isCurrent ? 'border-primary/60 bg-primary/10' : 'border-surface-100 bg-surface-100 hover:border-primary/30'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-white">{idx + 1}. {ex.name}</p>
                        <p className="text-xs text-gray-400">{completed}/{total} {t('session.setsCompleted')}</p>
                      </div>
                      {isCurrent && (
                        <span className="text-xs text-primary font-bold">{t('session.now')}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </main>



      {toast && (
        <div className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : toast.type === 'error'
              ? 'bg-red-500/20 text-red-300 border-red-500/30'
              : 'bg-surface-200 text-gray-200 border-surface-100'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Footer Controls */}
      <div className={`fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-surface-200 border-t border-surface-100 z-40 transition-opacity ${
        isBottomOverlayActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {/* Focus — ícone apenas */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all border active:scale-90 ${isFocusMode ? 'bg-primary text-black border-primary' : 'bg-surface-100 text-primary border-white/5 hover:bg-primary/20'}`}
            title={isFocusMode ? t('session.exitFocus') : t('session.focusModeDesc')}
          >
            <Target className="w-5 h-5" />
          </button>

          {/* Back — ícone apenas */}
          <button
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(i => i - 1)}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-surface-100 border border-white/5 text-gray-400 hover:text-white disabled:opacity-30 active:scale-90 transition-all"
            title={t('common.back')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next / Finish — botão dominante */}
          <Button
            onClick={() => {
              if (currentExerciseIndex === exercises.length - 1) {
                setShowFinishModal(true)
              } else {
                setCurrentExerciseIndex(i => i + 1)
              }
            }}
            className="flex-1 h-11 gap-1.5 font-black uppercase tracking-tight text-sm active:scale-95 transition-transform shadow-lg shadow-primary/10"
          >
            {currentExerciseIndex === exercises.length - 1 ? (
              <>
                {t('session.finishWorkout')}
                <Square className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                {t('common.next')}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Pause/Resume — ícone apenas */}
          <button
            onClick={() => setIsRunning(prev => !prev)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border active:scale-90 transition-all ${isRunning ? 'bg-surface-100 border-white/5 text-gray-400 hover:text-white' : 'bg-primary/20 border-primary/30 text-primary'}`}
            title={isRunning ? t('session.pause') : t('session.resume')}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-3xl flex flex-col p-4 sm:p-6 overflow-y-auto overflow-x-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 min-w-0 shrink">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-black font-black text-xs shrink-0">FP</div>
                <span className="text-xs font-black text-white uppercase tracking-widest italic hidden sm:block">{t('session.focusMode')}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    const next = !voiceEnabled
                    setVoiceEnabled(next)
                    if (next) {
                      speak(t('session.startingVoice'))
                    } else if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel()
                    }
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${voiceEnabled ? 'bg-primary/20 text-primary' : 'bg-surface-200 text-gray-500'}`}
                  title={t('profile.notifications')}
                >
                  {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsRunning(prev => !prev)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-white/5 active:scale-90 ${isRunning ? 'bg-surface-200 text-primary' : 'bg-primary text-black'}`}
                  title={isRunning ? t('session.pause') : t('session.resume')}
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button
                  onClick={() => {
                    if (isRestTimerRunning && restEndAt) return
                    if (restTimer === null) {
                      const nextRest = currentExercise?.restSeconds ?? targetRestTimer
                      setTargetRestTimer(nextRest)
                      setRestTimer(nextRest)
                      setRestEndAt(Date.now() + nextRest * 1000)
                      setIsRestTimerRunning(true)
                      localStorage.setItem('titanpulse_last_rest_time', nextRest.toString())
                    } else {
                      const next = (restTimer ?? 0) + 30
                      setRestTimer(next)
                      setRestEndAt(Date.now() + next * 1000)
                      setIsRestTimerRunning(true)
                    }
                    setShowRestTimer(true)
                    setIsTimerMinimized(false)
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-200 text-primary hover:bg-primary/20 active:scale-90 transition-all border border-white/5"
                  title={t('session.manualRest')}
                >
                  <Clock className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-200 text-gray-400 hover:text-white hover:bg-surface-100 active:scale-90 transition-all"
                  title={t('session.exitFocus')}
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center gap-5 max-w-lg mx-auto w-full min-w-0">
              <div className="text-center space-y-1 min-w-0 px-1">
                <p className="text-primary font-black uppercase tracking-widest text-[10px]">{t('session.trainingNow')}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter mb-2 break-words">
                  {isPt ? currentExercise.name_pt || currentExercise.name : currentExercise.name}
                </h2>
                <div className="inline-flex bg-surface-200 px-4 py-1.5 rounded-full border border-white/10 gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{t('common.goal')}</span>
                      <span className="text-xs text-white font-black">{currentExercise.repsMin}-{currentExercise.repsMax} {t('session.reps')}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{t('session.rest')}</span>
                      <span className="text-xs text-white font-black">{currentExercise.restSeconds}s</span>
                   </div>
                </div>
              </div>

              {/* Pro Insights: Last Performance */}
              <AnimatePresence>
                {previousExerciseData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/5 border border-primary/20 p-4 rounded-3xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{t('session.lastTime')}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">{new Date(previousExerciseData.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {previousExerciseData.sets.map((s, i) => (
                        <div key={i} className="bg-surface-200/50 px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-center min-w-[60px]">
                           <span className="text-[8px] text-gray-500 font-bold uppercase">{t('session.set').charAt(0).toUpperCase()}{i+1}</span>
                           <span className="text-xs text-white font-black">{s.weight_kg}kg × {s.reps}</span>
                        </div>
                      ))}
                    </div>

                    {previousExerciseData.notes && (
                      <div className="mt-2 flex items-start gap-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                        <StickyNote className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-[10px] text-gray-300 font-medium leading-relaxed italic line-clamp-2">
                          "{previousExerciseData.notes}"
                        </p>
                      </div>
                    )}

                    {/* Progressive Overload Suggestion */}
                    {(() => {
                      const totalReps = previousExerciseData.sets.reduce((acc, s) => acc + (s.reps || 0), 0)
                      const avgReps = totalReps / previousExerciseData.sets.length
                      
                      if (avgReps >= currentExercise.repsMax) {
                        return (
                          <div className="mt-3 flex items-center gap-2 bg-primary/20 px-3 py-2 rounded-xl animate-pulse border border-primary/30">
                            <TrendingUp className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black text-white uppercase italic tracking-tight">Sugerido: +2.5kg 🔥</span>
                          </div>
                        )
                      }
                      return null
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Huge Active Set Display */}
              <div className="bg-surface-200/40 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-[28px] sm:rounded-[32px] shadow-2xl flex flex-col gap-5 min-w-0">
                 {(() => {
                    const firstUncompletedIdx = currentExercise.sets.findIndex(s => !s.completed)
                    const activeSetIdx = focusSetIndex !== null
                      ? Math.max(0, Math.min(focusSetIndex, currentExercise.sets.length - 1))
                      : (firstUncompletedIdx >= 0 ? firstUncompletedIdx : currentExercise.sets.length - 1)
                    const activeSet = currentExercise.sets[activeSetIdx]
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-black text-xs uppercase">{t('session.set')} {activeSet.setNumber}</span>
                          {restTimer !== null && (
                            <span className="text-primary font-black animate-pulse text-sm">{formatTime(restTimer)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                           <div className="flex-1 space-y-1 text-center min-w-0">
                             <p className="text-[10px] font-bold text-gray-500 uppercase">kg</p>
                             <div className="flex items-center gap-1 min-w-0">
                               <button
                                 onClick={() => handleSetChange(activeSet.id, 'weight', Math.max(0, (activeSet.weight || 0) - 2.5))}
                                 className="w-9 h-16 sm:w-11 sm:h-20 bg-surface-100 rounded-2xl text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-xl font-black border border-white/5 shrink-0"
                               >−</button>
                               <DebouncedNumericInput
                                  value={activeSet.weight}
                                  onChange={val => handleSetChange(activeSet.id, 'weight', val)}
                                  className="flex-1 min-w-0 h-16 sm:h-20 bg-background border-2 border-surface-100 rounded-3xl text-center text-2xl sm:text-3xl font-black text-white focus:border-primary transition-all shadow-inner"
                               />
                               <button
                                 onClick={() => handleSetChange(activeSet.id, 'weight', (activeSet.weight || 0) + 2.5)}
                                 className="w-9 h-16 sm:w-11 sm:h-20 bg-surface-100 rounded-2xl text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-xl font-black border border-white/5 shrink-0"
                               >+</button>
                             </div>
                           </div>
                           <div className="text-2xl font-black text-gray-700 mt-5 shrink-0">×</div>
                           <div className="flex-1 space-y-1 text-center min-w-0">
                             <p className="text-[10px] font-bold text-gray-500 uppercase">{t('session.reps')}</p>
                             <div className="flex items-center gap-1 min-w-0">
                               <button
                                 onClick={() => handleSetChange(activeSet.id, 'reps', Math.max(0, (activeSet.reps || 0) - 1))}
                                 className="w-9 h-16 sm:w-11 sm:h-20 bg-surface-100 rounded-2xl text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-xl font-black border border-white/5 shrink-0"
                               >−</button>
                               <DebouncedNumericInput
                                  value={activeSet.reps}
                                  onChange={val => handleSetChange(activeSet.id, 'reps', val)}
                                  className="flex-1 min-w-0 h-16 sm:h-20 bg-background border-2 border-surface-100 rounded-3xl text-center text-2xl sm:text-3xl font-black text-white focus:border-primary transition-all shadow-inner"
                               />
                               <button
                                 onClick={() => handleSetChange(activeSet.id, 'reps', (activeSet.reps || 0) + 1)}
                                 className="w-9 h-16 sm:w-11 sm:h-20 bg-surface-100 rounded-2xl text-gray-400 hover:text-white hover:bg-surface-200 active:scale-90 transition-all text-xl font-black border border-white/5 shrink-0"
                               >+</button>
                             </div>
                           </div>
                        </div>

                        <Button 
                          size="lg"
                          variant={activeSet.completed ? "secondary" : "primary"}
                          className="h-16 rounded-3xl text-xl font-black uppercase italic tracking-tighter active:scale-95 transition-transform shadow-lg shadow-primary/10"
                          onClick={() => handleCompleteSet(activeSet.id)}
                        >
                          {activeSet.completed ? t('session.setCompleted') : t('session.completeSet')}
                        </Button>
                      </>
                    )
                 })()}
              </div>

              {/* Exercise Notes Focus Mode */}
              <div className="bg-surface-200/50 backdrop-blur-md border border-white/5 rounded-3xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <StickyNote className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{t('session.workoutNotes')}</span>
                </div>
                <textarea
                  value={currentExercise.notes || ''}
                  onChange={(e) => handleExerciseNotesChange(e.target.value)}
                  placeholder={t('session.addNotePlaceholder')}
                  className="w-full bg-surface-100/50 border border-surface-100 rounded-xl p-3 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-primary focus:bg-surface-100 transition-all resize-none min-h-[60px]"
                />
              </div>

            </div>

            <div className="mt-auto flex flex-col gap-2">
              {/* Navegação unificada: sets + exercícios numa só linha */}
              {(() => {
                const firstUncompletedIdx = currentExercise.sets.findIndex(s => !s.completed)
                const activeSetIdx = focusSetIndex !== null
                  ? Math.max(0, Math.min(focusSetIndex, currentExercise.sets.length - 1))
                  : (firstUncompletedIdx >= 0 ? firstUncompletedIdx : currentExercise.sets.length - 1)
                const isFirstItem = activeSetIdx === 0 && currentExerciseIndex === 0
                const isLastItem = activeSetIdx === currentExercise.sets.length - 1 && currentExerciseIndex === exercises.length - 1
                return (
                  <div className="flex items-center gap-2">
                    {/* ← Set ou Exercício anterior */}
                    <button
                      disabled={isFirstItem}
                      onClick={() => {
                        if (activeSetIdx > 0) {
                          setFocusSetIndex(activeSetIdx - 1)
                        } else if (currentExerciseIndex > 0) {
                          const prevEx = exercises[currentExerciseIndex - 1]
                          setCurrentExerciseIndex(i => i - 1)
                          setFocusSetIndex(prevEx ? Math.max(0, prevEx.sets.length - 1) : 0)
                        }
                      }}
                      className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/20 text-primary flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Dots de sets */}
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                      {currentExercise.sets.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => setFocusSetIndex(i)}
                          className={`transition-all rounded-full ${
                            i === activeSetIdx
                              ? 'w-5 h-2 bg-primary'
                              : s.completed
                                ? 'w-2 h-2 bg-primary/40'
                                : 'w-2 h-2 bg-surface-100'
                          }`}
                        />
                      ))}
                    </div>

                    {/* → Set, Exercício ou Terminar */}
                    <button
                      disabled={isLastItem}
                      onClick={() => {
                        if (activeSetIdx < currentExercise.sets.length - 1) {
                          setFocusSetIndex(activeSetIdx + 1)
                        } else if (currentExerciseIndex < exercises.length - 1) {
                          setCurrentExerciseIndex(i => i + 1)
                          setFocusSetIndex(0)
                        } else {
                          setShowFinishModal(true)
                        }
                      }}
                      className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/20 text-primary flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )
              })()}

              {/* Finalizar — visível apenas no último set do último exercício */}
              {currentExerciseIndex === exercises.length - 1 && (
                <Button
                  variant="secondary"
                  className="w-full h-10 rounded-2xl text-gray-400 font-black uppercase text-xs active:scale-95 transition-all border-white/10"
                  onClick={() => setShowFinishModal(true)}
                >
                  {t('session.finishWorkout')}
                  <Square className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Rest Overlay - Non-Blocking Bottom Sheet */}
      <AnimatePresence>
        {showRestTimer && (
          isTimerMinimized ? (
             <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="fixed right-4 z-[70] cursor-pointer bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-auto md:top-24"
                onClick={() => setIsTimerMinimized(false)}
             >
                <div className="bg-primary text-black px-4 py-2 rounded-full font-black tabular-nums shadow-xl border-2 border-white/20 flex items-center gap-2 active:scale-90 transition-transform">
                   <Clock className="w-4 h-4 animate-pulse" />
                   {formatTime(restTimer ?? targetRestTimer)}
                </div>
             </motion.div>
          ) : (
             <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 z-[70] bg-surface-200/95 backdrop-blur-2xl border-t border-primary/20 rounded-t-[32px] p-6 pb-[calc(3rem+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center"
             >
               <div className="w-12 h-1.5 bg-white/10 rounded-full mb-6 cursor-pointer" onClick={() => {
                 if (restTimer === null) setShowRestTimer(false)
                 else setIsTimerMinimized(true)
               }} />

               <div className="w-full max-w-sm flex flex-col items-center relative">
                 <button onClick={() => {
                   if (restTimer === null) setShowRestTimer(false)
                   else setIsTimerMinimized(true)
                 }} className="absolute -top-4 right-0 p-2 text-gray-500 hover:text-white transition-colors bg-surface-100 rounded-full">
                    {restTimer === null ? <X className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                 </button>

                  <div className="flex flex-col items-center gap-6 mb-8 mt-4">
                    <div className="relative">
                      <div className={`w-32 h-32 rounded-full border-4 ${isRestTimerRunning ? 'border-primary/20 border-t-primary animate-spin-slow' : 'border-surface-100'} flex items-center justify-center`}>
                        <Clock className={`w-10 h-10 ${isRestTimerRunning ? 'text-primary animate-pulse' : 'text-gray-500'}`} />
                      </div>
                      {!isRestTimerRunning && restTimer !== null && restTimer > 0 && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase italic shadow-lg">
                          {t('session.restPaused')}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-primary font-black uppercase tracking-widest text-[10px] mb-1">
                        {restTimer !== null && restTimer > 0 ? t('session.restInProgress') : t('session.restTimer')}
                      </p>
                      <h2 className="text-7xl font-black italic tabular-nums text-white tracking-tighter leading-none">
                        {formatTime(restTimer ?? targetRestTimer)}
                      </h2>
                    </div>
                  </div>

                  {restTimer === null && (
                    <div className="flex flex-col gap-4 py-6 mb-6 bg-surface-100/30 rounded-3xl w-full border border-white/5">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('session.minutes')}</span>
                          <DebouncedNumericInput
                            value={Math.floor(targetRestTimer / 60)}
                            debounceTime={0}
                            onChange={(mins) => {
                              const safeMins = Math.max(0, Math.floor(mins ?? 0))
                              const secs = targetRestTimer % 60
                              setTargetRestTimer(safeMins * 60 + secs)
                            }}
                            className="w-20 h-12 bg-background border border-surface-100 rounded-xl text-center text-white font-black text-xl focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="text-3xl font-black text-primary">:</div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('session.seconds')}</span>
                          <DebouncedNumericInput
                            value={targetRestTimer % 60}
                            debounceTime={0}
                            onChange={(secs) => {
                              const safeSecs = clamp(Math.floor(secs ?? 0), 0, 59)
                              const mins = Math.floor(targetRestTimer / 60)
                              setTargetRestTimer(mins * 60 + safeSecs)
                            }}
                            className="w-20 h-12 bg-background border border-surface-100 rounded-xl text-center text-white font-black text-xl focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {[ -30, -10, 10, 30 ].map(delta => (
                          <button
                            key={delta}
                            onClick={() => {
                              const next = Math.max(0, targetRestTimer + delta)
                              setTargetRestTimer(next)
                            }}
                            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-white/10 text-gray-400 hover:text-white hover:border-primary/30 transition-colors"
                          >
                            {delta > 0 ? `+${delta}s` : `${delta}s`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full mb-8">
                    <div className="flex gap-3">
                      {restTimer !== null && (
                        <Button
                          variant="secondary"
                          className="flex-1 h-16 rounded-2xl text-gray-400 hover:text-white"
                          onClick={() => {
                            setRestTimer(null)
                            setRestEndAt(null)
                            setIsRestTimerRunning(false)
                          }}
                        >
                          <Square className="w-6 h-6 fill-current" />
                        </Button>
                      )}

                      <Button
                        variant={isRestTimerRunning ? "secondary" : "primary"}
                        className={`${restTimer !== null ? 'flex-[2]' : 'w-full'} h-16 rounded-2xl text-xl font-black uppercase italic tracking-tighter shadow-lg`}
                        onClick={() => {
                          if (isRestTimerRunning) {
                            if (restEndAt) {
                              const remaining = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000))
                              setRestTimer(remaining)
                            }
                            setRestEndAt(null)
                            setIsRestTimerRunning(false)
                            return
                          }

                          const next = restTimer ?? targetRestTimer
                          setRestTimer(next)
                          setRestEndAt(Date.now() + next * 1000)
                          setIsRestTimerRunning(true)
                          saveRecentTimer(next)
                        }}
                      >
                        {isRestTimerRunning ? (
                          <><Pause className="w-6 h-6 mr-2 fill-current" />{t('session.pause')}</>
                        ) : (
                          <><Play className="w-6 h-6 mr-2 fill-current" />{restTimer === null ? t('common.start') : t('session.resume')}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('session.recentTimes')}</span>
                      {currentExercise?.planExerciseId && (
                        <button 
                          onClick={async () => {
                            try {
                              const timeToSave = restTimer ?? targetRestTimer
                              await supabase.from('plan_exercises').update({ rest_seconds: timeToSave }).eq('id', currentExercise.planExerciseId)
                              setExercises(prev => prev.map((ex, i) => i === currentExerciseIndex ? { ...ex, restSeconds: timeToSave } : ex))
                              showToast(t('session.saveTimeSuccess'), 'success')
                            } catch (e) {
                              showToast(t('session.saveTimeError'), 'error')
                            }
                          }}
                          className="text-[10px] font-black text-primary uppercase flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors"
                        >
                          <Save className="w-3 h-3" />
                          {t('session.saveDefault')}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2 w-full overflow-x-auto no-scrollbar pb-2">
                      {recentRestTimes.map((time, idx) => (
                        <button
                          key={`${time}-${idx}`}
                          onClick={() => {
                            setRestTimer(time)
                            setTargetRestTimer(time)
                            setIsRestTimerRunning(true)
                            setRestEndAt(Date.now() + time * 1000)
                            saveRecentTimer(time)
                          }}
                          className="flex-1 min-w-[80px] bg-surface-100 h-12 rounded-xl border border-white/5 font-black text-sm active:scale-95 transition-all outline-none text-white hover:border-primary/50 flex flex-col items-center justify-center group"
                        >
                          <span className="text-primary group-hover:scale-110 transition-transform">{formatTime(time)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                 
                 <div className="mt-6 flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase truncate max-w-full">
                   <span>{t('session.nextTitle')}:</span>
                                       <span className="text-white truncate">{isPt ? currentExercise.name_pt || currentExercise.name : currentExercise.name}</span>

                 </div>
               </div>
             </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Suspicious Workout Modal */}
      <Modal
        isOpen={showSuspiciousModal}
        onClose={() => setShowSuspiciousModal(false)}
        title={t('session.validateWorkout')}
        size="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase italic tracking-tighter">{t('session.unusualValuesDetected')}</h3>
            <p className="text-sm text-gray-400">
              {t('session.unusualValuesDescription')}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              className="flex-1 h-12"
              onClick={() => setShowSuspiciousModal(false)}
            >
              {t('session.reviewValues')}
            </Button>
            <Button 
              className="flex-1 h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase italic"
              onClick={async () => {
                setShowSuspiciousModal(false)
                await finishWorkout(true)
              }}
            >
              {t('session.saveAnyway')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Finish Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title={t('session.finishWorkoutTitle')}
        size="sm"
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            {t('session.finishWorkoutConfirm')}
          </p>

          <div className="space-y-2 bg-surface-100 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('session.duration')}:</span>
              <span className="text-white font-medium">{formatTime(duration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('session.exercises')}:</span>
              <span className="text-white font-medium">{exercises.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('session.totalSets')}:</span>
              <span className="text-white font-medium">
                {exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowFinishModal(false)}
              className="flex-1"
            >
              {t('session.continueTraining')}
            </Button>
            <Button
              variant="danger"
              onClick={() => finishWorkout()}
              className="flex-1"
            >
              {t('session.yesFinish')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(null); }}
        title={t('session.cancelWorkoutConfirmTitle')}
        size="sm"
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            {t('session.cancelConfirm')}
          </p>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">{t('session.cancelReasonTitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'tired' },
                { id: 'noTime' },
                { id: 'injury' },
                { id: 'other' }
              ].map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setCancelReason(reason.id)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    cancelReason === reason.id 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'bg-surface-100 border-white/5 text-gray-400 hover:border-white/10'
                  }`}
                >
                  {t(`session.cancelReason.${reason.id}`)}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {cancelReason && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-primary/10 border border-primary/20 p-4 rounded-xl"
              >
                <div className="flex gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs text-primary leading-relaxed font-medium">
                    {t(`session.cancelSuggestion.${cancelReason}`)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setShowCancelModal(false); setCancelReason(null); }}
              className="flex-1"
            >
              {t('session.continueTraining')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                localStorage.removeItem('titanpulse_active_session')
                navigate('/workouts')
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        title={t('session.addExercise')}
        size="md"
        closeButton
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t('session.searchExercisePlaceholder')}
              value={exerciseSearchTerm}
              onChange={e => setExerciseSearchTerm(e.target.value)}
              className="w-full bg-surface-100 border border-surface-200 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {availableExercises
              .filter(ex => 
                ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) || 
                ex.name_pt?.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
              )
              .slice(0, 10)
              .map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleAddInSessionExercise(ex)}
                  className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-primary/10 border border-white/5 rounded-xl transition-all group"
                >
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{isPt ? ex.name_pt || ex.name : ex.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{ex.muscle_groups?.[0] || t('session.general')}</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                </button>
              ))}
          </div>
        </div>
      </Modal>

      {/* Exercise History Bottom Sheet */}
      <AnimatePresence>
        {showHistorySheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowHistorySheet(false)} />
            <div className="relative bg-surface-200 border-t border-primary/20 rounded-t-[32px] p-6 pb-[calc(3rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowHistorySheet(false)} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{t('session.historyTitle')}</h3>
                <button onClick={() => setShowHistorySheet(false)} className="p-2 rounded-xl bg-surface-100 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {historySheetLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
              ) : historySheetData.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">{t('session.noHistory')}</p>
              ) : (
                <div className="space-y-4">
                  {historySheetData.map((session, si) => (
                    <div key={si} className="bg-surface-100 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black text-primary uppercase">{si === 0 ? t('session.lastTime') : `–${si}`}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.sets.map((s, i) => (
                          <div key={i} className="bg-background px-3 py-2 rounded-xl border border-white/5 flex flex-col items-center min-w-[64px]">
                            <span className="text-[8px] text-gray-500 font-bold uppercase">{t('session.set').charAt(0).toUpperCase()}{i + 1}</span>
                            <span className="text-sm text-white font-black">{s.weight_kg}kg</span>
                            <span className="text-[10px] text-primary font-bold">× {s.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plate Math Bottom Sheet */}
      <AnimatePresence>
        {showPlateMath && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[70] flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowPlateMath(false)} />
            <div className="relative bg-surface-200 border-t border-primary/20 rounded-t-[32px] p-6 pb-[calc(3rem+env(safe-area-inset-bottom))]">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowPlateMath(false)} />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{t('session.plateMathTitle')}</h3>
                <button onClick={() => setShowPlateMath(false)} className="p-2 rounded-xl bg-surface-100 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3 mb-6">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">{t('session.weightTitle')}</p>
                  <DebouncedNumericInput
                    value={plateMathWeight}
                    onChange={v => setPlateMathWeight(v ?? 0)}
                    className="w-full h-12 bg-background border border-surface-100 rounded-xl text-center text-white font-black text-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">{t('session.barbellWeight')}</p>
                  <div className="flex gap-1.5">
                    {[15, 20].map(w => (
                      <button
                        key={w}
                        onClick={() => setBarbellWeight(w)}
                        className={`flex-1 h-12 rounded-xl text-sm font-black border transition-all ${barbellWeight === w ? 'bg-primary text-black border-primary' : 'bg-surface-100 text-gray-400 border-surface-100/50 hover:border-primary/30'}`}
                      >{w}kg</button>
                    ))}
                  </div>
                </div>
              </div>
              {(() => {
                const plates = calculatePlates(plateMathWeight, barbellWeight)
                const totalCheck = barbellWeight + plates.reduce((acc, p) => acc + p.plate * p.count * 2, 0)
                return (
                  <div className="space-y-3">
                    <div className="bg-surface-100 rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-3">{t('session.perSide')}</p>
                      {plates.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center font-bold">{t('session.plateMathOnlyBar')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {plates.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-xl border border-white/5">
                              <span className="text-base font-black text-white">{p.count}×</span>
                              <span className="text-primary font-black">{p.plate}kg</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase">{t('session.totalWeight')}</span>
                      <span className="text-lg font-black text-primary">{totalCheck}kg</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Exercise Modal */}
      <Modal
        isOpen={showSwapModal}
        onClose={() => { setShowSwapModal(false); setSwapSearchTerm('') }}
        title={t('session.swapExercise')}
        size="md"
        closeButton
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t('session.searchExercisePlaceholder')}
              value={swapSearchTerm}
              onChange={e => setSwapSearchTerm(e.target.value)}
              className="w-full bg-surface-100 border border-surface-200 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {availableExercises
              .filter(ex =>
                ex.name.toLowerCase().includes(swapSearchTerm.toLowerCase()) ||
                ex.name_pt?.toLowerCase().includes(swapSearchTerm.toLowerCase())
              )
              .slice(0, 10)
              .map(ex => (
                <button
                  key={ex.id}
                  onClick={() => handleSwapExercise(ex)}
                  className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-primary/10 border border-white/5 rounded-xl transition-all group"
                >
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{isPt ? ex.name_pt || ex.name : ex.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{ex.muscle_groups?.[0] || t('session.general')}</p>
                  </div>
                  <Shuffle className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                </button>
              ))}
          </div>
        </div>
      </Modal>

      {/* Exercise Tips Modal */}
      <Modal
        isOpen={showTipsModal}
        onClose={() => { setShowTipsModal(false); setTipsExercise(null) }}
        title={tipsExercise ? (isPt && tipsExercise.name_pt ? tipsExercise.name_pt : tipsExercise.name) : ''}
        size="md"
        closeButton
      >
        <div className="space-y-4">
          {tipsExercise?.muscleGroups?.length ? (
            <div className="rounded-2xl bg-surface-100 border border-white/5 p-4">
              <MuscleIcon muscles={tipsExercise.muscleGroups} size="lg" />
            </div>
          ) : null}

          {tipsExercise?.tips ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('session.howToPerform')}</p>
              <div className="bg-surface-100 rounded-2xl p-4 border border-white/5">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                  {tipsExercise.tips}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">{t('session.exerciseNoTips')}</p>
          )}

          <div className="pt-2 flex items-center gap-2 text-xs text-gray-500 bg-surface-100/50 rounded-xl p-3 border border-white/5">
            <span className="font-black text-primary uppercase tracking-tighter">
              {tipsExercise?.muscleGroups.map(mg => t(`common.muscles.${mg.toLowerCase()}`)).join(', ')}
            </span>
            <span>•</span>
            <span>{tipsExercise?.repsMin}–{tipsExercise?.repsMax} {t('session.reps')}</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
