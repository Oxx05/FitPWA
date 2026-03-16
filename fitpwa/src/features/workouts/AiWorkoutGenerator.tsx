import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2, AlertCircle, Dumbbell, X, RotateCw } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/AuthProvider'
import { generateWorkoutPlan, type AiGeneratedPlan } from '@/shared/lib/aiService'

const SUGGESTION_CHIPS = [
  'Treino de peito e tríceps, 45 min',
  'Sessão rápida de corpo inteiro, 30 min',
  'Pernas para hipertrofia',
  'Costas e bíceps, intermédio',
  'HIIT cardio, 20 min',
  'Ombros e core, iniciante',
  'Braços, avançado',
  'Glúteos e posterior',
]

export function AiWorkoutGenerator() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<AiGeneratedPlan | null>(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = () => {
    if (!prompt.trim()) return

    try {
      setError(null)
      const plan = generateWorkoutPlan(prompt)
      setGeneratedPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar plano')
    }
  }

  const handleRegenerate = () => {
    if (!prompt.trim()) return
    try {
      setError(null)
      const plan = generateWorkoutPlan(prompt)
      setGeneratedPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar plano')
    }
  }

  const handleSavePlan = async () => {
    if (!generatedPlan || !user) return

    try {
      setSaving(true)
      setError(null)

      const { data: newPlan, error: planErr } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          name: generatedPlan.name,
          description: generatedPlan.description,
          type: 'custom',
          days_per_week: 3,
        })
        .select()
        .single()

      if (planErr) throw planErr

      if (newPlan && generatedPlan.exercises.length > 0) {
        // Look up UUIDs for exercise slugs
        const slugs = generatedPlan.exercises.map(e => e.exercise_id)
        const { data: dbExercises } = await supabase
          .from('exercises')
          .select('id, name')
          .limit(500)

        // Build a name→UUID map from the DB
        const nameToUuid = new Map<string, string>()
        if (dbExercises) {
          dbExercises.forEach((e: Record<string, unknown>) => {
            nameToUuid.set(e.name as string, e.id as string)
          })
        }

        const planExercises = generatedPlan.exercises
          .map((ex, idx) => {
            const uuid = nameToUuid.get(ex.name)
            if (!uuid) return null
            return {
              plan_id: newPlan.id,
              exercise_id: uuid,
              order_index: idx,
              sets: ex.sets,
              reps_min: ex.reps_min,
              reps_max: ex.reps_max,
              rest_seconds: ex.rest_seconds,
              weight_kg: ex.weight_kg,
            }
          })
          .filter(Boolean)

        if (planExercises.length > 0) {
          const { error: exErr } = await supabase
            .from('plan_exercises')
            .insert(planExercises)
          if (exErr) console.error('Erro ao guardar exercícios:', exErr)
        }
      }

      setIsOpen(false)
      setGeneratedPlan(null)
      setPrompt('')
      navigate('/workouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar plano')
    } finally {
      setSaving(false)
    }
  }

  const formatRest = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}` : `${s}s`

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-purple-500/20 via-primary/20 to-blue-500/20 border border-primary/30 p-5 rounded-2xl hover:border-primary/60 transition-all group text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Gerador de Treinos</h3>
            <p className="text-gray-400 text-sm mt-0.5">
              Diz-me o que queres treinar e eu crio o plano perfeito para ti
            </p>
          </div>
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setGeneratedPlan(null); setError(null) }}
        title="⚡ Gerador de Treinos"
        size="lg"
        closeButton
      >
        <div className="space-y-4">
          {/* Prompt Input */}
          {!generatedPlan && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  O que queres treinar hoje?
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ex: Quero destruir peito e tríceps, tenho 45 minutos..."
                  className="w-full bg-surface-200 border border-surface-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() }}}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => { setPrompt(chip); }}
                    className="text-xs bg-surface-100 border border-surface-200 text-gray-300 px-3 py-1.5 rounded-full hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Gerar Plano
              </Button>
            </>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Plan Preview */}
          {generatedPlan && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-4 rounded-xl">
                <h3 className="font-bold text-white text-lg">{generatedPlan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{generatedPlan.description}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize">
                    {generatedPlan.difficulty === 'beginner' ? 'Iniciante' : generatedPlan.difficulty === 'advanced' ? 'Avançado' : 'Intermédio'}
                  </span>
                  <span className="text-xs bg-surface-100 text-gray-300 px-2 py-0.5 rounded-full">
                    {generatedPlan.exercises.length} exercícios
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {generatedPlan.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-surface-100 p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{ex.name}</h4>
                      <p className="text-xs text-gray-400">
                        {ex.sets} × {ex.reps_min === ex.reps_max ? ex.reps_min : `${ex.reps_min}-${ex.reps_max}`} reps · {formatRest(ex.rest_seconds)} descanso
                      </p>
                    </div>
                    <Dumbbell className="w-4 h-4 text-gray-600 shrink-0" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleRegenerate}
                  className="gap-2"
                  title="Gerar novamente com exercícios diferentes"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setGeneratedPlan(null); setPrompt('') }}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  Alterar Pedido
                </Button>
                <Button
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="flex-1 gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Guardar Plano
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
