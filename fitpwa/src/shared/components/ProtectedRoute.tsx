import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, isLoading } = useAuthStore()
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

  // Onboarding gate.
  // We only redirect to /onboarding if we are CONFIDENT the user is brand-new:
  //   - profile row exists in DB (so it's loaded — not null) AND
  //   - the full_name field is empty.
  //
  // If `profile` is `null`, the row may simply not have loaded yet (race), or the
  // DB query may have failed. In that case we let the destination render — its
  // own UI will handle the missing profile gracefully — instead of trapping
  // returning users in onboarding every time they sign in.
  const profileLoaded = profile !== null
  const isFreshUser = profileLoaded && !profile?.full_name?.trim()

  if (isFreshUser && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
