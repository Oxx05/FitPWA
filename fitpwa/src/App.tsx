
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { ActiveSessionProvider } from '@/features/session/ActiveSessionProvider'
import { Navbar } from '@/shared/components/Navbar'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { Loader2 } from 'lucide-react'
import { ToastProvider } from '@/shared/contexts/ToastContext'

const queryClient = new QueryClient()

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OnboardingFlow = React.lazy(() => import('@/features/auth/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })))
const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const LevelUpOverlay = React.lazy(() => import('@/features/auth/LevelUpOverlay').then(m => ({ default: m.LevelUpOverlay })))
const SessionScreen = React.lazy(() => import('@/features/session/SessionScreen').then(m => ({ default: m.SessionScreen })))
const SessionSummary = React.lazy(() => import('@/features/session/SessionSummary').then(m => ({ default: m.SessionSummary })))
const WorkoutsList = React.lazy(() => import('@/features/workouts/WorkoutsList').then(m => ({ default: m.WorkoutsList })))
const BaseWorkouts = React.lazy(() => import('@/features/workouts/BaseWorkouts').then(m => ({ default: m.BaseWorkouts })))
const QuickWorkout = React.lazy(() => import('@/features/workouts/QuickWorkout').then(m => ({ default: m.QuickWorkout })))
const WorkoutEditor = React.lazy(() => import('@/features/workouts/WorkoutEditor').then(m => ({ default: m.WorkoutEditor })))
const ExerciseLibrary = React.lazy(() => import('@/features/exercises/ExerciseLibrary').then(m => ({ default: m.ExerciseLibrary })))
const ProgressDashboard = React.lazy(() => import('@/features/progress/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })))
const RecordsPage = React.lazy(() => import('@/features/progress/RecordsPage').then(m => ({ default: m.RecordsPage })))
const PremiumPage = React.lazy(() => import('@/features/premium/PremiumPage').then(m => ({ default: m.PremiumPage })))
const FriendsPage = React.lazy(() => import('@/features/social/FriendsPage').then(m => ({ default: m.FriendsPage })))
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AchievementsPage = React.lazy(() => import('@/features/gamification/AchievementsPage').then(m => ({ default: m.AchievementsPage })))
const AchievementUnlockOverlay = React.lazy(() => import('@/features/gamification/AchievementUnlockOverlay').then(m => ({ default: m.AchievementUnlockOverlay })))

import { useAchievementsStore } from '@/features/gamification/useAchievementsStore'

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-white">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <AuthProvider>
        <ActiveSessionProvider>
          <Router>
            <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20 md:pb-0 md:pl-24">
            <Navbar />
            <LevelUpOverlay />
            <AchievementCelebration />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route path="/onboarding" element={
                  <ProtectedRoute><OnboardingFlow /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/progress" element={
                  <ProtectedRoute><ProgressDashboard /></ProtectedRoute>
                } />
                <Route path="/records" element={
                  <ProtectedRoute><RecordsPage /></ProtectedRoute>
                } />
                <Route path="/workouts" element={
                  <ProtectedRoute><WorkoutsList /></ProtectedRoute>
                } />
                <Route path="/workouts/base" element={
                  <ProtectedRoute><BaseWorkouts /></ProtectedRoute>
                } />
                <Route path="/workouts/quick" element={
                  <ProtectedRoute><QuickWorkout /></ProtectedRoute>
                } />
                <Route path="/workouts/new" element={
                  <ProtectedRoute><WorkoutEditor /></ProtectedRoute>
                } />
                <Route path="/workouts/:id/start" element={
                  <ProtectedRoute><SessionScreen /></ProtectedRoute>
                } />
                <Route path="/exercises" element={
                  <ProtectedRoute><ExerciseLibrary /></ProtectedRoute>
                } />
                <Route path="/session" element={
                  <ProtectedRoute><SessionScreen /></ProtectedRoute>
                } />
                <Route path="/session/quick" element={
                  <ProtectedRoute><SessionScreen /></ProtectedRoute>
                } />
                <Route path="/session/summary" element={
                  <ProtectedRoute><SessionSummary /></ProtectedRoute>
                } />
                <Route path="/community" element={<Navigate to="/friends" replace />} />
                <Route path="/leaderboard" element={<Navigate to="/friends" replace />} />
                <Route path="/friends" element={
                  <ProtectedRoute><FriendsPage /></ProtectedRoute>
                } />
                <Route path="/premium" element={
                  <ProtectedRoute><PremiumPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/achievements" element={
                  <ProtectedRoute><AchievementsPage /></ProtectedRoute>
                } />
              </Routes>
              </Suspense>
            </div>
          </Router>
        </ActiveSessionProvider>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

function AchievementCelebration() {
  const { pendingUnlocks, clearPendingUnlocks } = useAchievementsStore()
  
  if (pendingUnlocks.length === 0) return null

  return (
    <Suspense fallback={null}>
      <AchievementUnlockOverlay 
        unlocks={pendingUnlocks} 
        onClose={clearPendingUnlocks} 
      />
    </Suspense>
  )
}

export default App
