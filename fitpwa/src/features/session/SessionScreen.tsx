import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import { ChevronLeft, ChevronRight, Square, Play, Plus, Trash2, Clock, Zap, Loader2, Target, Music, SkipBack, SkipForward, Pause, Minimize2, Search, StickyNote, TrendingUp, RotateCcw, Volume2, VolumeX, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { DebouncedNumericInput } from '@/shared/components/DebouncedNumericInput'
import { useVoiceGuide } from '@/shared/hooks/useVoiceGuide'
import { supabase } from '@/shared/lib/supabase'
import { calculateEstimated1RM } from '@/shared/lib/calculations'
import { OfflineSyncService } from '@/shared/lib/offlineSync'
import { useAuthStore } from '@/features/auth/authStore'
import { XP_PER_EXERCISE, XP_PER_SET, XP_PER_WORKOUT, XP_STREAK_MULTIPLIER } from '@/shared/utils/gamification'
import { motion, AnimatePresence } from 'framer-motion'
import { WheelPicker } from '@/shared/components/WheelPicker'
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
}

export function SessionScreen() {
  const navigate = useNavigate()
  const { id: planId } = useParams<{ id?: string }>()
  const { user, profile, addXp } = useAuthStore()
  const { t, i18n } = useTranslation()

  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [targetRestTimer, setTargetRestTimer] = useState<number>(90)
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [planName, setPlanName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'treino' | 'controlo'>('treino')
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(() => hasValidSpotifyToken())
  const [spotifyPlaying, setSpotifyPlaying] = useState<boolean | null>(null)
  const [spotifyTrack, setSpotifyTrack] = useState<{ name: string; artist: string; albumArt?: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
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
      order: exercises.length,
      exerciseId: exercise.id,
      name: exercise.name,
      name_pt: exercise.name_pt,
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: `ext-${Date.now()}-${i}`,
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
    setExercises([...exercises, newEx])
    setShowAddExerciseModal(false)
    showToast(`${newEx.name} ${t('session.setAdded').toLowerCase()}`, 'success')
  }

  const fetchAvailableExercises = async () => {
    const { data } = await supabase.from('exercises').select('*').limit(100)
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

  // Timer efeito
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // Document Title Effect
  useEffect(() => {
    let title = 'FitPWA'
    if (restTimer !== null) {
      const status = isRestTimerRunning ? t('session.resting') : t('session.restPaused')
      title = `${status.toUpperCase()} ${formatTime(restTimer)} | FitPWA`
    } else if (isRunning && duration > 0) {
      title = `${formatTime(duration)} | FitPWA`
    } else if (!isRunning) {
      title = `(${t('session.pause')}) | FitPWA`
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
      restTimer,
      targetRestTimer,
      isRestTimerRunning,
      sessionNotes,
      planId,
      planName,
      isRunning
    }
    localStorage.setItem('fitpwa_active_session', JSON.stringify(currentState))
  }, [exercises, currentExerciseIndex, duration, restTimer, targetRestTimer, isRestTimerRunning, sessionNotes, planId, planName, isRunning])

  // Rest timer effet
  useEffect(() => {
    if (restTimer === null || !isRestTimerRunning) return
    
    if (restTimer <= 0) {
      setRestTimer(null)
      setIsRestTimerRunning(false)
      
      // Haptic Feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(t('session.restFinished'), {
          body: t('session.restFinishedBody'),
          icon: '/favicon.ico'
        })
      }
      try {
        if (profile?.sound_enabled !== false) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
          audio.play().catch(() => {})
        }
      } catch { /* audio playback can fail silently on mobile */ }
      return
    }

    // Audio Countdown for last 3 seconds
    if (voiceEnabled && restTimer <= 3 && restTimer > 0) {
      speak(restTimer.toString())
    }

    const interval = setInterval(() => {
      setRestTimer(prev => (prev && prev > 0) ? prev - 1 : 0)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [restTimer === null, isRestTimerRunning, t, profile?.sound_enabled, voiceEnabled, speak])

  // Load recent timers
  useEffect(() => {
    const saved = localStorage.getItem('fitpwa_recent_timers')
    if (saved) {
      try {
        setRecentRestTimes(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent timers:', e)
      }
    }
  }, [])

  const saveRecentTimer = (time: number) => {
    localStorage.setItem('fitpwa_last_rest_time', time.toString())
    setTargetRestTimer(time)
    setRecentRestTimes(prev => {
      const filtered = prev.filter(t => t !== time)
      const next = [time, ...filtered].slice(0, 3)
      localStorage.setItem('fitpwa_recent_timers', JSON.stringify(next))
      return next
    })
  }



  // Load plan data
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        const rawActiveSession = localStorage.getItem('fitpwa_active_session')
        if (rawActiveSession) {
          try {
            const activeSession = JSON.parse(rawActiveSession)
            // If it's the SAME plan (or both are quick), resume
            if (activeSession.planId === planId || (!planId && activeSession.planId === 'quick')) {
              setExercises(activeSession.exercises)
              setCurrentExerciseIndex(activeSession.currentExerciseIndex || 0)
              setDuration(activeSession.duration || 0)
              setRestTimer(activeSession.restTimer || null)
              setTargetRestTimer(activeSession.targetRestTimer || activeSession.restTimer || 90)
              setIsRestTimerRunning(activeSession.isRestTimerRunning || false)
              setSessionNotes(activeSession.sessionNotes || '')
              setPlanName(activeSession.planName || null)
              if (activeSession.isRunning !== undefined) {
                setIsRunning(activeSession.isRunning)
              }
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
            .select('id, name, name_pt, muscle_groups')
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
                id: `${ex.exerciseId}-${idx}-${i}`,
                setNumber: i + 1,
                reps: 0,
                weight: ex.weight || 0,
                completed: false
              })),
              muscleGroups: detail?.muscle_groups || [],
              repsMin: 8,
              repsMax: 12,
              restSeconds: 90,
              notes: ''
            }
          })
          
          setExercises(sessionExercises)
          setIsLoading(false)
          return
        }

        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('id, name')
          .eq('id', planId)
          .single()

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
            exercises ( id, name, name_pt, muscle_groups )
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
              id: `${pe.id}-${i}`,
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
            notes: (pe.notes as string) || ''
          }
        })

        setExercises(sessionExercises)
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
          .from('workout_sets')
          .select(`
            weight_kg,
            reps,
            notes,
            created_at,
            workout_session_id
          `)
          .eq('exercise_id', currentEx.exerciseId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (lastSet && lastSet.length > 0) {
          // Get the most recent session's sets
          const lastSessionId = lastSet[0].workout_session_id
          const sessionSets = lastSet
            .filter(s => s.workout_session_id === lastSessionId)
            .map(s => ({
              weight_kg: s.weight_kg,
              reps: s.reps
            }))
            .reverse() // Keep original order if possible

          setPreviousExerciseData({
            date: lastSet[0].created_at,
            sets: sessionSets,
            notes: lastSet.find(s => s.workout_session_id === lastSessionId && s.notes)?.notes || null
          })
        } else {
          setPreviousExerciseData(null)
        }
      } catch (err) {
        console.error('Error fetching previous data:', err)
      }
    }

    fetchPreviousData()
  }, [currentExerciseIndex, exercises, user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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
      const returnPath = sessionStorage.getItem('fitpwa.spotify.returnPath')
      sessionStorage.removeItem('fitpwa.spotify.returnPath')
      const nextPath = returnPath || window.location.pathname
      navigate(nextPath, { replace: true })
    }).catch(() => {
      showToast(t('session.spotifyError'), 'error')
      clearStoredSpotifyState()
    })
  }, [navigate])

  const currentExercise = exercises[currentExerciseIndex]

  // Effect to announce new exercise (moved after currentExercise declaration)
  useEffect(() => {
    if (!voiceEnabled || !currentExercise) return
    speak(`Próximo exercício: ${currentExercise.name}. Objetivo: ${currentExercise.repsMin} a ${currentExercise.repsMax} repetições.`)
  }, [currentExerciseIndex, voiceEnabled, speak, currentExercise])

  const completedVolume = exercises.reduce((acc, ex) =>
    acc + ex.sets.reduce((setAcc, set) =>
      set.completed ? setAcc + ((set.weight || 0) * (set.reps || 0)) : setAcc, 0), 0)
  const completedSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`
  }

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
    setExercises(prev => prev.map(ex => ({
      ...ex,
      sets: ex.sets.map(set =>
        set.id === setId
          ? (() => {
              const nextCompleted = !set.completed
              if (nextCompleted) shouldStartRest = true
              return { ...set, completed: nextCompleted }
            })()
          : set
      )
    })))

    // Start rest timer after completing a set
    const exercise = exercises[currentExerciseIndex]
    if (exercise && shouldStartRest) {
      const lastRest = localStorage.getItem('fitpwa_last_rest_time')
      const restTime = lastRest ? parseInt(lastRest) : exercise.restSeconds
      setTargetRestTimer(restTime)
      setRestTimer(restTime)
      setIsRestTimerRunning(true)
      showToast(t('session.setCompletedSuccess'), 'success')
    }
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

  const handleAddSet = () => {
    if (!currentExercise) return
    setExercises(prev => prev.map((ex, idx) =>
      idx === currentExerciseIndex
        ? {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `${ex.id}-${ex.sets.length}`,
                setNumber: ex.sets.length + 1,
                reps: 0,
                weight: 0,
                completed: false
              }
            ]
          }
        : ex
    ))
    showToast(t('session.setAdded'), 'info')
  }

  const handleRemoveSet = (setId: string) => {
    setExercises(prev => prev.map((ex, idx) =>
      idx === currentExerciseIndex
        ? {
            ...ex,
            sets: ex.sets.filter(s => s.id !== setId)
          }
        : ex
    ))
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
        setIsRunning(true) 
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
              .single()

            if (sessionError) throw sessionError

            if (completedSets.length > 0) {
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
        navigate('/session/summary', { state: { stats, duration, xpGained, newPrs, exercises } })
        return
      }

      localStorage.removeItem('fitpwa_active_session')
      navigate('/session/summary', { state: { stats, duration, xpGained, exercises } })
    } catch (error) {
      console.error('Error finishing workout:', error)
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
    sessionStorage.setItem('fitpwa.spotify.returnPath', window.location.pathname)
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

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-200/90 backdrop-blur border-b border-surface-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-white text-lg">{t('session.activeSession')}</h1>
            <p className="text-sm text-gray-400">{currentExerciseIndex + 1} / {exercises.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`p-2 rounded-xl transition-all border border-white/5 active:scale-90 ${isFocusMode ? 'bg-primary text-black' : 'bg-surface-100 text-primary hover:bg-primary/20'}`}
              title={isFocusMode ? t('session.exitFocus') : t('session.focusModeDesc')}
            >
              <Target className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (restTimer === null) {
                  setRestTimer(targetRestTimer)
                  setIsRestTimerRunning(true)
                } else {
                  setRestTimer(prev => (prev ?? 0) + 30)
                }
              }}
              className="p-2 bg-surface-100 rounded-xl text-primary hover:bg-primary/20 transition-all border border-white/5 active:scale-90"
              title={t('session.manualRest')}
            >
              <Clock className="w-5 h-5" />
            </button>
            <div className="text-right flex items-center gap-3">
              {restTimer !== null && (
                <div 
                  onClick={() => setRestTimer(null)}
                  className="bg-primary/20 px-2 py-1 rounded border border-primary/30 animate-pulse cursor-pointer hover:bg-primary/30 transition-colors flex flex-col items-center"
                  title="Pular descanso"
                >
                   <p className="text-primary font-mono font-bold leading-none">{formatTime(restTimer)}</p>
                   <p className="text-[8px] text-primary/70 uppercase">{t('session.skip')}</p>
                </div>
              )}
              <div>
                <p className="text-white font-mono font-bold leading-none">{formatTime(duration)}</p>
                <p className="text-[8px] text-gray-400 uppercase">{t('session.duration')}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowCancelModal(true)}
              className="gap-1 border-white/10"
              title={t('session.cancelWorkout')}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">{t('common.cancel')}</span>
            </Button>
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
      <main className="flex-grow p-4 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex gap-2 bg-surface-200/80 border border-surface-100 p-2 rounded-xl">
          <button
            onClick={() => setActiveTab('treino')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'treino' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('session.workout')}
          </button>
          <button
            onClick={() => setActiveTab('controlo')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'controlo' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            {t('session.control')}
          </button>
        </div>


        {activeTab === 'treino' ? (
          <>
            {/* Exercise Card */}
            <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {i18n.language.startsWith('pt') && currentExercise.name_pt ? currentExercise.name_pt : currentExercise.name}
                  </h2>
                  <p className="text-sm text-gray-400 capitalize mt-1">
                    {currentExercise.muscleGroups.map(mg => t(`common.muscles.${mg.toLowerCase()}`)).join(', ')}
                  </p>
                </div>
                <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {currentExercise.repsMin}–{currentExercise.repsMax} {t('session.reps')}
                </span>
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
                    className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl transition-colors shadow-sm ${
                      set.completed 
                        ? 'bg-primary/10 border border-primary/30 shadow-primary/5' 
                        : 'bg-surface-100 border border-surface-100/50 hover:border-surface-100 hover:bg-surface-100/80'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`font-black w-6 sm:w-8 text-center text-lg sm:text-xl ${set.completed ? 'text-primary/80' : 'text-gray-500'}`}>
                        {set.setNumber}
                      </span>

                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <DebouncedNumericInput
                            value={set.weight}
                            onChange={val => handleSetChange(set.id, 'weight', val)}
                            className={`w-full h-12 sm:h-14 bg-background border ${set.completed ? 'border-primary/20' : 'border-surface-200'} rounded-xl text-center text-white font-bold text-lg sm:text-xl placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner`}
                            placeholder="kg"
                          />
                        </div>
                        <div className="flex items-center justify-center text-gray-500 font-bold opacity-50">×</div>
                        <div className="relative flex-1">
                          <DebouncedNumericInput
                            value={set.reps}
                            onChange={val => handleSetChange(set.id, 'reps', val)}
                            className={`w-full h-12 sm:h-14 bg-background border ${set.completed ? 'border-primary/20' : 'border-surface-200'} rounded-xl text-center text-white font-bold text-lg sm:text-xl placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner`}
                            placeholder="reps"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompleteSet(set.id)}
                        className={`w-14 sm:w-16 h-12 sm:h-14 flex items-center justify-center rounded-xl transition-all font-bold text-lg sm:text-xl shadow-sm active:scale-95 ${
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
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isCurrent ? 'border-primary/60 bg-primary/10' : 'border-surface-100 bg-surface-100'
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

            <div className="bg-surface-200 border border-surface-100 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">Spotify</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  spotifyConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {spotifyConnected ? t('session.connected') : t('session.disconnected')}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {t('session.spotifyDescription')}
              </p>
              {spotifyConnected && (
                <div className="flex items-center gap-3 bg-surface-100 border border-surface-100 rounded-xl p-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-200 overflow-hidden flex items-center justify-center">
                    {spotifyTrack?.albumArt ? (
                      <img src={spotifyTrack.albumArt} alt="Album art" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">Spotify</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{spotifyTrack?.name || 'Sem música'}</p>
                    <p className="text-xs text-gray-400 truncate">{spotifyTrack?.artist || '—'}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                {spotifyConnected ? (
                  <>
                    <Button variant="secondary" onClick={handleSpotifyPrev}>
                      {t('common.previous')}
                    </Button>
                    <Button onClick={handleSpotifyPlayPause}>
                      {spotifyPlaying ? 'Pausar' : 'Play'}
                    </Button>
                    <Button variant="secondary" onClick={handleSpotifyNext}>
                      {t('common.next')}
                    </Button>
                    <Button variant="secondary" onClick={handleSpotifyDisconnect}>
                      {t('session.disconnect')}
                    </Button>
                    {isDesktop && (
                      <Button onClick={() => window.open('https://open.spotify.com', '_blank')}>
                        {t('session.openSpotify')}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={handleSpotifyConnect}>
                    {t('session.connectSpotify')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>



      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-200 border-t border-surface-100 z-40">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            variant="secondary"
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(i => i - 1)}
            className="flex-1 gap-2 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('common.back')}
          </Button>

          <Button
            variant={isRunning ? 'secondary' : 'primary'}
            onClick={() => setIsRunning(prev => !prev)}
            className="flex-1 gap-2 active:scale-95 transition-transform shadow-lg"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                {t('session.pause')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t('session.resume')}
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              if (currentExerciseIndex === exercises.length - 1) {
                setShowFinishModal(true)
              } else {
                setCurrentExerciseIndex(i => i + 1)
              }
            }}
            className="flex-1 gap-2 active:scale-95 transition-transform"
          >
            {currentExerciseIndex === exercises.length - 1 ? (
              <>
                {t('session.finishWorkout')}
                <Square className="w-5 h-5" />
              </>
            ) : (
              <>
                {t('common.next')}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-3xl flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-black text-sm">FP</div>
                <span className="text-xs font-black text-white uppercase tracking-widest italic">{t('session.focusMode')}</span>
              </div>
              <div className="flex items-center gap-2">
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
                  className={`p-3 rounded-2xl transition-all ${voiceEnabled ? 'bg-primary/20 text-primary' : 'bg-surface-200 text-gray-500'}`}
                  title={t('profile.notifications')}
                >
                  {voiceEnabled ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
                </button>
                <button 
                  onClick={() => setIsRunning(prev => !prev)}
                  className={`p-3 rounded-2xl transition-all border border-white/5 active:scale-90 ${isRunning ? 'bg-surface-200 text-primary' : 'bg-primary text-black'}`}
                  title={isRunning ? t('session.pause') : t('session.resume')}
                >
                  {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <button 
                  onClick={() => setIsFocusMode(false)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 active:scale-90 transition-all"
                >
                  <Minimize2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center gap-6 max-w-lg mx-auto w-full">
              <div className="text-center space-y-1">
                <p className="text-primary font-black uppercase tracking-widest text-[10px]">{t('session.trainingNow')}</p>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                  {currentExercise.name}
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
              <div className="bg-surface-200/40 backdrop-blur-md border border-white/10 p-6 rounded-[32px] shadow-2xl flex flex-col gap-6">
                 {(() => {
                    const activeSet = currentExercise.sets.find(s => !s.completed) || currentExercise.sets[currentExercise.sets.length - 1]
                    return (
                      <>
                        <div className="flex justify-between items-center px-2">
                          <span className="text-gray-500 font-black text-xs uppercase">{t('session.set')} {activeSet.setNumber}</span>
                          {restTimer !== null && (
                            <span className="text-primary font-black animate-pulse text-sm">{t('session.restTimer').toUpperCase()}: {formatTime(restTimer)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="flex-1 space-y-1 text-center">
                             <p className="text-[10px] font-bold text-gray-500 uppercase">{t('session.weightTitle').toUpperCase()}</p>
                             <DebouncedNumericInput
                                value={activeSet.weight}
                                onChange={val => handleSetChange(activeSet.id, 'weight', val)}
                                className="w-full h-20 bg-background border-2 border-surface-100 rounded-3xl text-center text-4xl font-black text-white focus:border-primary transition-all shadow-inner"
                             />
                           </div>
                           <div className="text-3xl font-black text-gray-700 mt-6">×</div>
                           <div className="flex-1 space-y-1 text-center">
                             <p className="text-[10px] font-bold text-gray-500 uppercase">{t('session.repsTitle').toUpperCase()}</p>
                             <DebouncedNumericInput
                                value={activeSet.reps}
                                onChange={val => handleSetChange(activeSet.id, 'reps', val)}
                                className="w-full h-20 bg-background border-2 border-surface-100 rounded-3xl text-center text-4xl font-black text-white focus:border-primary transition-all shadow-inner"
                             />
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

              {/* Spotify Controls in Focus Mode */}
              {spotifyConnected && (
                <div className="bg-surface-200/50 border border-white/5 rounded-3xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 overflow-hidden shrink-0 border border-white/10">
                      {spotifyTrack?.albumArt ? (
                        <img src={spotifyTrack.albumArt} alt="Album" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-primary/40" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                       <p className="text-xs font-black text-white truncate italic uppercase tracking-tighter leading-none mb-1">{spotifyTrack?.name || 'Sem música'}</p>
                       <p className="text-[9px] font-bold text-gray-500 truncate uppercase tracking-widest leading-none">{spotifyTrack?.artist || 'Spotify'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={handleSpotifyPrev} className="p-3 bg-surface-100 rounded-xl text-gray-400 hover:text-white transition-colors active:scale-90"><SkipBack className="w-5 h-5" /></button>
                    <button 
                      onClick={handleSpotifyPlayPause} 
                      className="w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      {spotifyPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    <button onClick={handleSpotifyNext} className="p-3 bg-surface-100 rounded-xl text-gray-400 hover:text-white transition-colors active:scale-90"><SkipForward className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto flex justify-between gap-4">
              <Button 
                variant="ghost" 
                className="flex-1 h-14 rounded-2xl text-gray-500 font-black uppercase text-xs"
                disabled={currentExerciseIndex === 0}
                onClick={() => setCurrentExerciseIndex(i => i - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.back')}
              </Button>
              <Button 
                variant="ghost" 
                className="flex-[1.5] h-14 rounded-2xl text-primary font-black uppercase text-xs border border-primary/20 bg-primary/5 active:scale-95 transition-all"
                onClick={() => {
                  if (currentExerciseIndex === exercises.length - 1) {
                    setShowFinishModal(true)
                  } else {
                    setCurrentExerciseIndex(i => i + 1)
                  }
                }}
              >
                {currentExerciseIndex === exercises.length - 1 ? t('session.finishWorkout') : t('session.nextExercise')}
                {currentExerciseIndex !== exercises.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Rest Overlay - Non-Blocking Bottom Sheet */}
      <AnimatePresence>
        {restTimer !== null && (
          isTimerMinimized ? (
             <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                className="fixed bottom-24 right-4 z-[70] cursor-pointer"
                onClick={() => setIsTimerMinimized(false)}
             >
                <div className="bg-primary text-black px-4 py-2 rounded-full font-black tabular-nums shadow-xl border-2 border-white/20 flex items-center gap-2 active:scale-90 transition-transform">
                   <Clock className="w-4 h-4 animate-pulse" />
                   {formatTime(restTimer)}
                </div>
             </motion.div>
          ) : (
             <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 z-[70] bg-surface-200/95 backdrop-blur-2xl border-t border-primary/20 rounded-t-[32px] p-6 pb-12 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center"
             >
               <div className="w-12 h-1.5 bg-white/10 rounded-full mb-6 cursor-pointer" onClick={() => setIsTimerMinimized(true)} />

               <div className="w-full max-w-sm flex flex-col items-center relative">
                 <button onClick={() => setIsTimerMinimized(true)} className="absolute -top-4 right-0 p-2 text-gray-500 hover:text-white transition-colors bg-surface-100 rounded-full">
                    <Minimize2 className="w-5 h-5" />
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
                        {restTimer !== null && restTimer > 0 ? t('session.restInProgress') : t('session.setRestTime')}
                      </p>
                      <h2 className="text-7xl font-black italic tabular-nums text-white tracking-tighter leading-none">
                        {formatTime(restTimer ?? targetRestTimer)}
                      </h2>
                    </div>
                  </div>

                  {(!isRestTimerRunning || restTimer === null) && (
                    <div className="flex justify-center items-center gap-8 py-6 mb-6 bg-surface-100/30 rounded-3xl w-full border border-white/5">
                      <WheelPicker 
                        label={t('session.minutes')}
                        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        value={Math.floor((restTimer ?? targetRestTimer) / 60)}
                        onChange={(mins) => {
                          const secs = (restTimer ?? targetRestTimer) % 60
                          const next = mins * 60 + secs
                          setRestTimer(next)
                          setTargetRestTimer(next)
                        }}
                      />
                      <div className="text-4xl font-black text-primary pb-4">:</div>
                      <WheelPicker 
                        label={t('session.seconds')}
                        options={Array.from({ length: 60 }, (_, i) => i)}
                        value={(restTimer ?? targetRestTimer) % 60}
                        onChange={(secs) => {
                          const mins = Math.floor((restTimer ?? targetRestTimer) / 60)
                          const next = mins * 60 + secs
                          setRestTimer(next)
                          setTargetRestTimer(next)
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full mb-8">
                    <div className="flex gap-3">
                      <Button
                        variant={isRestTimerRunning ? "secondary" : "primary"}
                        className="flex-[2] h-16 rounded-2xl text-xl font-black uppercase italic tracking-tighter shadow-lg"
                        onClick={() => {
                          if (restTimer === null) {
                            setRestTimer(targetRestTimer)
                            saveRecentTimer(targetRestTimer)
                          }
                          setIsRestTimerRunning(!isRestTimerRunning)
                        }}
                      >
                        {isRestTimerRunning ? (
                          <><Pause className="w-6 h-6 mr-2" />{t('session.pause')}</>
                        ) : (
                          <><Play className="w-6 h-6 mr-2 fill-current" />{restTimer === null ? t('common.start') : t('session.resume')}</>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        className="flex-1 h-16 rounded-2xl text-gray-400 hover:text-white"
                        onClick={() => {
                          setRestTimer(targetRestTimer)
                          setIsRestTimerRunning(false)
                        }}
                        title={t('common.reset')}
                      >
                        <RotateCcw className="w-6 h-6" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full h-12 rounded-xl text-gray-500 font-bold uppercase text-xs hover:text-red-400 transition-colors"
                      onClick={() => {
                        setRestTimer(null)
                        setIsRestTimerRunning(false)
                      }}
                    >
                      {t('session.skip')}
                    </Button>
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
                   <span className="text-white truncate">{currentExercise.name}</span>
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
                {exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
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
              onClick={() => navigate('/workouts')}
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
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{ex.name_pt || ex.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{ex.muscle_groups?.[0] || t('session.general')}</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                </button>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
