import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { supabase } from '@/shared/lib/supabase'
import { User, Mail, Shield, LogOut, Settings, Bell, CreditCard, Globe, Lock, Check, Pencil, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { useToast } from '@/shared/contexts/ToastContext'

export function ProfilePage() {
  const { profile, user, signOut, isPremium } = useAuthStore()
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  const [publishDescription, setPublishDescription] = useState('')

  // Editable profile fields
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [defaultRest, setDefaultRest] = useState(profile?.default_rest_seconds || 90)
  const [defaultMinReps, setDefaultMinReps] = useState(profile?.default_reps_min || 8)
  const [defaultMaxReps, setDefaultMaxReps] = useState(profile?.default_reps_max || 12)
  const [defaultSets, setDefaultSets] = useState(profile?.default_sets || 3)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'pt'


  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast(t('profile.browserNoNotifications'), 'error')
      return
    }
    const status = await Notification.requestPermission()
    setNotificationStatus(status)
    if (status === 'granted') {
      new Notification(t('profile.notificationsActivated'), {
        body: t('profile.notificationsBody')
      })
    }
  }

  // Fetch workout plans from the correct table
  const { data: workouts, refetch } = useQuery({
    queryKey: ['my-workouts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          id, name, description, days_per_week, is_public, created_at,
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
        likes: 0,
        saves: 0,
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
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null)

      const { data: durations, error } = await supabase
        .from('workout_sessions')
        .select('duration_seconds')
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null)

      if (error) console.error('Error fetching history:', error)

      const totalSeconds = (durations || []).reduce(
        (sum: number, w: Record<string, unknown>) => sum + ((w.duration_seconds as number) || 0),
        0
      )

      return { totalWorkouts: count || 0, totalMinutes: Math.floor(totalSeconds / 60) }
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
        .update({ 
          full_name: editName.trim(),
          default_rest_seconds: defaultRest,
          default_reps_min: defaultMinReps,
          default_reps_max: defaultMaxReps,
          default_sets: defaultSets
        })
        .eq('id', user.id)
      if (error) throw error
      setProfileMsg(t('profile.profileUpdated'))
    } catch {
      setProfileMsg(t('profile.profileError'))
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
          <h1 className="text-3xl font-black text-white">{profile?.full_name || t('common.athlete')}</h1>
          <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-4 h-4" /> {user?.email}
          </p>
          {isPremium && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> {t('profile.proMember')}
            </div>
          )}
        </div>
        <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-2" /> {t('auth.logout')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-primary">
            {workouts?.filter(w => w.isPublic).length || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('common.published')}</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-red-400">
            {workouts?.reduce((sum, w) => sum + w.likes, 0) || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('common.likes')}</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-2xl text-center border border-surface-100">
          <p className="text-2xl font-bold text-blue-400">
            {workouts?.reduce((sum, w) => sum + w.saves, 0) || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('common.saved')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">{t('profile.account')}</h3>
          <button
            onClick={() => { 
              setEditName(profile?.full_name || ''); 
              setDefaultRest(profile?.default_rest_seconds || 90);
              setDefaultMinReps(profile?.default_reps_min || 8);
              setDefaultMaxReps(profile?.default_reps_max || 12);
              setDefaultSets(profile?.default_sets || 3);
              setShowSettingsModal(true); 
              setProfileMsg(null);
            }}
            className="w-full flex items-center justify-between p-4 bg-surface-100 rounded-xl hover:bg-surface-300 transition-colors border border-transparent hover:border-surface-200"
          >
            <div className="flex items-center gap-3 text-gray-300">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-white">{t('profile.accountSettings')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button onClick={requestNotificationPermission} className="w-full flex items-center justify-between p-4 bg-surface-100 rounded-xl hover:bg-surface-300 transition-colors border border-transparent hover:border-surface-200">
            <div className="flex items-center gap-3 text-gray-300">
              <Bell className="w-5 h-5" />
              <span className="font-medium text-white">{t('profile.notifications')}</span>
            </div>
            <span className="text-xs text-gray-400">
              {notificationStatus === 'granted' ? t('profile.notificationsEnabled') : notificationStatus === 'denied' ? t('profile.notificationsBlocked') : t('profile.notificationsEnable')}
            </span>
          </button>
          {/* Language Selection */}
          <div className="p-4 bg-surface-100 rounded-xl border border-transparent">
            <div className="flex items-center gap-3 text-gray-300 mb-3">
              <Globe className="w-5 h-5" />
              <span className="font-medium text-white">{t('profile.language')}</span>
            </div>
            <CustomSelect
              value={currentLang}
              onChange={(val) => i18n.changeLanguage(val)}
              options={[
                { value: 'pt', label: 'Português 🇵🇹' },
                { value: 'en', label: 'English 🇬🇧' }
              ]}
            />
          </div>
          <ProfileLink icon={<CreditCard />} label={t('profile.payments')} to="/premium" />
        </div>

        <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">{t('profile.training')}</h3>
          <div className="flex justify-between items-center p-3 bg-surface-100 rounded-xl">
            <span className="text-gray-400">{t('profile.totalWorkouts')}</span>
            <span className="text-white font-bold">{stats?.totalWorkouts ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface-100 rounded-xl">
            <span className="text-gray-400">{t('profile.activityTime')}</span>
            <span className="text-white font-bold">{stats ? formatDuration(stats.totalMinutes) : '—'}</span>
          </div>
        </div>
      </div>

      {/* My Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">{t('profile.myPlans')}</h2>
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
                    <p className="text-sm text-gray-400 mt-1">{t('workouts.perWeek', { count: workout.daysPerWeek })} • {workout.exercisesCount} {t('workouts.exercises')}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(workout.createdAt).toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : 'en-GB')} • {workout.likes} {t('common.likes')} • {workout.saves} {t('common.saved')}
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
                        {t('profile.publish')}
                      </Button>
                    )}
                    <button
                      onClick={() => togglePrivacy(workout.id, workout.isPublic)}
                      className="p-2 hover:bg-surface-100 rounded-lg transition-colors text-xs text-gray-400"
                    >
                      {workout.isPublic ? t('profile.private') : t('profile.public')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>{t('profile.noPlansCreated')}</p>
              <Link to="/workouts/new">
                <Button className="mt-4 bg-primary hover:bg-primary/90 text-black">
                  {t('profile.createFirstPlan')}
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
        title={t('profile.publishTitle')}
        closeButton
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            {t('profile.publishDescription')}
          </p>
          <div>
            <label className="text-sm font-medium text-gray-300">{t('editor.description')}</label>
            <textarea
              value={publishDescription}
              onChange={(e) => setPublishDescription(e.target.value)}
              placeholder={t('profile.publishPlaceholder')}
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
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={!publishDescription.trim() || publishMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-black disabled:opacity-50"
            >
              {publishMutation.isPending ? t('profile.publishing') : t('profile.publish')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={t('profile.accountSettings')}
        closeButton
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.name')}</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.email')}</label>
            <div className="bg-surface-100 border border-surface-200 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed">
              {user?.email}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('profile.emailCannotChange')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.defaultRestTime')}</label>
            <Input
              type="number"
              value={defaultRest}
              onChange={(e) => setDefaultRest(Number(e.target.value) || 0)}
              placeholder="ex: 90"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reps (Min)</label>
              <Input
                type="number"
                value={defaultMinReps}
                onChange={(e) => setDefaultMinReps(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reps (Max)</label>
              <Input
                type="number"
                value={defaultMaxReps}
                onChange={(e) => setDefaultMaxReps(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('profile.defaultSets')}</label>
            <Input
              type="number"
              value={defaultSets}
              onChange={(e) => setDefaultSets(Number(e.target.value) || 0)}
            />
          </div>
          <AnimatePresence>
            {profileMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm overflow-hidden ${
                  profileMsg.includes(t('common.error')) 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || !editName.trim()}
            className="w-full gap-2 h-12 rounded-xl font-bold uppercase tracking-tight"
          >
            {savingProfile ? t('profile.savingProfile') : (
              <>
                <Pencil className="w-4 h-4" />
                {t('profile.saveChanges')}
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
      <ChevronRight className="w-5 h-5 text-gray-500" />
    </Link>
  )
}
