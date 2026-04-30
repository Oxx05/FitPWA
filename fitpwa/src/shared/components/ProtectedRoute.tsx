import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading, profileFetchFailed } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Determine whether onboarding is needed.
  //
  // We are confident the user is NEW only when:
  //   1. Profile loaded successfully (not a stub from a network error), AND
  //   2. full_name is empty, AND
  //   3. No local completion flag (fallback for same-device returning users)
  //
  // If the profile fetch failed we let the user through — they may be a
  // returning user whose DB query failed transiently. Sending them to
  // onboarding would wipe all their settings.
  const userId = session.user.id
  const hasLocalFlag = localStorage.getItem(`onboarding_complete_${userId}`) === '1'
  const profileLoadedSuccessfully = profile !== null && !profileFetchFailed
  const isFreshUser = profileLoadedSuccessfully && !profile.full_name?.trim() && !hasLocalFlag

  if (isFreshUser && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // If the user already completed onboarding, don't let them back in
  if (!isFreshUser && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
