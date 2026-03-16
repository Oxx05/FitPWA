import { createContext, useContext } from 'react'
import type { ActiveSessionRecord } from '@/db/fitpwa.db'

export interface ActiveSessionContextType {
  activeSession: ActiveSessionRecord | null
  startSession: (planId: string, planName: string) => Promise<void>
  endSession: (stats: { volume: number, exercisesCount: number, setsCount: number }) => Promise<void>
  updateSession: (updates: Partial<ActiveSessionRecord>) => Promise<void>
}

export const ActiveSessionContext = createContext<ActiveSessionContextType>({} as ActiveSessionContextType)

export function useActiveSession() {
  return useContext(ActiveSessionContext)
}
