import Dexie from 'dexie'
import type { Table } from 'dexie'
import { supabase } from './supabase'

/**
 * Local database for offline-first synchronization
 * Uses Dexie to store workout history, PRs, and plans locally
 */

export interface OfflineWorkout {
  id?: number
  workoutId: string
  userId: string
  planId?: string
  exerciseId: string
  setsCompleted: number
  durationSeconds: number
  createdAt: string
  synced: boolean
  syncedAt?: string
}

export interface OfflinePersonalRecord {
  id?: number
  prId: string
  userId: string
  exerciseId: string
  weightKg: number
  reps: number
  oneRepMax: number
  dateSet: string
  synced: boolean
  syncedAt?: string
}

export interface OfflinePlan {
  id?: number
  planId: string
  userId: string
  name: string
  description: string
  exercises: string // JSON stringified
  difficulty: string
  createdAt: string
  synced: boolean
  syncedAt?: string
}

export interface OfflineSession {
  id?: number
  sessionId: string // Local UUID for association
  userId: string
  planId?: string
  planName?: string
  durationSeconds: number
  totalVolumeKg: number
  notes?: string
  finishedAt: string
  synced: boolean
}

export interface OfflineSet {
  id?: number
  sessionId: string // Refers to OfflineSession.sessionId
  exerciseId: string
  exerciseName: string
  setNumber: number
  reps: number | null
  weightKg: number | null
  notes?: string
  synced: boolean
}

export interface OfflinePlanCache {
  id: string // Supabase ID
  name: string
  description?: string
  exercises: {
    id: string
    exercise_id: string
    sets: number
    reps_min: number
    reps_max: number
    weight_kg: number | null
    rest_seconds: number
    order_index: number
    exercise_name?: string
  }[]
  difficulty: string
  updatedAt: string
}

export interface OfflineExerciseCache {
  id: string // Supabase ID
  name: string
  name_pt?: string
  muscleGroups: string[]
  movementType: string
  equipment: string[]
  difficulty: string
}

class OfflineDatabase extends Dexie {
  workouts!: Table<OfflineWorkout>
  personalRecords!: Table<OfflinePersonalRecord>
  plans!: Table<OfflinePlan>
  sessions!: Table<OfflineSession>
  sets!: Table<OfflineSet>
  cache_plans!: Table<OfflinePlanCache>
  cache_exercises!: Table<OfflineExerciseCache>

  constructor() {
    super('FitPWA')
    this.version(3).stores({
      workouts: '++id, workoutId, userId, synced',
      personalRecords: '++id, prId, userId, exerciseId, synced',
      plans: '++id, planId, userId, synced',
      sessions: '++id, sessionId, userId, synced',
      sets: '++id, sessionId, exerciseId, synced',
      cache_plans: 'id',
      cache_exercises: 'id, name, name_pt',
    })
  }
}

const db = new OfflineDatabase()

export class OfflineSyncService {
  /**
   * Save a full session locally
   */
  static async saveSessionOffline(session: Omit<OfflineSession, 'id'>, sets: Omit<OfflineSet, 'id'>[]): Promise<void> {
    await db.transaction('rw', db.sessions, db.sets, async () => {
      await db.sessions.add(session)
      await db.sets.bulkAdd(sets)
    })
  }

  /**
   * Save plan to cache
   */
  static async cachePlans(plans: OfflinePlanCache[]): Promise<void> {
    await db.cache_plans.bulkPut(plans)
  }

  /**
   * Get cached plans
   */
  static async getCachedPlans(): Promise<OfflinePlanCache[]> {
    return await db.cache_plans.toArray()
  }

  /**
   * Save exercises to cache
   */
  static async cacheExercises(exercises: OfflineExerciseCache[]): Promise<void> {
    await db.cache_exercises.bulkPut(exercises)
  }

  /**
   * Get cached exercises
   */
  static async getCachedExercises(): Promise<OfflineExerciseCache[]> {
    return await db.cache_exercises.toArray()
  }

  /**
   * Save workout locally for offline sync (Legacy/Simple)
   */
  static async saveWorkoutOffline(workout: Omit<OfflineWorkout, 'id'>): Promise<number> {
    return await db.workouts.add({
      ...workout,
      synced: false,
      createdAt: new Date().toISOString(),
    })
  }

