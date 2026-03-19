import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/authStore'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { Input } from '@/shared/components/Input'
import { supabase } from '@/shared/lib/supabase'
import { User, Mail, Shield, LogOut, Settings, Bell, CreditCard, Globe, Lock, Check, Pencil, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CustomSelect } from '@/shared/components/CustomSelect'
import { useToast } from '@/shared/contexts/ToastContext'
import { NotificationCenter } from './NotificationCenter'
import { useAchievementsStore, type Achievement } from '@/features/gamification/useAchievementsStore'
import { Trophy } from 'lucide-react'

export function ProfilePage() {
  const { profile, user, signOut, isPremium } = useAuthStore()
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null)
  const [publishDescription, setPublishDescription] = useState('')
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const { achievements, unlockedIds } = useAchievementsStore()
  const [showAvatarModal, setShowAvatarModal] = useState(false)

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
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary text-primary overflow-hidden relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Pencil className="w-6 h-6 text-white" />
            </div>
          </div>
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
          
          {/* Featured Medals (Highest Tier for each group) */}
          <div className="flex flex-col md:flex-row gap-2 mt-5 items-center md:items-start justify-center md:justify-start w-full">
            <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest block md:hidden w-full text-center">{t('profile.featuredMedals')}</h4>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {(() => {
                const featured = unlockedIds
                  .map(id => achievements.find(a => a.id === id)!)
                  .filter(Boolean)
                  // Group by groupId and take highest level
                  .reduce((acc, curr) => {
                    const existing = acc.find(a => a.groupId === curr.groupId)
                    if (!existing || curr.level > existing.level) {
                      const filtered = acc.filter(a => a.groupId !== curr.groupId)
                      filtered.push(curr)
                      return filtered
                    }
                    return acc
                  }, [] as Achievement[])
                  .sort((a, b) => b.level - a.level)
                  .slice(0, 3)

                return featured.map(achievement => (
                  <div 
                    key={achievement.id} 
                    className={`w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-xl border shadow-inner relative group/medal ${
                      achievement.level === 3 ? 'border-yellow-500/50' : achievement.level === 2 ? 'border-gray-400/50' : 'border-surface-300'
                    }`} 
                    title={i18n.language === 'pt' ? achievement.title_pt : achievement.title}
                  >
                    {achievement.icon}
                    {/* Rank Badge */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${
                      achievement.level === 3 ? 'bg-yellow-500' : achievement.level === 2 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {achievement.level}
                    </div>
                  </div>
                ))
              })()}
              {unlockedIds.length === 0 && (
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1 text-center w-full">{t('profile.noMedalsEquipped')}</p>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-2" /> {t('auth.logout')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-200 p-3 sm:p-4 rounded-2xl text-center border border-surface-100 flex flex-col items-center justify-center min-w-0">
          <p className="text-2xl font-black text-primary leading-none mb-1.5">
            {workouts?.filter(w => w.isPublic).length || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider leading-tight">{t('common.published')}</p>
        </div>
        <div className="bg-surface-200 p-3 sm:p-4 rounded-2xl text-center border border-surface-100 flex flex-col items-center justify-center min-w-0">
          <p className="text-2xl font-black text-red-400 leading-none mb-1.5">
            {workouts?.reduce((sum, w) => sum + w.likes, 0) || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider leading-tight">{t('common.likes')}</p>
        </div>
        <div className="bg-surface-200 p-3 sm:p-4 rounded-2xl text-center border border-surface-100 flex flex-col items-center justify-center min-w-0">
          <p className="text-2xl font-black text-blue-400 leading-none mb-1.5">
            {workouts?.reduce((sum, w) => sum + w.saves, 0) || 0}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider leading-tight">{t('common.saved')}</p>
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
          <button 
            onClick={() => setShowNotificationCenter(true)}
            className="w-full flex items-center justify-between p-4 bg-surface-100 rounded-xl hover:bg-surface-300 transition-colors border border-transparent hover:border-surface-200"
          >
            <div className="flex items-center gap-3 text-gray-300">
              <Clock className="w-5 h-5" />
              <span className="font-medium text-white">{t('profile.notificationsTitle')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
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
          <ProfileLink icon={<Trophy className="text-yellow-500" />} label={t('profile.achievementsLink')} to="/achievements" />
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
        <div className="space-y-8 py-2">
          {/* Section: Personal Info */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-1">{t('profile.account')}</h4>
            <div className="bg-surface-100/50 p-4 rounded-3xl border border-white/5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('profile.name')}</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('profile.namePlaceholder')}
                  className="bg-surface-200 border-white/5 focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('auth.email')}</label>
                <div className="bg-surface-200 border border-white/5 rounded-2xl px-4 py-3 text-gray-400 cursor-not-allowed text-sm">
                  {user?.email}
                </div>
                <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase">{t('profile.emailCannotChange')}</p>
              </div>
            </div>
          </section>

          {/* Section: Training Defaults */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-1">{t('profile.training')}</h4>
            <div className="bg-surface-100/50 p-4 rounded-3xl border border-white/5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('profile.defaultRestTime')}</label>
                  <Input
                    type="number"
                    value={defaultRest}
                    onChange={(e) => setDefaultRest(Number(e.target.value) || 0)}
                    placeholder={t('profile.placeholderEx', { value: '90' })}
                    className="bg-surface-200 border-white/5 focus:border-primary/50"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('profile.defaultSets')}</label>
                  <Input
                    type="number"
                    value={defaultSets}
                    onChange={(e) => setDefaultSets(Number(e.target.value) || 0)}
                    className="bg-surface-200 border-white/5 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('profile.repsMin')}</label>
                  <Input
                    type="number"
                    value={defaultMinReps}
                    onChange={(e) => setDefaultMinReps(Number(e.target.value) || 0)}
                    className="bg-surface-200 border-white/5 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">{t('profile.repsMax')}</label>
                  <Input
                    type="number"
                    value={defaultMaxReps}
                    onChange={(e) => setDefaultMaxReps(Number(e.target.value) || 0)}
                    className="bg-surface-200 border-white/5 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Preferences */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-1">{t('profile.soundAlerts')}</h4>
            <div 
              onClick={() => {
                const { setSoundEnabled, profile } = useAuthStore.getState()
                setSoundEnabled(profile?.sound_enabled !== false ? false : true)
              }}
              className={`flex items-center justify-between p-4 rounded-3xl border transition-all cursor-pointer ${
                profile?.sound_enabled !== false 
                  ? 'bg-primary/5 border-primary/20 text-primary' 
                  : 'bg-surface-100/50 border-white/5 text-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${profile?.sound_enabled !== false ? 'text-primary' : 'text-gray-500'}`} />
                <span className={`text-sm font-black uppercase tracking-tight ${profile?.sound_enabled !== false ? 'text-primary' : 'text-gray-400'}`}>
                  {profile?.sound_enabled !== false ? t('profile.soundEnabled') : t('profile.soundDisabled')}
                </span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${profile?.sound_enabled !== false ? 'bg-primary' : 'bg-surface-300'}`}>
                <motion.div 
                  animate={{ left: profile?.sound_enabled !== false ? '22px' : '2px' }}
                  className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm" 
                />
              </div>
            </div>
          </section>

          <AnimatePresence>
            {profileMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-bold shadow-lg ${
                  profileMsg && profileMsg.includes(t('common.error')) 
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
            className="w-full gap-2 h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Avatar Selection Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title={t('profile.chooseAvatar')}
        closeButton
      >
        <div className="space-y-6">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary text-primary overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14" />
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="space-y-3">
            <label className="block w-full cursor-pointer">
              <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 border-2 border-dashed border-primary/30 rounded-2xl hover:bg-primary/20 hover:border-primary/50 transition-all">
                <Pencil className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold text-sm uppercase tracking-wider">
                  {t('profile.uploadPhoto')}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return
                  
                  // Convert to base64
                  const reader = new FileReader()
                  reader.onload = async (ev) => {
                    const base64 = ev.target?.result as string
                    if (!base64) return
                    
                    // Resize image to max 200x200 for storage
                    const img = new Image()
                    img.onload = async () => {
                      const canvas = document.createElement('canvas')
                      const size = 200
                      canvas.width = size
                      canvas.height = size
                      const ctx = canvas.getContext('2d')!
                      const minDim = Math.min(img.width, img.height)
                      const sx = (img.width - minDim) / 2
                      const sy = (img.height - minDim) / 2
                      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
                      const resized = canvas.toDataURL('image/jpeg', 0.8)
                      
                      const { error } = await supabase
                        .from('profiles')
                        .update({ avatar_url: resized })
                        .eq('id', user.id)
                      
                      if (!error) {
                        useAuthStore.getState().fetchProfile(user.id)
                        setShowAvatarModal(false)
                        showToast(t('profile.avatarUpdated'), 'success')
                      }
                    }
                    img.src = base64
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>

            {/* Remove Avatar */}
            {profile?.avatar_url && (
              <button
                onClick={async () => {
                  if (!user) return
                  const { error } = await supabase
                    .from('profiles')
                    .update({ avatar_url: null })
                    .eq('id', user.id)
                  
                  if (!error) {
                    useAuthStore.getState().fetchProfile(user.id)
                    setShowAvatarModal(false)
                    showToast(t('profile.avatarRemoved'), 'success')
                  }
                }}
                className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold text-sm uppercase tracking-wider hover:bg-red-500/20 transition-colors"
              >
                {t('profile.removeAvatar')}
              </button>
            )}
          </div>
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
