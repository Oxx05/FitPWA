import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from './authStore'
import { supabase } from '@/shared/lib/supabase'

export function OnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, profile, setProfile, isLoading: authLoading } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 1
  const [name, setName] = useState('')
  // Step 2
  const [goal, setGoal] = useState('general')
  const [experience, setExperience] = useState('beginner')
  // Step 3
  const [equipment, setEquipment] = useState<string[]>([])

  useEffect(() => {
    if (!session) {
      navigate('/login')
    }
  }, [session, navigate])

  useEffect(() => {
    // If profile is already complete (has full_name), skip to dashboard
    if (profile?.full_name && !authLoading) {
      navigate('/dashboard')
    }
  }, [profile, authLoading, navigate])

  const handleNext = () => setStep(s => Math.min(4, s + 1))
  const handleBack = () => setStep(s => Math.max(1, s - 1))

  const toggleEquipment = (eq: string) => {
    setEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    )
  }

  const finishOnboarding = async () => {
    if (!session?.user) return
    setIsLoading(true)
    setSaveError('')

    const updates = {
      id: session.user.id,
      full_name: name.trim(),
      username: name.trim().toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
      goal,
      experience_level: experience,
      preferred_equipment: equipment,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (!error) {
      // Update store immediately — don't rely on a re-fetch that might fail
      setProfile({
        ...(profile ?? {}),
        ...updates,
        is_premium: profile?.is_premium ?? false,
        sound_enabled: profile?.sound_enabled ?? true,
        level: profile?.level ?? 1,
        xp_total: profile?.xp_total ?? 0,
        login_streak: profile?.login_streak ?? 0,
        total_volume_kg: profile?.total_volume_kg ?? 0,
        social_likes_given: profile?.social_likes_given ?? 0,
        profile_visibility: profile?.profile_visibility ?? 'private',
      })
      localStorage.setItem(`onboarding_complete_${session.user.id}`, '1')
      navigate('/dashboard')
    } else {
      console.error('Onboarding save error:', error)
      setSaveError(t('auth.onboardingSaveError'))
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6 bg-surface-200 p-8 rounded-2xl shadow-xl">

        {/* Progress Bar */}
        <div className="flex gap-2 w-full mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 flex-grow rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-100'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.welcome')}</h2>
            <p className="text-gray-400 mb-6">{t('onboarding.step1Title')}</p>
            <Input
              placeholder={t('onboarding.step1Placeholder')}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.yourGoals')}</h2>
            <p className="text-gray-400 mb-6">{t('onboarding.goalsDesc')}</p>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-300">{t('onboarding.mainGoal')}</label>
              <select
                className="w-full bg-surface-100 border border-surface-200 text-white rounded-md h-10 px-3"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              >
                <option value="strength">{t('onboarding.goalStrength')}</option>
                <option value="hypertrophy">{t('onboarding.goalHypertrophy')}</option>
                <option value="endurance">{t('onboarding.goalEndurance')}</option>
                <option value="weight_loss">{t('onboarding.goalLoseWeight')}</option>
                <option value="general">{t('onboarding.goalGeneral')}</option>
              </select>

              <label className="text-sm font-medium text-gray-300 mt-2">{t('onboarding.experienceLevel')}</label>
              <select
                className="w-full bg-surface-100 border border-surface-200 text-white rounded-md h-10 px-3"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                <option value="beginner">{t('onboarding.levelBeginner')}</option>
                <option value="intermediate">{t('onboarding.levelIntermediate')}</option>
                <option value="advanced">{t('onboarding.levelAdvanced')}</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.equipment')}</h2>
            <p className="text-gray-400 mb-6">{t('onboarding.whereTrain')}</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'barbell', label: t('onboarding.eqBarbell') },
                { id: 'dumbbell', label: t('onboarding.eqDumbbell') },
                { id: 'bodyweight', label: t('onboarding.eqBodyweight') },
                { id: 'cables', label: t('onboarding.eqCables') },
                { id: 'machines', label: t('onboarding.eqMachines') }
              ].map(eq => (
                <button
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`p-3 rounded-lg border text-sm transition-colors ${
                    equipment.includes(eq.id) ? 'border-primary bg-primary/10 text-primary' : 'border-surface-100 bg-surface-100 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {eq.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.allSet')}</h2>
            <p className="text-gray-400 mb-6">{t('onboarding.allSetDesc')}</p>

            <div className="bg-surface-100 p-4 rounded-lg flex flex-col gap-2">
              <span className="text-sm text-gray-400">{t('common.goal')}: <strong className="text-white capitalize">{t(`onboarding.goal${goal.charAt(0).toUpperCase() + goal.slice(1).replace('_', 'L')}`)}</strong></span>
              <span className="text-sm text-gray-400">{t('common.level')}: <strong className="text-white capitalize">{t(`onboarding.level${experience.charAt(0).toUpperCase() + experience.slice(1)}`)}</strong></span>
              <span className="text-sm text-gray-400">{t('onboarding.equipment')}: <strong className="text-white">{equipment.length ? equipment.map(e => t(`onboarding.eq${e.charAt(0).toUpperCase() + e.slice(1)}`)).join(', ') : t('onboarding.noneSpecific')}</strong></span>
            </div>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        )}

        <div className="flex justify-between mt-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
            className={`gap-2 ${step === 1 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={step === 1 && !name.trim()} className="gap-2">
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={finishOnboarding} isLoading={isLoading} className="gap-2">
              {t('onboarding.finish')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
