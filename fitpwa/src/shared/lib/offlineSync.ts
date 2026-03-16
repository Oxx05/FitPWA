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

class OfflineDatabase extends Dexie {
  workouts!: Table<OfflineWorkout>
  personalRecords!: Table<OfflinePersonalRecord>
  plans!: Table<OfflinePlan>

  constructor() {
    super('FitPWA')
    this.version(1).stores({
      workouts: '++id, workoutId, userId, synced',
      personalRecords: '++id, prId, userId, exerciseId, synced',
      plans: '++id, planId, userId, synced',
    })
  }
}

const db = new OfflineDatabase()

export class OfflineSyncService {
  /**
   * Save workout locally for offline sync
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
    errors: string[]
  }> {
    const errors: string[] = []
    let workoutsSynced = 0
    let prsSynced = 0
    let plansSynced = 0

    try {
      // Sync workouts
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

      // Sync PRs
      const prs = await this.getUnsyncedPRs()
      for (const pr of prs) {
        try {
          await supabase.from('personal_records').upsert({
            user_id: userId,
            exercise_id: pr.exerciseId,
            weight_kg: pr.weightKg,
            reps: pr.reps,
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

      // Sync plans
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
      errors,
    }
  }

  /**
   * Clear all local data (after successful sync)
   */
  static async clearSyncedData(): Promise<void> {
    await db.workouts.where('synced').equals(1).delete()
    await db.personalRecords.where('synced').equals(1).delete()
    await db.plans.where('synced').equals(1).delete()
  }

  /**
   * Check if there is unsynced data
   */
  static async hasUnsyncedData(): Promise<boolean> {
    const workoutsCount = await db.workouts.where('synced').equals(0).count()
    const prsCount = await db.personalRecords.where('synced').equals(0).count()
    const plansCount = await db.plans.where('synced').equals(0).count()

    return workoutsCount > 0 || prsCount > 0 || plansCount > 0
  }

  /**
   * Get count of unsynced items
   */
  static async getUnsyncedCount(): Promise<{
    workouts: number
    prs: number
    plans: number
  }> {
    return {
      workouts: await db.workouts.where('synced').equals(0).count(),
      prs: await db.personalRecords.where('synced').equals(0).count(),
      plans: await db.plans.where('synced').equals(0).count(),
    }
  }
}

/**
 * Monitor online/offline status and auto-sync
 */
export function initializeOfflineSync(userId: string): void {
  // Listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('Connection restored, syncing offline data...')
    const result = await OfflineSyncService.syncAllData(userId)
    console.log('Sync completed:', result)

    // Clear synced data
    if (result.workoutsSynced > 0 || result.prsSynced > 0 || result.plansSynced > 0) {
      await db.workouts.where('synced').equals(1).delete()
      await db.personalRecords.where('synced').equals(1).delete()
      await db.plans.where('synced').equals(1).delete()
    }

    if (result.errors.length > 0) {
      console.warn('Sync errors:', result.errors)
    }
  })

  // Sync periodically (every 5 minutes)
  setInterval(async () => {
    if (navigator.onLine && (await OfflineSyncService.hasUnsyncedData())) {
      await OfflineSyncService.syncAllData(userId)
    }
  }, 5 * 60 * 1000)
}

export default db
