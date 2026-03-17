import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import confetti from 'canvas-confetti'
import { ChevronLeft, ChevronRight, Square, Play, Plus, Trash2, Clock, Maximize2, Minimize2, Zap } from 'lucide-react'
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
  sets: SetRecord[]
  muscleGroups: string[]
  repsMin: number
  repsMax: number
  restSeconds: number
}

export function SessionScreen() {
  const navigate = useNavigate()
  const { id: planId } = useParams<{ id?: string }>()
  const { user, profile, addXp } = useAuthStore()
  const { t } = useTranslation()

  const [exercises, setExercises] = useState<ExerciseInSession[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [planName, setPlanName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'treino' | 'controlo'>('treino')
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [spotifyConnected, setSpotifyConnected] = useState(() => hasValidSpotifyToken())
  const [spotifyPlaying, setSpotifyPlaying] = useState<boolean | null>(null)
  const [spotifyTrack, setSpotifyTrack] = useState<{ name: string; artist: string; albumArt?: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const { speak } = useVoiceGuide()

  // Effect to announce rest end or new exercise
  useEffect(() => {
    if (!voiceEnabled) return

    if (restTimer === 0) {
      speak('Descanso terminado. Próxima série agora!')
    }
  }, [restTimer, voiceEnabled, speak])

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

  // Rest timer effet
  useEffect(() => {
    if (restTimer === null) return
    if (restTimer <= 0) {
      setRestTimer(null)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(t('session.restFinished'), {
          body: t('session.restFinishedBody'),
          icon: '/favicon.ico'
        })
      }
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
        audio.play().catch(() => {})
      } catch { /* audio playback can fail silently on mobile */ }
      return
    }
    const interval = setInterval(() => setRestTimer(t => (t ?? 0) - 1), 1000)
    return () => clearInterval(interval)
  }, [restTimer, t])

  // Load plan data
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        if (!planId) throw new Error('Plan ID missing')

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
            id, order_index, sets, reps_min, reps_max, rest_seconds, weight_kg,
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
            name: (ex?.name_pt as string) || (ex?.name as string) || 'Exercício',
            sets: Array.from({ length: (pe.sets as number) || profile?.default_sets || 3 }, (_, i) => ({
              id: `${pe.id}-${i}`,
              setNumber: i + 1,
              reps: null,
              weight: (pe.weight_kg as number) || null,
              completed: false,
              notes: ''
            })),
            muscleGroups: (ex?.muscle_groups as string[]) || [],
            repsMin: (pe.reps_min as number) || profile?.default_reps_min || 8,
            repsMax: (pe.reps_max as number) || profile?.default_reps_max || 12,
            restSeconds: (pe.rest_seconds as number) || profile?.default_rest_seconds || 90
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

    const redirectUri = `${window.location.origin}/session`
    exchangeSpotifyCode(code, redirectUri).then((token) => {
      if (token) {
        setSpotifyConnected(true)
        showToast('Spotify conectado com sucesso.', 'success')
      } else {
        showToast('Falha ao conectar o Spotify.', 'error')
      }
      clearStoredSpotifyState()
      const returnPath = sessionStorage.getItem('fitpwa.spotify.returnPath')
      sessionStorage.removeItem('fitpwa.spotify.returnPath')
      const nextPath = returnPath || window.location.pathname
      navigate(nextPath, { replace: true })
    }).catch(() => {
      showToast('Falha ao conectar o Spotify.', 'error')
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

  const handleSetChange = (setId: string, field: 'weight' | 'reps' | 'notes', value: number | string | null) => {
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
      setRestTimer(exercise.restSeconds)
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
                reps: null,
                weight: null,
                completed: false
              }
            ]
          }
        : ex
    ))
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
  }

  const finishWorkout = async () => {
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

      // Daily cap check (1500 XP)
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
                    exerciseName: exerciseNameMap.get(b.exerciseId) || 'Exercício',
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
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#00ff87', '#ffffff', '#00e5ff']
                })
              }
            }
            showToast('Treino guardado na cloud.', 'success')
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

            showToast('Sem internet. Treino guardado localmente.', 'info')
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
          showToast('Falha ao guardar online. Guardado localmente.', 'info')
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
        navigate('/session/summary', { state: { stats, duration, xpGained, newPrs } })
        return
      }

      navigate('/session/summary', { state: { stats, duration, xpGained } })
    } catch (error) {
      console.error('Error finishing workout:', error)
      showToast('Erro ao finalizar treino.', 'error')
    }
  }

  const handleSpotifyConnect = async () => {
    const redirectUri = `${window.location.origin}/session`
    const authUrl = await getSpotifyAuthUrl(redirectUri)
    if (!authUrl) {
      showToast('Configura VITE_SPOTIFY_CLIENT_ID para ligar o Spotify.', 'error')
      return
    }
    sessionStorage.setItem('fitpwa.spotify.returnPath', window.location.pathname)
    window.location.href = authUrl
  }

  const handleSpotifyDisconnect = () => {
    clearSpotifyToken()
    setSpotifyConnected(false)
    showToast('Spotify desconectado.', 'info')
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
      showToast('Não foi possível controlar o Spotify.', 'error')
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
      showToast('Não foi possível avançar a música.', 'error')
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
      showToast('Não foi possível voltar a música.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-2">Sem exercícios</h1>
        <p className="text-gray-400 mb-4">Este plano não tem exercícios configurados.</p>
        <Button onClick={() => navigate('/workouts')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-200/90 backdrop-blur border-b border-surface-100 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-bold text-white text-lg">Sessão Activa</h1>
            <p className="text-sm text-gray-400">{currentExerciseIndex + 1} / {exercises.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="p-2 bg-surface-100 rounded-xl text-primary hover:bg-primary/20 transition-all border border-white/5 active:scale-90"
              title={isFocusMode ? "Sair Modo Foco" : "Modo Foco Imersivo"}
            >
              {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <div className="text-right flex items-center gap-3">
              {restTimer !== null && (
                <div 
                  onClick={() => setRestTimer(null)}
                  className="bg-primary/20 px-2 py-1 rounded border border-primary/30 animate-pulse cursor-pointer hover:bg-primary/30 transition-colors flex flex-col items-center"
                  title="Pular descanso"
                >
                   <p className="text-primary font-mono font-bold leading-none">{formatTime(restTimer)}</p>
                   <p className="text-[8px] text-primary/70 uppercase">Pular</p>
                </div>
              )}
              <div>
                <p className="text-white font-mono font-bold leading-none">{formatTime(duration)}</p>
                <p className="text-[8px] text-gray-400 uppercase">Duração</p>
              </div>
            </div>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => setShowFinishModal(true)}
              className="gap-1"
            >
              <Square className="w-4 h-4" />
              Terminar
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
            Treino
          </button>
          <button
            onClick={() => setActiveTab('controlo')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'controlo' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white'
            }`}
          >
            Controlo
          </button>
        </div>


        {activeTab === 'treino' ? (
          <>
            {/* Exercise Card */}
            <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentExercise.name}</h2>
                  <p className="text-sm text-gray-400 capitalize mt-1">
                    {currentExercise.muscleGroups.join(', ')}
                  </p>
                </div>
                <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {currentExercise.repsMin}–{currentExercise.repsMax} reps
                </span>
              </div>

              <div className="grid grid-cols-[32px_1fr_1fr_64px] gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-2 items-center">
                <span className="text-center">Set</span>
                <span className="text-center">Kg</span>
                <span className="text-center">Reps</span>
                <span className="text-center">Feito</span>
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
                        className={`w-14 sm:w-16 h-12 sm:h-14 flex items-center justify-center rounded-xl transition-all font-bold text-lg sm:text-xl shadow-sm ${
                          set.completed
                            ? 'bg-primary text-black shadow-primary/20 scale-[0.98]'
                            : 'bg-surface-200 border border-surface-100 text-gray-400 hover:bg-primary/20 hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {set.completed ? '✓' : '○'}
                      </button>
                    </div>

                    {/* Secondary Row (Notes & Actions) */}
                    <div className="flex items-center gap-2 pl-8 sm:pl-11 mt-1">
                      <input
                        type="text"
                        value={set.notes || ''}
                        onChange={e => handleSetChange(set.id, 'notes', e.target.value)}
                        placeholder="Adicionar nota (ex: mais devagar)..."
                        className="flex-1 bg-transparent border-b border-surface-200 focus:border-primary text-xs sm:text-sm text-gray-400 placeholder-gray-600 pb-1 focus:outline-none transition-colors"
                      />
                      {idx > 0 && (
                        <button
                          onClick={() => handleCopyPreviousSet(set.id)}
                          className="text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-white bg-surface-200 rounded-md px-2 py-1 transition-colors"
                        >
                          Copiar Ant.
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

              <button
                onClick={handleAddSet}
                className="w-full h-10 border border-dashed border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Série
              </button>
            </div>

          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Notas do Treino</h3>
              <textarea
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                placeholder="Anota aqui tudo o que for importante sobre o treino em geral..."
                className="w-full bg-surface-100 border border-surface-200 rounded-lg p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-primary resize-none h-24 shadow-inner mt-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Tempo Total</p>
                <p className="text-2xl font-bold text-white">{formatTime(duration)}</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Descanso</p>
                <p className="text-2xl font-bold text-white">{restTimer !== null ? `${restTimer}s` : '—'}</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Volume (completado)</p>
                <p className="text-2xl font-bold text-white">{completedVolume.toFixed(0)} kg</p>
              </div>
              <div className="bg-surface-200 border border-surface-100 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Sets Completados</p>
                <p className="text-2xl font-bold text-white">{completedSetsCount}</p>
              </div>
            </div>

            <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Exercícios (ordem do treino)</h3>
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
                      Anterior
                    </Button>
                    <Button onClick={handleSpotifyPlayPause}>
                      {spotifyPlaying ? 'Pausar' : 'Play'}
                    </Button>
                    <Button variant="secondary" onClick={handleSpotifyNext}>
                      Seguinte
                    </Button>
                    <Button variant="secondary" onClick={handleSpotifyDisconnect}>
                      Desconectar
                    </Button>
                    {isDesktop && (
                      <Button onClick={() => window.open('https://open.spotify.com', '_blank')}>
                        Abrir Spotify
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={handleSpotifyConnect}>
                    Ligar Spotify
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {restTimer !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-28 left-4 right-4 z-50 pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-primary text-black p-4 rounded-2xl shadow-2xl flex items-center justify-between pointer-events-auto border-2 border-white/20">
              <div className="flex items-center gap-4">
                <div className="bg-black/10 p-2 rounded-xl">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-60">{t('session.restInProgress')}</p>
                  <p className="text-3xl font-black italic tabular-nums leading-none">
                    {formatTime(restTimer)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setRestTimer(null)}
                className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded-xl font-black uppercase text-xs transition-colors"
              >
                {t('session.ignore')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="flex-1 gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('common.back')}
          </Button>

          <Button
            variant={isRunning ? 'secondary' : 'ghost'}
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 gap-2"
          >
            {isRunning ? (
              <>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {t('session.inProgress')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {t('session.resume')}
              </>
            )}
          </Button>

          <Button
            disabled={currentExerciseIndex === exercises.length - 1}
            onClick={() => setCurrentExerciseIndex(i => i + 1)}
            className="flex-1 gap-2"
          >
            {t('common.next')}
            <ChevronRight className="w-5 h-5" />
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
            className="fixed inset-0 z-[60] bg-[#0A0A0B] flex flex-col p-6"
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
                    if (next) speak(t('session.startingVoice'))
                  }}
                  className={`p-3 rounded-2xl transition-all ${voiceEnabled ? 'bg-primary/20 text-primary' : 'bg-surface-200 text-gray-500'}`}
                  title={t('profile.notifications')}
                >
                  <Zap className={`w-6 h-6 ${voiceEnabled ? 'animate-pulse' : ''}`} />
                </button>
                <button 
                  onClick={() => setIsFocusMode(false)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20"
                >
                  <Minimize2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center gap-8 max-w-lg mx-auto w-full">
              <div className="text-center space-y-2">
                <p className="text-primary font-black uppercase tracking-widest text-xs">{t('session.trainingNow')}</p>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
                  {currentExercise.name}
                </h2>
                <div className="inline-flex bg-surface-200 px-6 py-2 rounded-full border border-white/10 gap-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t('common.goal')}</span>
                      <span className="text-sm text-white font-black">{currentExercise.repsMin}-{currentExercise.repsMax} {t('session.reps')}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{t('editor.rest')}</span>
                      <span className="text-sm text-white font-black">{currentExercise.restSeconds}s</span>
                   </div>
                </div>
              </div>

              {/* Huge Active Set Display */}
              <div className="bg-surface-200 border-2 border-primary/20 p-8 rounded-[40px] shadow-2xl shadow-primary/5 flex flex-col gap-8">
                 {(() => {
                    const activeSet = currentExercise.sets.find(s => !s.completed) || currentExercise.sets[currentExercise.sets.length - 1]
                    return (
                      <>
                        <div className="flex justify-between items-center px-4">
                          <span className="text-gray-500 font-black text-sm uppercase">{t('session.set')} {activeSet.setNumber}</span>
                          {restTimer !== null && (
                            <span className="text-primary font-black animate-pulse">{t('session.restTimer').toUpperCase()}: {formatTime(restTimer)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="flex-1 space-y-2">
                             <p className="text-xs font-bold text-gray-500 uppercase text-center">{t('editor.weight')}</p>
                             <DebouncedNumericInput
                                value={activeSet.weight}
                                onChange={val => handleSetChange(activeSet.id, 'weight', val)}
                                className="w-full h-24 bg-background border-2 border-surface-100 rounded-3xl text-center text-5xl font-black text-white focus:border-primary transition-all"
                             />
                           </div>
                           <div className="text-4xl font-black text-gray-700 mt-6">×</div>
                           <div className="flex-1 space-y-2">
                             <p className="text-xs font-bold text-gray-500 uppercase text-center">{t('session.reps')}</p>
                             <DebouncedNumericInput
                                value={activeSet.reps}
                                onChange={val => handleSetChange(activeSet.id, 'reps', val)}
                                className="w-full h-24 bg-background border-2 border-surface-100 rounded-3xl text-center text-5xl font-black text-white focus:border-primary transition-all"
                             />
                           </div>
                        </div>

                        <Button 
                          size="lg"
                          variant={activeSet.completed ? "secondary" : "primary"}
                          className="h-20 rounded-3xl text-2xl font-black uppercase italic tracking-tighter"
                          onClick={() => handleCompleteSet(activeSet.id)}
                        >
                          {activeSet.completed ? t('session.setCompleted') : t('session.completeSet')}
                        </Button>
                      </>
                    )
                 })()}
              </div>
            </div>

            <div className="mt-auto flex justify-between gap-4 pt-8">
              <Button 
                variant="ghost" 
                className="flex-1 h-16 rounded-2xl text-gray-400 font-black uppercase"
                disabled={currentExerciseIndex === 0}
                onClick={() => setCurrentExerciseIndex(i => i - 1)}
              >
                {t('common.back')}
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1 h-16 rounded-2xl text-white font-black uppercase border border-white/10"
                disabled={currentExerciseIndex === exercises.length - 1}
                onClick={() => setCurrentExerciseIndex(i => i + 1)}
              >
                {t('session.nextExercise')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={finishWorkout}
              className="flex-1"
            >
              {t('session.yesFinish')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
