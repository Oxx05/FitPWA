import { Link, useLocation } from 'react-router-dom'
import { Home, Dumbbell, BarChart2, User, Crown, Zap, Users } from 'lucide-react'
import { useAuthStore } from '@/features/auth/AuthProvider'

export function Navbar() {
  const location = useLocation()
  const { profile } = useAuthStore()

  // Don't show navbar on login/register/onboarding or during active session
  const hideNavbar = ['/login', '/register', '/onboarding', '/session'].includes(location.pathname)
  if (hideNavbar) return null

  const navItems = [
    { label: 'Início', path: '/dashboard', icon: <Home className="w-6 h-6" /> },
    { label: 'Treinos', path: '/workouts', icon: <Dumbbell className="w-6 h-6" /> },
    { label: 'Comunidade', path: '/community', icon: <Users className="w-6 h-6" /> },
    { label: 'Evolução', path: '/progress', icon: <BarChart2 className="w-6 h-6" /> },
    { label: 'Perfil', path: '/profile', icon: <User className="w-6 h-6" /> },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 bg-surface-200 border-r border-surface-100 z-40 items-center py-8 gap-12">
        <Link to="/dashboard" className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20">
          <Zap className="w-6 h-6" />
        </Link>
        <div className="flex flex-col gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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
  )}