  /**
   * Save PR locally for offline sync
   */
  static async savePROffline(
    pr: Omit<OfflinePersonalRecord, 'id'>
  ): Promise<number> {
    return await db.personalRecords.add({
      ...pr,
      synced: false,
      dateSet: new Date().toISOString(),
    })
  }

  /**
   * Save plan locally for offline sync
   */
  static async savePlanOffline(plan: Omit<OfflinePlan, 'id'>): Promise<number> {
    return await db.plans.add({
      ...plan,
      synced: false,
      createdAt: new Date().toISOString(),
    })
  }

  /**
   * Get all unsynced workouts
   */
  static async getUnsyncedWorkouts(): Promise<OfflineWorkout[]> {
    return await db.workouts.where('synced').equals(0).toArray()
  }

  /**
   * Get all unsynced PRs
   */
  static async getUnsyncedPRs(): Promise<OfflinePersonalRecord[]> {
    return await db.personalRecords.where('synced').equals(0).toArray()
  }

  /**
   * Get all unsynced plans
   */
  static async getUnsyncedPlans(): Promise<OfflinePlan[]> {
    return await db.plans.where('synced').equals(0).toArray()
  }

  /**
   * Sync all offline data when connection is restored
   */
  static async syncAllData(userId: string): Promise<{
    workoutsSynced: number
    prsSynced: number
    plansSynced: number
    sessionsSynced: number
    errors: string[]
  }> {
    const errors: string[] = []
    let workoutsSynced = 0
    let prsSynced = 0
    let plansSynced = 0
    let sessionsSynced = 0

    try {
      // 1. Sync Sessions & Sets (The new robust way)
      const sessions = await db.sessions.where('synced').equals(0).toArray()
      for (const session of sessions) {
        try {
          // Insert session
          const { data: sessionRow, error: sError } = await supabase
            .from('workout_sessions')
            .insert({
              user_id: userId,
              plan_id: session.planId || null,
              plan_name: session.planName || null,
              duration_seconds: session.durationSeconds,
              total_volume_kg: session.totalVolumeKg,
              notes: session.notes || null,
              finished_at: session.finishedAt
            })
            .select('id')
            .single()

          if (sError) throw sError

          // Sync related sets
          const sessionSets = await db.sets
            .where('sessionId')
            .equals(session.sessionId)
            .toArray()

          if (sessionSets.length > 0) {
            const { error: setsError } = await supabase.from('session_sets').insert(
              sessionSets.map(s => ({
                session_id: sessionRow.id,
                exercise_id: s.exerciseId,
                exercise_name: s.exerciseName,
                set_number: s.setNumber,
                reps: s.reps,
                weight_kg: s.weightKg,
                notes: s.notes || null
              }))
            )
            if (setsError) throw setsError
            
            // Mark sets as synced
            await db.sets.where('sessionId').equals(session.sessionId).modify({ synced: true })
          }

          // Mark session as synced
          if (session.id) {
            await db.sessions.update(session.id, { synced: true })
          }
          sessionsSynced++
        } catch (err) {
          errors.push(`Erro ao sincronizar sessão: ${(err as Error).message}`)
        }
      }

      // 2. Sync legacy workouts (if any)
      const workouts = await this.getUnsyncedWorkouts()
      for (const workout of workouts) {
        try {
          await supabase.from('workout_history').insert({
            user_id: userId,
            plan_id: workout.planId || null,
            exercise_id: workout.exerciseId,
            sets_completed: workout.setsCompleted,
            duration_seconds: workout.durationSeconds,
            created_at: workout.createdAt,
          })

          await db.workouts.update(workout.id!, {
            synced: true,
            syncedAt: new Date().toISOString(),
          })

          workoutsSynced++
        } catch (err) {
          errors.push(`Erro ao sincronizar treino: ${(err as Error).message}`)
        }
      }

      // 3. Sync PRs
      const prs = await this.getUnsyncedPRs()
      for (const pr of prs) {
        try {
          await supabase.from('personal_records').upsert({
            user_id: userId,
            exercise_id: pr.exerciseId,
            weight_kg: pr.weightKg,
            reps: pr.reps,
            one_rep_max: pr.oneRepMax,
            date_set: pr.dateSet,
          })

          await db.personalRecords.update(pr.id!, {
            synced: true,
            syncedAt: new Date().toISOString(),
          })

          prsSynced++
        } catch (err) {
          errors.push(`Erro ao sincronizar PR: ${(err as Error).message}`)
        }
      }

      // 4. Sync plans
      const plans = await this.getUnsyncedPlans()
      for (const plan of plans) {
        try {
          await supabase.from('workspace_plans').insert({
            user_id: userId,
            name: plan.name,
            description: plan.description,
            exercises: JSON.parse(plan.exercises),
            difficulty: plan.difficulty,
            created_at: plan.createdAt,
          })

          await db.plans.update(plan.id!, {
            synced: true,
            syncedAt: new Date().toISOString(),
          })

          plansSynced++
        } catch (err) {
          errors.push(`Erro ao sincronizar plano: ${(err as Error).message}`)
        }
      }
    } catch (err) {
      errors.push(`Erro geral na sincronização: ${(err as Error).message}`)
    }

    return {
      workoutsSynced,
      prsSynced,
      plansSynced,
      sessionsSynced,
      errors,
    }
  }

