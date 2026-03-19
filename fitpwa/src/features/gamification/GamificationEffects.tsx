import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ChevronRight } from 'lucide-react'
import type { Achievement } from './useAchievementsStore'
import { SocialShare } from '../progress/SocialShare'
import { useTranslation } from 'react-i18next'

interface LevelUpModalProps {
  level: number
  onClose: () => void
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const { t } = useTranslation()
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="bg-surface-200 border border-primary/30 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden"
        >
          {/* Background Rays Effect */}
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center shadow-lg shadow-primary/40 mb-6"
            >
              <Star className="w-12 h-12 text-black fill-black" />
            </motion.div>

            <h2 className="text-3xl font-black text-white mb-2">{t('gamification.levelUp')}</h2>
            <p className="text-gray-400 mb-6 font-medium">{t('gamification.reachedLevel')} <span className="text-primary text-xl">{level}</span></p>

            <div className="p-4 bg-surface-100 rounded-2xl border border-surface-200 mb-8">
              <p className="text-sm text-gray-300">{t('gamification.rewardUnlocked')}</p>
              <p className="text-primary font-bold">{t('gamification.veteranBadge')}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-12 bg-primary text-black font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {t('common.continue')}
                <ChevronRight className="w-4 h-4" />
              </button>
              <SocialShare 
                title="Novo Nível Alcançado!"
                text={`Cheguei ao nível ${level} no TitanPulse! 🚀💪`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

interface AchievementToastProps {
  achievement: Achievement
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-50 bg-surface-200 border-2 border-primary rounded-2xl p-4 shadow-2xl flex items-center gap-4 cursor-pointer"
      onClick={onClose}
    >
      <div className="text-4xl">{achievement.icon}</div>
      <div className="flex-grow">
        <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider mb-1">
          <Trophy className="w-3 h-3" /> {t('gamification.achievementUnlocked')}
        </div>
        <h4 className="text-white font-bold leading-tight">{achievement.title}</h4>
        <p className="text-gray-400 text-xs mt-1">{achievement.description}</p>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <SocialShare 
          title="Nova Conquista Desbloqueada!"
          text={`Desbloqueei a conquista "${achievement.title}" no TitanPulse! 🏆\n${achievement.description}`}
        />
      </div>
    </motion.div>
  )
}
