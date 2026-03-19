import Dexie, { type Table } from 'dexie'

export interface ActiveSessionRecord {
  id: string
  userId: string
  planId: string
  planName: string
  startedAt: Date
  currentExerciseIndex: number
  currentSetIndex: number
  sets: unknown[] // We can define SessionSetLog later
  timerState: 'idle' | 'active' | 'rest'
  restSeconds: number
}

export interface PendingSyncRecord {
  id?: number
  type: string
  payload: unknown
  createdAt: Date
  synced: boolean
}

export interface ExerciseRecord {
  id: string
  name: string
  muscleGroups: string[]
  // other fields omitted dynamically based on usage
}

export interface WorkoutPlanRecord {
  id: string
  userId: string
  updatedAt: Date
  // other fields omitted
}

export class TitanPulseDatabase extends Dexie {
  activeSessions!: Table<ActiveSessionRecord>
  pendingSync!: Table<PendingSyncRecord>
  cachedExercises!: Table<ExerciseRecord>
  cachedPlans!: Table<WorkoutPlanRecord>

  constructor() {
    super('TitanPulseDB')
    this.version(1).stores({
      activeSessions: 'id, userId, startedAt',
      pendingSync: '++id, type, createdAt, synced',
      cachedExercises: 'id, name, *muscleGroups',
      cachedPlans: 'id, userId, updatedAt',
    })
  }
}

export const db = new TitanPulseDatabase()
