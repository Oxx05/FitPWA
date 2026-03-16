import { useEffect, useState } from 'react'
import { useAuthStore } from '../auth/AuthProvider'
import { type Achievement } from './useAchievementsStore'
import { LevelUpModal, AchievementToast } from './GamificationEffects'
import { AnimatePresence } from 'framer-motion'

export function GamificationManager() {
  const { profile } = useAuthStore()
  const [lastLevel, setLastLevel] = useState<number | null>(null)
  const [showLevelUp, setShowLevelUp] = useState<number | null>(null)
  const [activeToasts, setActiveToasts] = useState<Achievement[]>([])

  useEffect(() => {
    if (!profile) return

    // Level Up check
    if (lastLevel !== null && profile.level && profile.level > lastLevel) {
      setShowLevelUp(profile.level)
    }
    setLastLevel(profile.level || 1)
  }, [profile?.level])

  // To simplify, we could expose a way to trigger achievement checks from other components
  // or use a global discovery system. For now, we'll rely on the stores.

  return (
    <>
      {showLevelUp && (
        <LevelUpModal 
          level={showLevelUp} 
          onClose={() => setShowLevelUp(null)} 
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
