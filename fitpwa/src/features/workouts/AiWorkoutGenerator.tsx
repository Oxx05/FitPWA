import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2, AlertCircle, Dumbbell, X, RotateCw } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/authStore'
import { generateWorkoutPlan, type AiGeneratedPlan } from '@/shared/lib/aiService'
import { useTranslation } from 'react-i18next'

const SUGGESTION_CHIPS = [
  'ai.chips.backTriceps',
  'ai.chips.legsKnee',
  'ai.chips.bodyweightOnly',
  'ai.chips.heavyChest',
  'ai.chips.cardioAbs',
  'ai.chips.fullBodyAdv',
  'ai.chips.armsGlutes',
]

export function AiWorkoutGenerator() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const isPt = i18n.language === 'pt'

  const chips = SUGGESTION_CHIPS.map(key => t(key))

  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<AiGeneratedPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterMuscles, setFilterMuscles] = useState<string[]>([])
  const [filterEquipment, setFilterEquipment] = useState<string>('') // '' | 'gym' | 'dumbbells' | 'bodyweight'
  const [filterGoal, setFilterGoal] = useState<string>('') // '' | 'strength' | 'hypertrophy' | 'endurance'
  const [filterDifficulty, setFilterDifficulty] = useState<string>('') // '' | 'beginner' | 'intermediate' | 'advanced'
  const [filterDuration, setFilterDuration] = useState<number | null>(null)

  const buildPrompt = () => {
    let parts: string[] = []
    if (prompt.trim()) parts.push(prompt.trim())
    if (filterMuscles.length > 0) parts.push(filterMuscles.join(', '))
    if (filterEquipment === 'bodyweight') parts.push('apenas peso corporal')
    else if (filterEquipment === 'dumbbells') parts.push('apenas halteres')
    else if (filterEquipment === 'gym') parts.push('ginásio completo')
    if (filterGoal) parts.push(filterGoal)
    if (filterDifficulty) parts.push(filterDifficulty)
    if (filterDuration) parts.push(`${filterDuration} min`)
    return parts.join('. ') || 'treino completo'
  }

  const handleGenerate = () => {
    try {
      setError(null)
      const plan = generateWorkoutPlan(buildPrompt())
      setGeneratedPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.errorGenerating'))
    }
  }

  const handleRegenerate = () => {
    try {
      setError(null)
      const plan = generateWorkoutPlan(buildPrompt())
      setGeneratedPlan(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.errorGenerating'))
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
        })
        .select()
        .single()

      if (planErr) throw planErr

      if (newPlan && generatedPlan.exercises.length > 0) {
        const { data: dbExercises } = await supabase
          .from('exercises')
          .select('id, name')
          .limit(500)

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
          if (exErr) console.error('Error saving exercises:', exErr)
        }
      }

      setIsOpen(false)
      setGeneratedPlan(null)
      setPrompt('')
      navigate('/workouts')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ai.errorSaving'))
    } finally {
      setSaving(false)
    }
  }

  const formatRest = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m${s % 60 ? ` ${s % 60}s` : ''}` : `${s}s`

  const getDifficultyLabel = (diff: string) => {
    if (diff === 'beginner') return t('editor.beginner')
    if (diff === 'advanced') return t('editor.advanced')
    return t('editor.intermediate')
  }

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
            <h3 className="text-white font-bold text-lg">{t('ai.title')}</h3>
            <p className="text-gray-400 text-sm mt-0.5">
              {t('ai.subtitle')}
            </p>
          </div>
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setGeneratedPlan(null); setError(null); setFilterMuscles([]); setFilterEquipment(''); setFilterGoal(''); setFilterDifficulty(''); setFilterDuration(null) }}
        title={`⚡ ${t('ai.title')}`}
        size="lg"
        closeButton
      >
        <div className="space-y-4">
          {/* Prompt Input */}
          {!generatedPlan && (
            <>
              {/* Filter chips */}
              <div className="space-y-3">
                {/* Muscle groups */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('ai.filterMuscles')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'chest', pt: 'Peito', en: 'Chest' },
                      { id: 'back', pt: 'Costas', en: 'Back' },
                      { id: 'legs', pt: 'Pernas', en: 'Legs' },
                      { id: 'shoulders', pt: 'Ombros', en: 'Shoulders' },
                      { id: 'biceps', pt: 'Braços', en: 'Arms' },
                      { id: 'abs', pt: 'Abdominais', en: 'Core' },
                      { id: 'glutes', pt: 'Glúteos', en: 'Glutes' },
                    ].map(m => {
                      const active = filterMuscles.includes(m.id)
                      return (
                        <button key={m.id} type="button"
                          onClick={() => setFilterMuscles(prev => active ? prev.filter(x => x !== m.id) : [...prev, m.id])}
                          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all border ${active ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface-100 border-surface-200 text-gray-400 hover:border-primary/30'}`}
                        >
                          {isPt ? m.pt : m.en}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Equipment */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('ai.filterEquip')}</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: '', label: isPt ? 'Qualquer' : 'Any' },
                        { id: 'gym', label: isPt ? 'Ginásio' : 'Gym' },
                        { id: 'dumbbells', label: isPt ? 'Halteres' : 'Dumbbells' },
                        { id: 'bodyweight', label: isPt ? 'Corporal' : 'Bodyweight' },
                      ].map(e => (
                        <button key={e.id} type="button"
                          onClick={() => setFilterEquipment(e.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-left transition-all border ${filterEquipment === e.id ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface-100 border-surface-200 text-gray-400'}`}
                        >{e.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('ai.filterGoal')}</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: '', label: isPt ? 'Qualquer' : 'Any' },
                        { id: 'hypertrofia', label: isPt ? 'Hipertrofia' : 'Hypertrophy' },
                        { id: 'forca', label: isPt ? 'Força' : 'Strength' },
                        { id: 'resistencia', label: isPt ? 'Resistência' : 'Endurance' },
                      ].map(g => (
                        <button key={g.id} type="button"
                          onClick={() => setFilterGoal(g.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-left transition-all border ${filterGoal === g.id ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface-100 border-surface-200 text-gray-400'}`}
                        >{g.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('ai.filterDiff')}</p>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: '', label: isPt ? 'Qualquer' : 'Any' },
                        { id: 'iniciante', label: isPt ? 'Iniciante' : 'Beginner' },
                        { id: 'intermediate', label: isPt ? 'Intermédio' : 'Intermediate' },
                        { id: 'avancado', label: isPt ? 'Avançado' : 'Advanced' },
                      ].map(d => (
                        <button key={d.id} type="button"
                          onClick={() => setFilterDifficulty(d.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-left transition-all border ${filterDifficulty === d.id ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface-100 border-surface-200 text-gray-400'}`}
                        >{d.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('ai.filterDuration')}</p>
                  <div className="flex gap-1.5">
                    {[null, 30, 45, 60].map(d => (
                      <button key={String(d)} type="button"
                        onClick={() => setFilterDuration(d)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${filterDuration === d ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-surface-100 border-surface-200 text-gray-400'}`}
                      >{d ? `${d}m` : (isPt ? 'Livre' : 'Free')}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('ai.whatToTrain')}
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={t('ai.placeholder')}
                  className="w-full bg-surface-200 border border-surface-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() }}}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {chips.map(chip => (
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
                disabled={!prompt.trim() && filterMuscles.length === 0 && !filterEquipment && !filterGoal && !filterDifficulty && !filterDuration}
                className="w-full gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {t('ai.generate')}
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
                    {getDifficultyLabel(generatedPlan.difficulty)}
                  </span>
                  <span className="text-xs bg-surface-100 text-gray-300 px-2 py-0.5 rounded-full">
                    {generatedPlan.exercises.length} {t('workouts.exercises')}
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
                        {ex.sets} × {ex.reps_min === ex.reps_max ? ex.reps_min : `${ex.reps_min}-${ex.reps_max}`} {t('session.reps')} · {formatRest(ex.rest_seconds)} {t('session.restTimer').toLowerCase()}
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
                  title={t('ai.regenerate')}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setGeneratedPlan(null); setPrompt(''); setFilterMuscles([]); setFilterEquipment(''); setFilterGoal(''); setFilterDifficulty(''); setFilterDuration(null) }}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.back')}
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
                  {t('ai.saveAndUse')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
