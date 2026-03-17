import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FeatureGate } from '../premium/FeatureGate'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/authStore'
import { startOfWeek, subWeeks, isSameWeek, format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Trash2, Calendar, Clock, Weight, ChevronRight, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { AnimatePresence, motion } from 'framer-motion'

export interface WorkoutSessionDetail {
  id: string
  plan_name: string | null
  created_at: string | null
  total_volume_kg: number
  duration_seconds: number
}

interface GroupedSets {
  [exerciseName: string]: unknown[]
}

export function ProgressDashboard() {
  const { profile } = useAuthStore()
  const queryClient = useQueryClient()
  const [compareSession, setCompareSession] = useState<WorkoutSessionDetail | null>(null)
  const [comparisonTarget, setComparisonTarget] = useState<WorkoutSessionDetail | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<WorkoutSessionDetail | null>(null)

  const { data: sessionDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['session-details', selectedSessionForDetails?.id],
    queryFn: async () => {
      if (!selectedSessionForDetails?.id) return null
      const { data, error } = await supabase
        .from('session_sets')
        .select('*')
        .eq('session_id', selectedSessionForDetails.id)
        .order('set_number', { ascending: true })
      
      if (error) throw error
      
      // Group by exercise
      const grouped = (data || []).reduce((acc: GroupedSets, set: { exercise_name: string }) => {
        if (!acc[set.exercise_name]) acc[set.exercise_name] = []
        acc[set.exercise_name].push(set)
        return acc
      }, {})
      
      return Object.entries(grouped).map(([name, sets]) => ({
        name,
        sets: sets as unknown[]
      }))
    },
    enabled: !!selectedSessionForDetails?.id
  })

  const { data: stats, isLoading } = useQuery({
    queryKey: ['progress-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null

      // Get last 8 weeks of workouts
      const eightWeeksAgo = startOfWeek(subWeeks(new Date(), 8))
      
      const { data: history } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          plan_name,
          created_at,
          total_volume_kg,
          duration_seconds
        `)
        .eq('user_id', profile.id)
        .not('created_at', 'is', null)
        .gte('created_at', eightWeeksAgo.toISOString())
        .order('created_at', { ascending: true })

      // Fetch Personal Records
      const { data: prsData } = await supabase
        .from('personal_records')
        .select(`
          exercise_id,
          weight_kg,
          reps,
          one_rep_max,
          exercises (
            name,
            name_pt
          )
        `)
        .eq('user_id', profile.id)
        .order('one_rep_max', { ascending: false })

      if (!history) return null

      const now = new Date()
      const currentWeekWorkouts = history.filter(h => isSameWeek(new Date(h.created_at!), now))
      
      // Calculate total volume for current week
      const currentWeekVolume = currentWeekWorkouts.reduce((sum, h) => sum + (Number(h.total_volume_kg) || 0), 0)
      
      // Calculate total volume for previous week
      const previousWeekWorkouts = history.filter(h => isSameWeek(new Date(h.created_at!), subWeeks(now, 1)))
      const prevWeekVolume = previousWeekWorkouts.reduce((sum, h) => sum + (Number(h.total_volume_kg) || 0), 0)

      let volumeChange = 0
      if (prevWeekVolume > 0) {
        volumeChange = Math.round(((currentWeekVolume - prevWeekVolume) / prevWeekVolume) * 100)
      } else if (currentWeekVolume > 0) {
        volumeChange = 100
      }

      // Group volume by week for the chart
      const chartDataMap = new Map()
      
      // Initialize last 8 weeks with 0 volume
      for (let i = 7; i >= 0; i--) {
        const weekDate = startOfWeek(subWeeks(now, i))
        const weekKey = format(weekDate, "dd MMM", { locale: pt })
        chartDataMap.set(weekKey, { week: weekKey, volume: 0 })
      }

      history.forEach(h => {
        const weekKey = format(startOfWeek(new Date(h.created_at!)), "dd MMM", { locale: pt })
        if (chartDataMap.has(weekKey)) {
          const entry = chartDataMap.get(weekKey)
          entry.volume += (Number(h.total_volume_kg) || 0)
        }
      })

      // Try to determine consecutive days workout streak
      let streak = 0
      const dates = history
        .map(h => format(new Date(h.created_at!), 'yyyy-MM-dd'))
        .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Descending

      if (dates.length > 0) {
        const currentDate = new Date()
        const todayStr = format(currentDate, 'yyyy-MM-dd')
        const yesterdayStr = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd')
        
        if (dates[0] === todayStr || dates[0] === yesterdayStr) {
          streak = 1
          const checkDate = new Date(dates[0])
          
          for (let i = 1; i < dates.length; i++) {
            checkDate.setDate(checkDate.getDate() - 1)
            if (dates[i] === format(checkDate, 'yyyy-MM-dd')) {
              streak++
            } else {
              break
            }
          }
        }
      }

      return {
        currentWeekCount: currentWeekWorkouts.length,
        currentWeekVolume,
        volumeChange,
        streak,
        chartData: Array.from(chartDataMap.values()),
        history: [...history].reverse(),
        prs: (prsData || []).map((pr: { exercises: unknown, one_rep_max?: number, weight_kg?: number, reps?: number }) => ({
          exercise_name: (pr.exercises as unknown as { name_pt?: string, name: string })?.name_pt || (pr.exercises as unknown as { name_pt?: string, name: string })?.name || 'Exercício',
          one_rep_max: pr.one_rep_max || 0,
          weight_kg: pr.weight_kg || 0,
          reps: pr.reps || 0
        }))
      }
    }
  })

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-stats'] })
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] })
      setSessionToDelete(null)
    }
  })

  const defaultStats = {
    currentWeekCount: 0,
    currentWeekVolume: 0,
    volumeChange: 0,
    streak: 0,
    chartData: [] as Array<{ week: string; volume: number }>,
    history: [] as Array<{ id: string; plan_name: string | null; created_at: string | null; total_volume_kg: number; duration_seconds: number }>,
    prs: [] as Array<{ exercise_name: string; one_rep_max: number; weight_kg: number; reps: number }>
  }

  const safeStats = stats || defaultStats

  const formatVolume = (kg: number) => {
    if (kg >= 1000) return (kg / 1000).toFixed(1)
    return Math.round(kg).toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h${m > 0 ? ` ${m}m` : ''}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium">A carregar progresso...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Progresso</h1>
        <p className="text-gray-400">Analisa a tua evolução ao longo do tempo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Treinos esta semana</h3>
          <p className="text-3xl font-bold text-primary">
            {safeStats.currentWeekCount}
          </p>
        </div>
        
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm md:col-span-2">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Volume Semanal</h3>
          <p className="text-3xl font-bold text-white">
            {formatVolume(safeStats.currentWeekVolume)} <span className="text-base font-normal text-gray-500">{safeStats.currentWeekVolume >= 1000 ? 'toneladas' : 'kg'}</span>
          </p>
          <p className={`text-sm mt-1 flex items-center gap-1 ${safeStats.volumeChange >= 0 ? 'text-primary' : 'text-red-400'}`}>
            <span className="text-xs">{safeStats.volumeChange >= 0 ? '▲' : '▼'}</span> 
            {Math.abs(safeStats.volumeChange)}% vs semana anterior
          </p>
        </div>

        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Streak Atual</h3>
          <p className="text-3xl font-bold text-white">
            {safeStats.streak} <span className="text-base font-normal text-gray-500">{safeStats.streak === 1 ? 'dia' : 'dias'}</span>
          </p>
        </div>
      </div>

      {/* 1RM Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Recordes Pessoais (1RM)
          </h3>
          <Link to="/records" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeStats.prs.slice(0, 3).map((pr, idx) => (
            <div key={idx} className="bg-surface-200 border border-surface-100 p-5 rounded-xl hover:border-primary/30 transition-all flex justify-between items-center group">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{pr.exercise_name}</p>
                <p className="text-2xl font-bold text-white">{Math.round(pr.one_rep_max)} <span className="text-sm font-normal text-gray-500">kg</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Baseado em</p>
                <p className="text-xs font-medium text-gray-300">{pr.weight_kg}kg × {pr.reps}</p>
              </div>
            </div>
          ))}
          {safeStats.prs.length === 0 && (
            <div className="col-span-full bg-surface-200/50 border border-dashed border-surface-100 p-8 rounded-xl text-center">
              <p className="text-gray-500 italic text-sm">Ainda não tens recordes registados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Volume de Treino (8 semanas)</h3>
        </div>
        
        <div className="h-64 w-full">
          <FeatureGate featureName="Gráficos de Volume Detalhados">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeStats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff87" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#525252" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', borderColor: '#262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#00ff87' }}
                  formatter={(value) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0)
                    const label = numericValue >= 1000
                      ? `${(numericValue / 1000).toFixed(2)} TON`
                      : `${numericValue} kg`
                    return [label, 'Volume']
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#00ff87" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </FeatureGate>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Histórico de Treinos</h3>
        {safeStats.history.length > 0 ? (
          <div className="space-y-3">
            {safeStats.history.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => setSelectedSessionForDetails(session)}
                  className="bg-surface-200 border border-surface-100 p-4 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer"
                >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{session.plan_name || 'Treino Personalizado'}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(session.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Weight className="w-3 h-3" /> {formatVolume(session.total_volume_kg)}kg
                      </span>
                      <span>{format(new Date(session.created_at!), "dd MMM, HH:mm", { locale: pt })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setCompareSession(session)
                    }}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Comparar treino"
                  >
                    <TrendingUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSessionToDelete(session.id)
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Apagar treino"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-200 border border-dashed border-surface-100 p-8 rounded-2xl text-center">
            <p className="text-gray-500">Ainda não completaste nenhum treino.</p>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {compareSession && (
          <Modal
            isOpen={!!compareSession}
            onClose={() => { setCompareSession(null); setComparisonTarget(null); }}
            title="Comparar Treinos"
            size="lg"
          >
            <div className="space-y-6">
              <div className="bg-surface-100 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase font-black mb-2">Treino Selecionado</p>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-lg">{compareSession.plan_name || 'Treino Personalizado'}</h4>
                  <p className="text-sm text-gray-400">{format(new Date(compareSession.created_at!), "dd/MM/yyyy")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-gray-500 uppercase font-black">Comparar com sessão anterior:</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {safeStats.history
                    .filter(s => s.id !== compareSession.id && s.plan_name === compareSession.plan_name)
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => setComparisonTarget(s)}
                        className={`p-3 rounded-xl border text-left transition-all flex justify-between items-center ${
                          comparisonTarget?.id === s.id 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-surface-200 border-white/5 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <span className="font-bold">{format(new Date(s.created_at!), "dd MMM yyyy, HH:mm")}</span>
                        <span className="text-xs">{formatVolume(s.total_volume_kg)} kg</span>
                      </button>
                    ))}
                  {safeStats.history.filter(s => s.id !== compareSession.id && s.plan_name === compareSession.plan_name).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-4 bg-surface-200 rounded-xl">Não foram encontradas outras sessões deste plano para comparar.</p>
                  )}
                </div>
              </div>

              {comparisonTarget && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4 p-6 bg-surface-200 rounded-[2rem] border border-white/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <TrendingUp size={60} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Diferença de Volume</p>
                    <div className="flex items-center gap-2">
                       <p className="text-2xl font-black italic">
                        {Math.round(compareSession.total_volume_kg - comparisonTarget.total_volume_kg)}kg
                      </p>
                      {compareSession.total_volume_kg > comparisonTarget.total_volume_kg ? (
                        <TrendingUp className="text-primary w-5 h-5" />
                      ) : (
                        <TrendingDown className="text-red-400 w-5 h-5" />
                      )}
                    </div>
                  </div>

                   <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Tempo de Treino</p>
                    <div className="flex items-center gap-2">
                       <p className="text-2xl font-black italic">
                        {Math.round((compareSession.duration_seconds - comparisonTarget.duration_seconds) / 60)} min
                      </p>
                      {compareSession.duration_seconds < comparisonTarget.duration_seconds ? (
                        <Zap className="text-primary w-5 h-5" />
                      ) : (
                        <Clock className="text-gray-500 w-5 h-5" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => { setCompareSession(null); setComparisonTarget(null); }}
              >
                Fechar
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!selectedSessionForDetails}
        onClose={() => setSelectedSessionForDetails(null)}
        title={selectedSessionForDetails?.plan_name || 'Detalhes do Treino'}
        size="lg"
      >
        {isLoadingDetails ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessionDetails ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-100 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-white font-bold">
                  {selectedSessionForDetails && format(new Date(selectedSessionForDetails.created_at!), "dd MMM yyyy, HH:mm", { locale: pt })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(selectedSessionForDetails?.duration_seconds || 0)}</span>
                <span className="flex items-center gap-1"><Weight className="w-4 h-4" /> {formatVolume(selectedSessionForDetails?.total_volume_kg || 0)}kg</span>
              </div>
            </div>

            <div className="space-y-4">
              {sessionDetails.map((group: { name: string, sets: unknown[] }, idx: number) => (
                <div key={idx} className="bg-surface-100/50 rounded-xl overflow-hidden border border-white/5">
                  <div className="bg-surface-100 px-4 py-2 border-b border-white/5">
                    <h4 className="font-bold text-white italic">{group.name}</h4>
                  </div>
                  <div className="p-2 space-y-1">
                    {(group.sets as { set_number: number, weight_kg: number, reps: number, notes?: string }[]).map((set, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-primary/20 text-primary w-5 h-5 flex items-center justify-center rounded-full font-bold">
                            {set.set_number}
                          </span>
                          <span className="text-sm text-white font-medium">{set.weight_kg}kg × {set.reps}</span>
                        </div>
                        {set.notes && (
                          <span className="text-xs text-gray-500 italic truncate max-w-[150px]">{set.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={() => setSelectedSessionForDetails(null)}>Fechar</Button>
          </div>
        ) : (
          <div className="text-center p-12 text-gray-500">
            Não foram encontrados detalhes para esta sessão.
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => sessionToDelete && deleteSession.mutate(sessionToDelete)}
        title="Apagar Treino"
        message="Tens a certeza que queres apagar este treino? Esta acção não pode ser revertida."
        confirmText="Apagar"
        variant="danger"
        isLoading={deleteSession.isPending}
      />
    </div>
  )
}
