import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, User, Crown, Zap, Users, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'
import { OfflineSyncService } from '@/shared/lib/offlineSync'
import { motion } from 'framer-motion'

function SyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const checkPending = async () => {
      const count = await OfflineSyncService.getSyncQueueSize()

      if (pendingCount > 0 && count === 0 && isOnline) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }

      setPendingCount(count)
      setIsSyncing(count > 0 && navigator.onLine)
    }

    checkPending()
    const interval = setInterval(checkPending, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [pendingCount, isOnline])

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-label="Offline"
        className="flex items-center gap-1.5 px-3 py-1 bg-error/10 border border-error/30 rounded-full backdrop-blur-md"
      >
        <WifiOff className="w-3.5 h-3.5 text-error" aria-hidden="true" />
        <span className="text-[10px] font-bold text-error uppercase tracking-tightest">Offline</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        role="status"
        aria-label={`${pendingCount} ${pendingCount === 1 ? 'item pendente' : 'itens pendentes'}`}
        className="flex items-center gap-1.5 px-3 py-1 bg-warn/10 border border-warn/30 rounded-full backdrop-blur-md"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-warn ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span className="text-[10px] font-bold text-warn uppercase tracking-tightest">
          {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
        </span>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div
        role="status"
        aria-label="Sincronizado"
        className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full backdrop-blur-md"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-tightest">Sincronizado</span>
      </div>
    )
  }

  return null
}

export function Navbar() {
  const location = useLocation()
  const { profile } = useAuthStore()
  const { t } = useTranslation()

  const hideNavbar =
    ['/login', '/register', '/onboarding'].includes(location.pathname) ||
    (location.pathname.startsWith('/session') && location.pathname !== '/session/summary') ||
    /^\/workouts\/.+\/start$/.test(location.pathname)
  if (hideNavbar) return null

  const navItems = [
    { label: t('nav.home', 'Home'), path: '/dashboard', icon: <Home className="w-[22px] h-[22px]" strokeWidth={2.2} /> },
    { label: t('nav.workouts', 'Treinos'), path: '/workouts', icon: <Dumbbell className="w-[22px] h-[22px]" strokeWidth={2.2} /> },
    { label: t('nav.social', 'Social'), path: '/friends', icon: <Users className="w-[22px] h-[22px]" strokeWidth={2.2} /> },
    { label: t('nav.progress', 'Progresso'), path: '/progress', icon: <BarChart2 className="w-[22px] h-[22px]" strokeWidth={2.2} /> },
    { label: t('nav.profile', 'Perfil'), path: '/profile', icon: <User className="w-[22px] h-[22px]" strokeWidth={2.2} /> },
  ]

  return (
    <>
      {/* ========== Desktop Sidebar ========== */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 z-40 items-center py-8 gap-7
                   bg-surface-300/80 backdrop-blur-xl border-r border-white/[0.05]"
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          aria-label="RepTrack — início"
          className="relative w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black
                     shadow-[0_0_24px_-4px_theme(colors.primary.glow)] transition-transform hover:scale-105"
        >
          <Zap className="w-6 h-6" aria-hidden="true" fill="currentColor" />
        </Link>

        <SyncStatus />

        <div className="flex flex-col gap-2 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative px-3 py-3 rounded-2xl transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center ${
                  isActive ? 'text-primary' : 'text-ink-dim hover:text-white'
                }`}
              >
                {isActive && (
                  <>
                    <motion.span
                      layoutId="desktop-nav-pill"
                      className="absolute inset-0 bg-primary/[0.08] border border-primary/25 rounded-2xl"
                      transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                    />
                    <motion.span
                      layoutId="desktop-nav-bar"
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary rounded-r-full shadow-[0_0_12px_theme(colors.primary.glow)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  </>
                )}
                <span className="relative z-10">{item.icon}</span>
              </Link>
            )
          })}
        </div>

        {!profile?.is_premium && (
          <Link
            to="/premium"
            aria-label="Upgrade para Premium"
            className="mt-auto p-3 text-pr transition-transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Crown className="w-6 h-6" aria-hidden="true" />
          </Link>
        )}
      </nav>

      {/* ========== Mobile Sync Status (floats above nav) ========== */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto shadow-2xl">
          <SyncStatus />
        </div>
      </div>

      {/* ========== Mobile Bottom Bar ========== */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 pt-2
                   bg-surface-300/85 backdrop-blur-xl border-t border-white/[0.05]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center gap-1 min-w-[52px] min-h-[48px] justify-center px-2 rounded-xl"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-0 inset-y-0.5 bg-primary/[0.10] border border-primary/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-ink-dim'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-tightest leading-none relative z-10 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-ink-dim'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
