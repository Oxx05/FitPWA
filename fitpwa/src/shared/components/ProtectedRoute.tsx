import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <div className="min-h-screen bg-background text-white flex items-center justify-center">A verificar sessão...</div>
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is logged in but hasn't completed onboarding, and they are not currently ON the onboarding page
  if (session && !profile?.full_name && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
