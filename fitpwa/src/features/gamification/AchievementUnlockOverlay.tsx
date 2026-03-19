import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Share2, X } from 'lucide-react'
import { Button } from '@/shared/components/Button'

export interface AchievementUnlock {
  id: string
  title: string
  title_pt: string
  description: string
  description_pt: string
  icon: string
  level: number
}

interface AchievementUnlockOverlayProps {
  unlocks: AchievementUnlock[]
  onClose: () => void
}

export function AchievementUnlockOverlay({ unlocks, onClose }: AchievementUnlockOverlayProps) {
  const { t, i18n } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const isPt = i18n.language === 'pt'
  const current = unlocks[currentIndex]

  useEffect(() => {
    if (unlocks.length > 0) {
      // Play a sound if possible (optional)
      // window.navigator.vibrate?.([100, 50, 100])
    }
  }, [unlocks])

  if (!current) return null

  const handleNext = () => {
    if (currentIndex < unlocks.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const tierColor = current.level === 4 ? 'text-blue-400' : 
                   current.level === 3 ? 'text-yellow-500' : 
                   current.level === 2 ? 'text-gray-400' : 'text-amber-700'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 20, opacity: 0 }}
          className="relative max-w-sm w-full bg-surface-200 border border-white/10 rounded-[40px] p-8 text-center shadow-2xl overflow-hidden"
        >
          {/* Particles/Background Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 space-y-6">
            <motion.div
              initial={{ rotate: -10, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
              className="w-32 h-32 mx-auto bg-surface-100 rounded-full flex items-center justify-center text-6xl shadow-inner border border-white/5 relative"
            >
              {current.icon}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-4 border-primary/30"
              />
            </motion.div>

            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className={`text-xs font-black uppercase tracking-[0.2em] ${tierColor}`}>
                  {current.level === 4 ? t('gamification.platinum') : current.level === 3 ? t('gamification.gold') : current.level === 2 ? t('gamification.silver') : t('gamification.bronze')} {t('gamification.unlockedTitle')}
                </p>
                <h2 className="text-3xl font-black text-white leading-tight">
                  {isPt ? current.title_pt : current.title}
                </h2>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gray-400 text-sm px-4"
              >
                {isPt ? current.description_pt : current.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3 pt-4"
            >
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-primary/20"
              >
                {currentIndex < unlocks.length - 1 ? t('common.next') : t('common.awesome')}
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full text-gray-400 hover:text-white gap-2"
              >
                <Share2 className="w-4 h-4" />
                {t('common.share')}
              </Button>
            </motion.div>
          </div>

          {/* Progress dots if multiple */}
          {unlocks.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {unlocks.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-4 bg-primary' : 'bg-surface-100'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Confetti-like effect (Simplified) */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                opacity: 1 
              }}
              animate={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                scale: Math.random() * 1.5,
                opacity: 0
              }}
              transition={{ 
                duration: 1.5, 
                delay: 0.2,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="absolute w-2 h-2 rounded-full bg-primary/40"
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
