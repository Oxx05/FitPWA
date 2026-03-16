
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { ActiveSessionProvider } from '@/features/session/ActiveSessionProvider'
import { Navbar } from '@/shared/components/Navbar'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

const queryClient = new QueryClient()

const LoginPage = React.lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('@/features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OnboardingFlow = React.lazy(() => import('@/features/auth/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })))
const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
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
const CommunityPage = React.lazy(() => import('@/features/community/CommunityPage').then(m => ({ default: m.CommunityPage })))
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-white">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveSessionProvider>
          <Router>
            <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20 md:pb-0 md:pl-24">
              <Navbar />
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
                <Route path="/community" element={
                  <ProtectedRoute><CommunityPage /></ProtectedRoute>
                } />
                <Route path="/premium" element={
                  <ProtectedRoute><PremiumPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
              </Routes>
              </Suspense>
            </div>
          </Router>
        </ActiveSessionProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
