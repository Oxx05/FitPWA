
import { useAuthStore } from '@/features/auth/AuthProvider'
import { Button } from '@/shared/components/Button'
import { getLevelProgress } from '@/shared/utils/gamification'
import { GamificationManager } from '@/features/gamification/GamificationManager'
import { AiWorkoutGenerator } from '@/features/workouts/AiWorkoutGenerator'
import { Crown, TrendingUp, Flame, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FeatureGate } from '../premium/FeatureGate'

export function Dashboard() {
  const { profile, signOut } = useAuthStore()

  const levelProgress = getLevelProgress(profile?.xp_total || 0)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-200 p-6 rounded-2xl shadow-lg border border-surface-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Olá, {profile?.full_name?.split(' ')[0] || 'Atleta'}!
          </h1>
          <p className="text-gray-400 mt-1">Pronto para mais um treino?</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold text-sm">Nível {profile?.level || 1}</span>
              <span className="text-gray-400 text-xs">{profile?.xp_total || 0} XP</span>
            </div>
            <div className="w-32 h-2 bg-surface-100 rounded-full overflow-hidden border border-surface-200">
              <div 
                className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-1000 rounded-full" 
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-500 hover:text-white h-auto py-0">
            Sair
          </Button>
        </div>
      </div>

      {/* Premium CTA */}
      {!profile?.is_premium && (
        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Desbloqueia o FitPWA PRO</p>
              <p className="text-gray-400 text-xs">Acede a estatísticas avançadas e planos exclusivos.</p>
            </div>
          </div>
          <Link to="/premium">
            <Button size="sm" className="font-bold">Saber Mais</Button>
          </Link>
        </div>
      )}

      {/* Stats Cards + Today's Workout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 shadow-md transform transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-gray-400 font-medium">Streak Atual</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{profile?.login_streak || 0}</span>
            <span className="text-primary font-medium mb-1">dias 🔥</span>
          </div>
        </div>
        
        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 shadow-md md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-white font-medium">Treino de Hoje</h3>
          </div>
          <div className="bg-surface-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg text-primary">Seleçiona um Plano</h4>
              <p className="text-sm text-gray-400">Escolhe uma sessão para começar</p>
            </div>
            <Link to="/workouts">
              <Button>Começar Treino</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Coach */}
      <AiWorkoutGenerator />

      {/* Muscle Volume Analysis */}
      <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 shadow-md">
        <h3 className="text-white font-bold mb-6">Análise de Volume por Grupo Muscular</h3>
        <FeatureGate featureName="Análise Muscular Avançada">
          <div className="h-64 flex items-center justify-center text-gray-500 italic">
            Gráfico de Distribuição Muscular (Premium Only)
          </div>
        </FeatureGate>
      </div>

      <GamificationManager />
    </div>
  )
}
