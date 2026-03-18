import React, { useEffect, useState } from 'react'
import { type ActiveSessionRecord, db } from '@/db/fitpwa.db'
import { useAuthStore } from '../auth/authStore'
import { v4 as uuidv4 } from 'uuid'
import { XP_PER_SET, XP_PER_EXERCISE, XP_PER_WORKOUT } from '@/shared/utils/gamification'
import { useAchievementsStore } from '../gamification/useAchievementsStore'
import { ActiveSessionContext } from './ActiveSessionContext'

export function ActiveSessionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore()
  const [activeSession, setActiveSession] = useState<ActiveSessionRecord | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    let cancelled = false
    const run = async () => {
      const sessions = await db.activeSessions.where('userId').equals(session.user.id).toArray()
      if (cancelled) return
      if (sessions.length > 0) {
        const mostRecent = sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0]
        setActiveSession(mostRecent)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const startSession = async (planId: string, planName: string) => {
    if (!session?.user) return

    const newSession: ActiveSessionRecord = {
      id: uuidv4(),
      userId: session.user.id,
      planId,
      planName,
      startedAt: new Date(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      sets: [],
      timerState: 'idle',
      restSeconds: 90
    }

    await db.activeSessions.put(newSession)
    setActiveSession(newSession)
  }

  const updateSession = async (updates: Partial<ActiveSessionRecord>) => {
    if (!activeSession) return
    const updated = { ...activeSession, ...updates }
    await db.activeSessions.put(updated)
    setActiveSession(updated)
  }

  const endSession = async (stats: { volume: number, exercisesCount: number, setsCount: number }) => {
    if (!activeSession || !session?.user) return
    
    const xpGained = XP_PER_WORKOUT + (stats.exercisesCount * XP_PER_EXERCISE) + (stats.setsCount * XP_PER_SET)
    
    const payload = {
      ...activeSession,
      finishedAt: new Date(),
      xpGained,
      volume: stats.volume
    }

    // Update global XP
    const authStore = useAuthStore.getState()
    const achievementsStore = useAchievementsStore.getState()

    authStore.addXp(xpGained)

    // Check Achievements
    const now = new Date()
    const durationMin = (now.getTime() - activeSession.startedAt.getTime()) / (1000 * 60)
    
    const newAchievements = await achievementsStore.checkAchievements(session.user.id, {
      workoutsCount: 1, // Incremental check
      streakDays: authStore.profile?.login_streak || 1,
      sessionVolume: stats.volume,
      level: authStore.profile?.level || 1,
      isEarly: now.getHours() >= 5 && now.getHours() < 9,
      isMidnight: now.getHours() >= 23 || now.getHours() < 4,
      isExtreme: xpGained > 400 || stats.volume > 5000,
      isSpeed: stats.exercisesCount >= 4 && durationMin < 25,
      isWeekend: [0, 6].includes(now.getDay())
    })

    // Store in global state or show toast (we'll need a way to show these)
    console.log('New achievements:', newAchievements)

    // Attempt to save to Supabase. If offline, defer to pendingSync.
    try {
      if (navigator.onLine) {
        // sync logic via Edge Function or direct insert
      } else {
        await db.pendingSync.add({
          type: 'workout_session',
          payload,
          createdAt: new Date(),
          synced: false
        })
      }
    } catch {
      await db.pendingSync.add({
        type: 'workout_session',
        payload,
        createdAt: new Date(),
        synced: false
      })
    }
    
    // Delete from active Dexie table
    await db.activeSessions.delete(activeSession.id)
    setActiveSession(null)
  }

  return (
    <ActiveSessionContext.Provider value={{ activeSession, startSession, updateSession, endSession }}>
      {children}
    </ActiveSessionContext.Provider>
  )
}
