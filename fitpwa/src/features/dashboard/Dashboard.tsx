
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { getLevelProgress } from '@/shared/utils/gamification'
import { GamificationManager } from '@/features/gamification/GamificationManager'

import { Crown, TrendingUp, Flame, Zap, Play } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { SmartInsights } from './components/SmartInsights'
import { CommunityChallenge } from '../social/components/CommunityChallenge'
import { PetWidget } from '../pet/PetWidget'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export function Dashboard() {
  const { profile, signOut } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [hasActiveSession, setHasActiveSession] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('titanpulse_active_session')
    setHasActiveSession(!!raw)
  }, [])

  const levelProgress = getLevelProgress(profile?.xp_total || 0)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center bg-surface-200 p-6 rounded-3xl shadow-lg border border-surface-100">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
            {t('dashboard.greeting', { name: profile?.full_name?.split(' ')[0] || t('common.athlete') })}
          </h1>
          <p className="text-gray-400 mt-1">{t('dashboard.readyForWorkout')}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold text-sm">{t('common.level')} {profile?.level || 1}</span>
              <span className="text-gray-400 text-xs">{profile?.xp_total || 0} XP</span>
            </div>
            <div className="w-32 h-2 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-500 hover:text-white h-auto py-0 px-0 text-xs">
            {t('auth.logout')}
          </Button>
        </div>
      </motion.div>

      {/* Active Session Banner */}
      {hasActiveSession && (
        <motion.div
          variants={itemVariants}
          onClick={() => navigate('/session')}
          className="bg-primary/15 border border-primary/40 p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-primary/10 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase italic tracking-tight">{t('dashboard.activeSessionBanner')}</p>
              <p className="text-primary/80 text-xs font-bold">{t('dashboard.continueWorkout')} →</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <CommunityChallenge />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SmartInsights hideIcon={true} />
      </motion.div>

      {/* Virtual Pet */}
      <motion.div variants={itemVariants}>
        <PetWidget />
      </motion.div>

      {/* Premium CTA */}
      {!profile?.is_premium && (
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20 border border-primary/30 p-5 rounded-3xl flex items-center justify-between shadow-xl shadow-primary/5 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <p className="text-white font-black text-base italic uppercase tracking-tight">{t('dashboard.unlockPro')}</p>
              <p className="text-gray-400 text-xs">{t('dashboard.proDescription')}</p>
            </div>
          </div>
          <Link to="/premium" className="relative z-10">
            <Button size="sm" className="font-black uppercase tracking-tighter">
              {t('dashboard.learnMore')}
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats Cards + Today's Workout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="bg-surface-200 p-6 rounded-3xl border border-surface-100 shadow-md transition-shadow hover:shadow-primary/5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-gray-400 font-medium">{t('dashboard.currentStreak')}</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white italic">{profile?.login_streak || 0}</span>
            <span className="text-primary font-black mb-1 uppercase text-xs tracking-widest">{t('common.days')} 🔥</span>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="bg-surface-200 p-6 rounded-3xl border border-surface-100 shadow-md md:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-white font-bold italic uppercase tracking-tight">{t('dashboard.todayWorkout')}</h3>
          </div>
          <div className="bg-surface-100/50 rounded-2xl p-5 flex justify-between items-center border border-white/5">
            <div>
              <h4 className="font-black text-xl text-primary italic uppercase tracking-tighter">{t('dashboard.selectPlan')}</h4>
              <p className="text-sm text-gray-400">{t('dashboard.chooseSession')}</p>
            </div>
            <Link to="/workouts">
              <Button className="font-black uppercase tracking-tighter">{t('dashboard.startWorkout')}</Button>
            </Link>
          </div>
        </motion.div>
      </div>



      <motion.div variants={itemVariants}>
        <GamificationManager />
      </motion.div>
    </motion.div>
  )
}
