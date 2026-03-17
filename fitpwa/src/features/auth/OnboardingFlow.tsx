import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from './authStore'
import { supabase } from '@/shared/lib/supabase'

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { session, profile, setProfile, isLoading: authLoading } = useAuthStore()
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
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

    const updates = {
      id: session.user.id,
      full_name: name,
      username: name.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
      goal,
      experience_level: experience,
      preferred_equipment: equipment,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)
    
    if (!error) {
      // Refetch profile via auth store or manually update
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) setProfile(data)
      navigate('/dashboard')
    } else {
      console.error(error)
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
            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a)!</h2>
            <p className="text-gray-400 mb-6">Como te chamas?</p>
            <Input 
              placeholder="O teu nome ou apelido" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Os teus objetivos</h2>
            <p className="text-gray-400 mb-6">Ajuda-nos a personalizar o teu plano.</p>
            
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-300">Objetivo principal:</label>
              <select 
                className="w-full bg-surface-100 border border-surface-200 text-white rounded-md h-10 px-3"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              >
                <option value="strength">Força</option>
                <option value="hypertrophy">Hipertrofia</option>
                <option value="endurance">Resistência</option>
                <option value="weight_loss">Perda de peso</option>
                <option value="general">Fitness Geral</option>
              </select>

              <label className="text-sm font-medium text-gray-300 mt-2">Nível de experiência:</label>
              <select 
                className="w-full bg-surface-100 border border-surface-200 text-white rounded-md h-10 px-3"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermédio</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Equipamento</h2>
            <p className="text-gray-400 mb-6">Onde costumas treinar?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'barbell', label: 'Barras' },
                { id: 'dumbbell', label: 'Halteres' },
                { id: 'bodyweight', label: 'Peso do Corpo' },
                { id: 'cables', label: 'Cabos/Polias' },
                { id: 'machines', label: 'Máquinas' }
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
            <h2 className="text-2xl font-bold text-white mb-2">Tudo pronto!</h2>
            <p className="text-gray-400 mb-6">Baseado nas tuas escolhas, vamos criar o teu perfil e sugerir os melhores planos para ti.</p>
            
            <div className="bg-surface-100 p-4 rounded-lg flex flex-col gap-2">
              <span className="text-sm text-gray-400">Objetivo: <strong className="text-white capitalize">{goal.replace('_',' ')}</strong></span>
              <span className="text-sm text-gray-400">Nível: <strong className="text-white capitalize">{experience}</strong></span>
              <span className="text-sm text-gray-400">Equipamento: <strong className="text-white">{equipment.length ? equipment.join(', ') : 'Nenhum especifico'}</strong></span>
            </div>
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
            Voltar
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={step === 1 && !name} className="gap-2">
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={finishOnboarding} isLoading={isLoading} className="gap-2">
              Começar a Treinar!
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
