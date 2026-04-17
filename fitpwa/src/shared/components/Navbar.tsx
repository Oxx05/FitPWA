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
        className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse"
      >
        <WifiOff className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Offline</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        role="status"
        aria-label={`${pendingCount} ${pendingCount === 1 ? 'item pendente' : 'itens pendentes'}`}
        className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-yellow-500 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tight">
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
        className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Sincronizado</span>
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
    { label: t('nav.home'), path: '/dashboard', icon: <Home className="w-6 h-6" /> },
    { label: t('nav.workouts'), path: '/workouts', icon: <Dumbbell className="w-6 h-6" /> },
    { label: t('nav.social'), path: '/friends', icon: <Users className="w-6 h-6" /> },
    { label: t('nav.progress'), path: '/progress', icon: <BarChart2 className="w-6 h-6" /> },
    { label: t('nav.profile'), path: '/profile', icon: <User className="w-6 h-6" /> },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 bg-surface-200 border-r border-surface-100 z-40 items-center py-8 gap-8"
      >
        <Link
          to="/dashboard"
          aria-label="TitanPulse — início"
          className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20"
        >
          <Zap className="w-6 h-6" aria-hidden="true" />
        </Link>

        <SyncStatus />

        <div className="flex flex-col gap-8 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative p-3 rounded-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-white hover:bg-surface-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="desktop-nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                  />
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
            className="mt-auto p-3 text-yellow-500 transition-transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Crown className="w-6 h-6" aria-hidden="true" />
          </Link>
        )}
      </nav>

      {/* Mobile Sync Status */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto shadow-2xl">
          <SyncStatus />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-200/80 backdrop-blur-lg border-t border-surface-100 z-40 flex justify-around items-center px-2 py-2"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center gap-1 min-w-[52px] min-h-[44px] justify-center px-2 rounded-xl"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-0 inset-y-0.5 bg-primary/15 border border-primary/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-tighter leading-none relative z-10 transition-colors duration-150 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
