import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/AuthProvider'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { supabase } from '@/shared/lib/supabase'
import { User, Mail, Shield, LogOut, Settings, Bell, CreditCard, Globe, Lock, Check, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function ProfilePage() {
  const { profile, user, signOut, isPremium } = useAuthStore()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  const [publishDescription, setPublishDescription] = useState('')

  // Editable profile fields
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  // Fetch workout plans from the correct table
  const { data: workouts, refetch } = useQuery({
    queryKey: ['my-workouts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          id, name, description, days_per_week, is_public, likes, saves, created_at,
          plan_exercises (id)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workouts:', error)
        return []
      }
      return (data || []).map((w: Record<string, unknown>) => ({
        id: w.id as string,
        name: w.name as string,
        description: (w.description as string) || '',
        daysPerWeek: (w.days_per_week as number) || 0,
        exercisesCount: Array.isArray(w.plan_exercises) ? w.plan_exercises.length : 0,
        isPublic: (w.is_public as boolean) || false,
        likes: (w.likes as number) || 0,
        saves: (w.saves as number) || 0,
        createdAt: w.created_at as string,
      })) as WorkoutPlan[]
    },
  })

  // Fetch real training stats
  const { data: stats } = useQuery({
    queryKey: ['profile-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { totalWorkouts: 0, totalMinutes: 0 }

      const { count } = await supabase
        .from('workout_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)

      const { data: durations } = await supabase
        .from('workout_history')
        .select('duration_minutes')
        .eq('user_id', profile.id)

      const totalMinutes = (durations || []).reduce(
        (sum: number, w: Record<string, unknown>) => sum + ((w.duration_minutes as number) || 0),
        0
      )

      return { totalWorkouts: count || 0, totalMinutes }
    },
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return
      const { error } = await supabase
        .from('workout_plans')
        .update({
          is_public: true,
          description: publishDescription,
        })
        .eq('id', selectedPlan.id)

      if (error) throw error
    },
    onSuccess: () => {
      setShowPublishModal(false)
      setPublishDescription('')
      setSelectedPlan(null)
      refetch()
    },
  })

  const togglePrivacy = async (planId: string, isPublic: boolean) => {
    await supabase
      .from('workout_plans')
      .update({ is_public: !isPublic })
      .eq('id', planId)
    refetch()
  }

  const handleSaveProfile = async () => {
    if (!user) return
    try {
      setSavingProfile(true)
      setProfileMsg(null)
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', user.id)
      if (error) throw error
      setProfileMsg('Perfil atualizado!')
    } catch {
      setProfileMsg('Erro ao guardar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-surface-200 p-8 rounded-3xl border border-surface-100 shadow-xl">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary text-primary">
          <User className="w-12 h-12" />
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-3xl font-black text-white">{profile?.full_name || 'Atleta'}</h1>
          <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-4 h-4" /> {user?.email}
          </p>
          {isPremium && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> PRO Member
            </div>
          )}
        </div>
        <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-2" /> Sair
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-primary">
            {workouts?.filter(w => w.isPublic).length || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Publicados</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-red-400">
            {workouts?.reduce((sum, w) => sum + w.likes, 0) || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Likes</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-blue-400">
            {workouts?.reduce((sum, w) => sum + w.saves, 0) || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Guardados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Conta</h3>
          <button
            onClick={() => { setEditName(profile?.full_name || ''); setShowSettingsModal(true); setProfileMsg(null) }}
            className="w-full flex items-center justify-between p-4 bg-surface-100 rounded-xl hover:bg-surface-300 transition-colors border border-transparent hover:border-surface-200"
          >
            <div className="flex items-center gap-3 text-gray-300">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-white">Definições da Conta</span>
            </div>
            <span className="text-gray-500">→</span>
          </button>
          <ProfileLink icon={<Bell />} label="Notificações" />
          <ProfileLink icon={<CreditCard />} label="Pagamentos" to="/premium" />
        </div>

        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Treino</h3>
          <div className="flex justify-between items-center p-3 bg-surface-100 rounded-xl">
            <span className="text-gray-400">Total de Treinos</span>
            <span className="text-white font-bold">{stats?.totalWorkouts ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface-100 rounded-xl">
            <span className="text-gray-400">Tempo de Atividade</span>
            <span className="text-white font-bold">{stats ? formatDuration(stats.totalMinutes) : '—'}</span>
          </div>
        </div>
      </div>

      {/* My Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Meus Planos</h2>
        <div className="space-y-3">
          {workouts && workouts.length > 0 ? (
            workouts.map((workout, idx) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-surface-200 border border-surface-100 p-4 rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{workout.name}</h3>
                      {workout.isPublic ? (
                        <Globe className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{workout.daysPerWeek}x/semana • {workout.exercisesCount} exercícios</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(workout.createdAt).toLocaleDateString('pt-PT')} • {workout.likes} likes • {workout.saves} guardados
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!workout.isPublic && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPlan(workout)
                          setShowPublishModal(true)
                        }}
                        className="bg-primary/20 hover:bg-primary/30 text-primary"
                      >
                        Publicar
                      </Button>
                    )}
                    <button
                      onClick={() => togglePrivacy(workout.id, workout.isPublic)}
                      className="p-2 hover:bg-surface-100 rounded-lg transition-colors text-xs text-gray-400"
                    >
                      {workout.isPublic ? 'Privado' : 'Público'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum plano criado ainda</p>
              <Link to="/workouts/new">
                <Button className="mt-4 bg-primary hover:bg-primary/90 text-black">
                  Criar Primeiro Plano
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => {
          setShowPublishModal(false)
          setSelectedPlan(null)
          setPublishDescription('')
        }}
        title="Publicar Plano na Comunidade"
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Torna o teu plano público para que outros utilizadores possam encontrá-lo, dar likes e guardá-lo.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-300">Descrição</label>
            <textarea
              value={publishDescription}
              onChange={(e) => setPublishDescription(e.target.value)}
              placeholder="Descreve o teu plano de treino..."
              className="w-full mt-2 bg-surface-100 border border-surface-200 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowPublishModal(false)
                setSelectedPlan(null)
                setPublishDescription('')
              }}
              className="flex-1 bg-surface-100 hover:bg-surface-200 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={!publishDescription.trim() || publishMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-black disabled:opacity-50"
            >
              {publishMutation.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Definições da Conta"
        closeButton
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="O teu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="bg-surface-100 border border-surface-200 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed">
              {user?.email}
            </div>
            <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado aqui.</p>
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${profileMsg.includes('Erro') ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              <Check className="w-4 h-4" />
              {profileMsg}
            </div>
          )}

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || !editName.trim()}
            className="w-full gap-2"
          >
            {savingProfile ? 'Guardando...' : (
              <>
                <Pencil className="w-4 h-4" />
                Guardar Alterações
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

interface WorkoutPlan {
  id: string
  name: string
  description: string
  daysPerWeek: number
  exercisesCount: number
  isPublic: boolean
  likes: number
  saves: number
  createdAt: string
}

function ProfileLink({ icon, label, to = '#' }: { icon: React.ReactNode, label: string, to?: string }) {
  return (
    <Link to={to} className="flex items-center justify-between p-4 bg-surface-100 rounded-xl hover:bg-surface-300 transition-colors border border-transparent hover:border-surface-200">
      <div className="flex items-center gap-3 text-gray-300">
        {icon}
        <span className="font-medium text-white">{label}</span>
      </div>
      <span className="text-gray-500">→</span>
    </Link>
  )
}
