import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, User, Crown, Zap, Users, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { useTranslation } from 'react-i18next'
import { OfflineSyncService } from '@/shared/lib/offlineSync'

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
      
      // If count was > 0 and now is 0, show success briefly
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
      <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-red-500" />
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">Offline</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
        <RefreshCw className={`w-3.5 h-3.5 text-yellow-500 ${isSyncing ? 'animate-spin' : ''}`} />
        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tight">
          {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
        </span>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
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

  // Don't show navbar on login/register/onboarding or during active session
  const hideNavbar = ['/login', '/register', '/onboarding', '/session'].includes(location.pathname)
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
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 bg-surface-200 border-r border-surface-100 z-40 items-center py-8 gap-8">
        <Link to="/dashboard" className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20">
          <Zap className="w-6 h-6" />
        </Link>
        
        <SyncStatus />

        <div className="flex flex-col gap-8 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`p-3 rounded-2xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-500 hover:text-white hover:bg-surface-100'
              }`}
            >
              {item.icon}
            </Link>
          ))}
        </div>
        {!profile?.is_premium && (
          <Link to="/premium" className="mt-auto p-3 text-yellow-500 hover:scale-110 transition-transform">
            <Crown className="w-6 h-6" />
          </Link>
        )}
      </nav>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <div className="pointer-events-auto shadow-2xl">
          <SyncStatus />
        </div>
      </div>
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-200/80 backdrop-blur-lg border-t border-surface-100 z-40 flex justify-around items-center px-2 py-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${
              location.pathname === item.path 
                ? 'text-primary scale-110' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