  /**
   * Clear all local data (after successful sync)
   */
  static async clearSyncedData(): Promise<void> {
    const tables = [db.workouts, db.personalRecords, db.plans, db.sessions, db.sets]
    await db.transaction('rw', tables, async () => {
      await db.workouts.where('synced').equals(1).delete()
      await db.personalRecords.where('synced').equals(1).delete()
      await db.plans.where('synced').equals(1).delete()
      await db.sessions.where('synced').equals(1).delete()
      await db.sets.where('synced').equals(1).delete()
    })
  }

  /**
   * Check if there is unsynced data
   */
  static async hasUnsyncedData(): Promise<boolean> {
    const workoutsCount = await db.workouts.where('synced').equals(0).count()
    const prsCount = await db.personalRecords.where('synced').equals(0).count()
    const plansCount = await db.plans.where('synced').equals(0).count()
    const sessionsCount = await db.sessions.where('synced').equals(0).count()

    return workoutsCount > 0 || prsCount > 0 || plansCount > 0 || sessionsCount > 0
  }

  /**
   * Get count of unsynced items
   */
  static async getUnsyncedCount(): Promise<{
    workouts: number
    prs: number
    plans: number
    sessions: number
  }> {
    return {
      workouts: await db.workouts.where('synced').equals(0).count(),
      prs: await db.personalRecords.where('synced').equals(0).count(),
      plans: await db.plans.where('synced').equals(0).count(),
      sessions: await db.sessions.where('synced').equals(0).count(),
    }
  }

  /**
   * Get total count of items pending sync
   */
  static async getSyncQueueSize(): Promise<number> {
    const counts = await this.getUnsyncedCount()
    return (counts.workouts || 0) + (counts.prs || 0) + (counts.plans || 0) + (counts.sessions || 0)
  }
}

/**
 * Monitor online/offline status and auto-sync
 */
export function initializeOfflineSync(userId: string): void {
  const sync = async () => {
    if (!navigator.onLine || !userId) return
    
    if (await OfflineSyncService.hasUnsyncedData()) {
      console.log('Syncing offline data...')
      const result = await OfflineSyncService.syncAllData(userId)
      console.log('Sync completed:', result)
      
      if (result.workoutsSynced > 0 || result.prsSynced > 0 || result.plansSynced > 0 || result.sessionsSynced > 0) {
        await OfflineSyncService.clearSyncedData()
      }

      if (result.errors.length > 0) {
        console.warn('Sync errors:', result.errors)
      }
    }
  }

  // Listen for online events
  window.addEventListener('online', sync)

  // Sync periodically (every 5 minutes)
  setInterval(sync, 5 * 60 * 1000)

  // Initial sync attempt
  void sync()

  // Clean up if needed (though usually global)
  // return () => clearInterval(timer);
}

export default db
