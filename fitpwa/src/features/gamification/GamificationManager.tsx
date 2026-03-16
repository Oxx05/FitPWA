import { useState } from 'react'
import { useAuthStore } from '../auth/authStore'
import { type Achievement } from './useAchievementsStore'
import { LevelUpModal, AchievementToast } from './GamificationEffects'
import { AnimatePresence } from 'framer-motion'

export function GamificationManager() {
  const { pendingLevelUp, clearPendingLevelUp } = useAuthStore()
  const [activeToasts, setActiveToasts] = useState<Achievement[]>([])

  // To simplify, we could expose a way to trigger achievement checks from other components
  // or use a global discovery system. For now, we'll rely on the stores.

  return (
    <>
      {pendingLevelUp && (
        <LevelUpModal 
          level={pendingLevelUp} 
          onClose={clearPendingLevelUp} 
        />
      )}

      <div className="fixed bottom-24 right-4 md:right-8 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {activeToasts.map((achievement) => (
            <AchievementToast 
              key={achievement.id} 
              achievement={achievement} 
              onClose={() => setActiveToasts(prev => prev.filter(a => a.id !== achievement.id))} 
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
