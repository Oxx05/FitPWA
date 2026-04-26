
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { getLevelProgress } from '@/shared/utils/gamification'
import { GamificationManager } from '@/features/gamification/GamificationManager'

import { Crown, TrendingUp, Flame, Zap, Play, Ruler, ArrowRight } from 'lucide-react'
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
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
}

export function Dashboard() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [hasActiveSession, setHasActiveSession] = useState(false)

  useEffect(() => {
    const checkSession = () => {
      const raw = localStorage.getItem('titanpulse_active_session')
      setHasActiveSession(!!raw)
    }
    checkSession()
    // Recheck whenever this tab regains focus or storage changes from another tab,
    // so the "active session" banner stays in sync with reality.
    window.addEventListener('focus', checkSession)
    window.addEventListener('storage', checkSession)
    return () => {
      window.removeEventListener('focus', checkSession)
      window.removeEventListener('storage', checkSession)
    }
  }, [])

  const levelProgress = getLevelProgress(profile?.xp_total || 0)
  const firstName = profile?.full_name?.split(' ')[0] || t('common.athlete')
  const dateLocale = i18n.language === 'en' ? 'en-US' : 'pt-PT'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-6"
    >
      {/* ============ HERO HEADER ============ */}
      <motion.section
        variants={itemVariants}
        className="card-surface bg-atmos with-grain relative overflow-hidden p-6 md:p-8"
      >
        {/* Diagonal decoration */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-ink-dim font-mono text-[11px] tracking-tightest uppercase mb-2">
              {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: '2-digit', month: 'short' })}
            </p>
            <h1 className="text-display text-5xl md:text-7xl text-white tracking-crush leading-[0.85]">
              {t('dashboard.hi')},<br />
              <span className="text-primary">{firstName.toUpperCase()}</span>
            </h1>
            <p className="text-ink-muted mt-3 max-w-sm">
              {t('dashboard.readyForWorkout')}
            </p>
          </div>

          {/* Level pill */}
          <div className="shrink-0 flex flex-col items-end">
            <div className="card-surface !rounded-2xl px-3 py-2 bg-surface-200/60 border-white/10">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-bold text-[11px] uppercase tracking-tightest">
                  {t('common.level')} {profile?.level || 1}
                </span>
              </div>
              <div className="w-24 h-1.5 bg-surface-300 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-primary-deep rounded-full"
                />
              </div>
              <span data-numeric className="block text-right text-ink-dim text-[10px] font-mono mt-1">
                {profile?.xp_total || 0} XP
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============ ACTIVE SESSION BANNER ============ */}
      {hasActiveSession && (
        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/session')}
          className="w-full text-left bg-primary/[0.10] border border-primary/40 p-4 rounded-2xl
                     flex items-center justify-between active:scale-[0.99] transition-transform
                     shadow-glow-primary animate-pulse-glow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-black flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-white font-bold text-sm uppercase tracking-tightest">
                {t('dashboard.activeSessionBanner')}
              </p>
              <p className="text-primary text-xs font-bold">
                {t('dashboard.continueWorkout')} →
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-primary" />
        </motion.button>
      )}

      {/* ============ STATS + TODAY CTA ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak card */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="card-surface p-6 relative overflow-hidden group"
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-orange-500/[0.06] blur-2xl"
          />
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h3 className="text-ink-muted font-bold text-[11px] uppercase tracking-tightest">
              {t('dashboard.currentStreak')}
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span data-numeric className="text-display text-7xl text-white leading-none">
              {profile?.login_streak || 0}
            </span>
            <span className="text-orange-400 font-bold uppercase text-[10px] tracking-tightest">
              {t('common.days')} 🔥
            </span>
          </div>
        </motion.div>

        {/* Today's workout CTA */}
        <motion.div
          variants={itemVariants}
          className="card-surface p-6 md:col-span-2 relative overflow-hidden group"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-ink-muted font-bold text-[11px] uppercase tracking-tightest">
              {t('dashboard.todayWorkout')}
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h4 className="text-display text-3xl md:text-4xl text-primary leading-none">
                {t('dashboard.selectPlan').toUpperCase()}
              </h4>
              <p className="text-sm text-ink-muted mt-1">
                {t('dashboard.chooseSession')}
              </p>
            </div>
            <Link to="/workouts" className="shrink-0">
              <Button size="lg">
                {t('dashboard.startWorkout')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ============ TOOLS / BENCH ANGLE ============ */}
      <motion.div variants={itemVariants}>
        <Link
          to="/tools/bench-angle"
          className="block card-surface relative overflow-hidden p-5 md:p-6 group
                     hover:border-primary/30 transition-colors"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-mesh-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0
                            group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Ruler className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="badge-tag border-primary/30 text-primary mb-1.5">{t('dashboard.badgeNew')}</p>
              <h3 className="text-display text-2xl text-white leading-none">{t('dashboard.benchAngleCardTitle')}</h3>
              <p className="text-ink-muted text-sm mt-1">
                {t('dashboard.benchAngleCardDesc')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SmartInsights hideIcon={true} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <CommunityChallenge />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PetWidget />
      </motion.div>

      <motion.div variants={itemVariants}>
        <GamificationManager />
      </motion.div>

      {/* ============ PREMIUM CTA ============ */}
      {!profile?.is_premium && (
        <motion.div variants={itemVariants}>
          <Link
            to="/premium"
            className="block relative overflow-hidden rounded-3xl p-5 md:p-6 group
                       bg-gradient-to-br from-pr/10 via-surface-100 to-accent/10
                       border border-pr/30 shadow-card transition-transform hover:scale-[1.005]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-pr/15 border border-pr/40 flex items-center justify-center text-pr shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-display text-2xl leading-none tracking-tightest">
                    {t('dashboard.unlockPro').toUpperCase()}
                  </p>
                  <p className="text-ink-muted text-xs mt-1">
                    {t('dashboard.proDescription')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="accent" className="shrink-0">
                {t('dashboard.learnMore')}
              </Button>
            </div>
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
