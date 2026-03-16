
import { Link } from 'react-router-dom'
import { Plus, ChevronRight, Zap, Dumbbell, Layers } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { EmptyState } from '@/shared/components/EmptyState'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/features/auth/authStore'

export function WorkoutsList() {
  const { profile } = useAuthStore()
  
  const { data: plans, isLoading } = useQuery({
    queryKey: ['my-workout-plans', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('workspace_plans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching plans:', error)
        return []
      }
      return data || []
    }
  })

  const workoutOptions = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Plano Base',
      description: 'Escolha entre 6 planos pré-configurados',
      path: '/workouts/base',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Treino Rápido',
      description: 'Crie um treino individual sem plano',
      path: '/workouts/quick',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: 'Novo Plano',
      description: 'Crie seu próprio plano personalizado',
      path: '/workouts/new',
      color: 'from-green-500 to-green-600'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold">Treinos</h1>
        <p className="text-gray-400">Escolha como deseja treinar hoje</p>
      </div>

      {/* Quick Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workoutOptions.map((option, idx) => (
          <Link key={option.path} to={option.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-gradient-to-br ${option.color} p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-white/10 cursor-pointer group`}
            >
              <div className="mb-4 text-white group-hover:scale-110 transition-transform">
                {option.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-1">{option.title}</h3>
              <p className="text-white/80 text-sm">{option.description}</p>
              <ChevronRight className="w-5 h-5 text-white/60 mt-4 group-hover:translate-x-2 transition-transform" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-100"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-gray-500">Meus Planos</span>
        </div>
      </div>

      {/* My Workouts */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div>
        </div>
      ) : (plans && plans.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-200 border border-surface-100 p-5 rounded-xl hover:border-primary/50 transition-colors"
            >
              <h3 className="text-lg font-bold text-white capitalize">{plan.name}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 mt-2">{plan.description || 'Sem descrição'}</p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs bg-surface-100 px-3 py-1 rounded-full text-gray-300">
                  {plan.days_per_week ? `${plan.days_per_week}x/semana` : 'Livre'}
                </span>
                
                <Link to={`/workouts/${plan.id}/start`}>
                  <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary">
                    Começar
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<Dumbbell className="w-16 h-16" />}
          title="Nenhum plano ainda"
          description="Crie seu primeiro plano ou escolha um dos opções acima"
        />      )}
    </div>
  )
}
