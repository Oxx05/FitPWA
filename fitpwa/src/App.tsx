
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { OnboardingFlow } from '@/features/auth/OnboardingFlow'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { ActiveSessionProvider } from '@/features/session/ActiveSessionProvider'
import { SessionScreen } from '@/features/session/SessionScreen'
import { SessionSummary } from '@/features/session/SessionSummary'
import { WorkoutsList } from '@/features/workouts/WorkoutsList'
import { BaseWorkouts } from '@/features/workouts/BaseWorkouts'
import { QuickWorkout } from '@/features/workouts/QuickWorkout'
import { WorkoutEditor } from '@/features/workouts/WorkoutEditor'
import { ExerciseLibrary } from '@/features/exercises/ExerciseLibrary'
import { ProgressDashboard } from '@/features/progress/ProgressDashboard'
import { RecordsPage } from '@/features/progress/RecordsPage'
import { PremiumPage } from '@/features/premium/PremiumPage'
import { CommunityPage } from '@/features/community/CommunityPage'
import { Navbar } from '@/shared/components/Navbar'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

const queryClient = new QueryClient()

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveSessionProvider>
          <Router>
            <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 pb-20 md:pb-0 md:pl-24">
              <Navbar />
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
            </div>
          </Router>
        </ActiveSessionProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

