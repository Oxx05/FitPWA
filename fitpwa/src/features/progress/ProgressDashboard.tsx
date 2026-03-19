import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FeatureGate } from '../premium/FeatureGate'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/authStore'
import { startOfWeek, subWeeks, isSameWeek, format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { Trash2, Calendar, Clock, Weight, ChevronRight, Zap, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/contexts/ToastContext'

export interface WorkoutSessionDetail {
  id: string
  plan_name: string | null
  finished_at: string | null
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
  const [savingAsPlan, setSavingAsPlan] = useState(false)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const currentLocale = i18n.language === 'pt' ? ptBR : enUS

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
          finished_at,
          total_volume_kg,
          duration_seconds
        `)
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null)
        .gte('finished_at', eightWeeksAgo.toISOString())
        .order('finished_at', { ascending: true })

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
      const currentWeekWorkouts = history.filter(h => isSameWeek(new Date(h.finished_at!), now))
      
      // Calculate total volume for current week
      const currentWeekVolume = currentWeekWorkouts.reduce((sum, h) => sum + (Number(h.total_volume_kg) || 0), 0)
      
      // Calculate total volume for previous week
      const previousWeekWorkouts = history.filter(h => isSameWeek(new Date(h.finished_at!), subWeeks(now, 1)))
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
        const weekKey = format(weekDate, "dd MMM", { locale: currentLocale })
        chartDataMap.set(weekKey, { week: weekKey, volume: 0 })
      }

      history.forEach(h => {
        const weekKey = format(startOfWeek(new Date(h.finished_at!)), "dd MMM", { locale: currentLocale })
        if (chartDataMap.has(weekKey)) {
          const entry = chartDataMap.get(weekKey)
          entry.volume += (Number(h.total_volume_kg) || 0)
        }
      })

      // Try to determine consecutive days workout streak
      let streak = 0
      const dates = history
        .map(h => format(new Date(h.finished_at!), 'yyyy-MM-dd'))
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
        prs: (prsData || []).map((pr: { exercises: any, one_rep_max?: number, weight_kg?: number, reps?: number }) => ({
          exercise_name: i18n.language === 'pt' 
            ? ((pr.exercises as any)?.name_pt || (pr.exercises as any)?.name) 
            : ((pr.exercises as any)?.name || (pr.exercises as any)?.name_pt) || 'Exercise',
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

      // PR Cleanup Logic: Refresh PRs after deletion
      // Since we don't know which PR was set in this session without complex queries,
      // we'll just invalidate the queries so they refresh from DB which should be correct.
      // However, the DB only stores the "best" PR. If we delete the session that HAD the best PR,
      // the DB personal_records might still show it unless we have an archival system.
      // The current schema has personal_records (unique per user/ex).
      // If we delete a session, we should check if any PRs were achieved in that session.
      
      const { data: sessionPRs } = await supabase
        .from('personal_records')
        .select('exercise_id')
        .eq('session_id', sessionId)

      if (sessionPRs && sessionPRs.length > 0) {
        // If a PR was set in this session, we need to find the NEXT best PR for those exercises.
        for (const pr of sessionPRs) {
          const { data: nextBest } = await supabase
            .from('personal_record_history')
            .select('*')
            .eq('user_id', profile?.id)
            .eq('exercise_id', pr.exercise_id)
            .neq('session_id', sessionId) // If session_id was tracked in history (not in schema yet, but let's assume it should be)
            .order('one_rep_max', { ascending: false })
            .limit(1)
            .single()

          if (nextBest) {
            await supabase.from('personal_records').upsert({
              user_id: profile?.id,
              exercise_id: pr.exercise_id,
              weight_kg: nextBest.weight_kg,
              reps: nextBest.reps,
              one_rep_max: nextBest.one_rep_max,
              achieved_at: nextBest.achieved_at
            })
          } else {
            await supabase.from('personal_records').delete().eq('user_id', profile?.id).eq('exercise_id', pr.exercise_id)
          }
        }
      }
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
    history: [] as Array<{ id: string; plan_name: string | null; finished_at: string | null; total_volume_kg: number; duration_seconds: number }>,
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
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-400 font-medium">{t('progress.loadingProgress')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">{t('progress.title')}</h1>
        <p className="text-gray-400">{t('progress.analyzeEvolution')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">{t('progress.workoutsThisWeek')}</h3>
          <p className="text-3xl font-bold text-primary">
            {safeStats.currentWeekCount}
          </p>
        </div>
        
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm md:col-span-2">
          <h3 className="text-gray-400 text-sm font-medium mb-1">{t('progress.weeklyVolume')}</h3>
          <p className="text-3xl font-bold text-white">
            {formatVolume(safeStats.currentWeekVolume)} <span className="text-base font-normal text-gray-500">{safeStats.currentWeekVolume >= 1000 ? t('progress.toneladas') : 'kg'}</span>
          </p>
          <p className={`text-sm mt-1 flex items-center gap-1 ${safeStats.volumeChange >= 0 ? 'text-primary' : 'text-red-400'}`}>
            <span className="text-xs">{safeStats.volumeChange >= 0 ? '▲' : '▼'}</span> 
            {Math.abs(safeStats.volumeChange)}% {t('progress.vsPreviousWeek')}
          </p>
        </div>

        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">{t('progress.streakTitle')}</h3>
          <p className="text-3xl font-bold text-white">
            {safeStats.streak} <span className="text-base font-normal text-gray-500">{safeStats.streak === 1 ? t('progress.day') : t('progress.daysCount')}</span>
          </p>
        </div>
      </div>

      {/* 1RM Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary shrink-0" /> <span className="truncate">{t('progress.prsTitle')}</span>
          </h3>
          <Link to="/records" className="text-primary text-sm font-medium hover:underline flex items-center gap-1 shrink-0 px-3 py-1.5 bg-primary/10 rounded-xl transition-colors hover:bg-primary/20">
            {t('progress.viewAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeStats.prs.slice(0, 3).map((pr, idx) => (
            <div key={idx} className="bg-surface-200 border border-surface-100 p-5 rounded-xl hover:border-primary/30 transition-all flex justify-between items-center group gap-4 overflow-hidden">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 truncate">{pr.exercise_name}</p>
                <p className="text-2xl font-bold text-white truncate">{Math.round(pr.one_rep_max)} <span className="text-sm font-normal text-gray-500">kg</span></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-500 uppercase font-bold">{t('progress.basedOn')}</p>
                <p className="text-xs font-medium text-gray-300">{pr.weight_kg}kg × {pr.reps}</p>
              </div>
            </div>
          ))}
          {safeStats.prs.length === 0 && (
            <div className="col-span-full bg-surface-200/50 border border-dashed border-surface-100 p-8 rounded-xl text-center">
              <p className="text-gray-500 italic text-sm">{t('progress.noPrsYet')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">{t('progress.volumeChartTitle')}</h3>
        </div>
        
        <div className="h-72 w-full min-h-[300px]">
          <FeatureGate featureName={t('progress.detailedVolumeCharts')}>
            <ResponsiveContainer width="99%" height="100%">
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
                    return [label, t('progress.weeklyVolume')]
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
        <h3 className="text-xl font-bold text-white">{t('progress.workoutHistory')}</h3>
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
                    <h4 className="font-bold text-white">{session.plan_name || t('workouts.deletedPlan')}</h4>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3 shrink-0" /> {formatDuration(session.duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Weight className="w-3 h-3 shrink-0" /> {formatVolume(session.total_volume_kg)} {session.total_volume_kg >= 1000 ? 'ton' : 'kg'}
                      </span>
                      <span className="whitespace-nowrap">{format(new Date(session.finished_at!), "dd MMM, HH:mm", { locale: currentLocale })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setCompareSession(session)
                    }}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Comparar treino"
                  >
                    <TrendingUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSessionToDelete(session.id)
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
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
            <p className="text-gray-500 italic">{t('progress.noDataYet')}</p>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {compareSession && (
          <Modal
            isOpen={!!compareSession}
            onClose={() => { setCompareSession(null); setComparisonTarget(null); }}
            title={t('progress.compareWorkouts')}
            size="lg"
          >
            <div className="space-y-6">
              <div className="bg-surface-100 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase font-black mb-2">{t('progress.selectedWorkout')}</p>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-lg">{compareSession.plan_name || t('workouts.deletedPlan')}</h4>
                  <p className="text-sm text-gray-400">{format(new Date(compareSession.finished_at!), "dd/MM/yyyy")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-gray-500 uppercase font-black">{t('progress.compareWithPrevious')}</label>
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
                        <span className="font-bold">{format(new Date(s.finished_at!), "dd MMM yyyy, HH:mm", { locale: currentLocale })}</span>
                        <span className="text-xs">{formatVolume(s.total_volume_kg)} kg</span>
                      </button>
                    ))}
                  {safeStats.history.filter(s => s.id !== compareSession.id && s.plan_name === compareSession.plan_name).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-4 bg-surface-200 rounded-xl">{t('progress.noComparisonSessions')}</p>
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
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('progress.volumeDifference')}</p>
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
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('progress.trainingTime')}</p>
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
                {t('common.close')}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!selectedSessionForDetails}
        onClose={() => setSelectedSessionForDetails(null)}
        title={selectedSessionForDetails?.plan_name || t('workouts.deletedPlan')}
        size="lg"
      >
        {isLoadingDetails ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : sessionDetails ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-100 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-white font-bold">
                  {selectedSessionForDetails && format(new Date(selectedSessionForDetails.finished_at!), "dd MMM yyyy, HH:mm", { locale: currentLocale })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 flex-wrap">
                <span className="flex items-center gap-1 whitespace-nowrap"><Clock className="w-4 h-4" /> {formatDuration(selectedSessionForDetails?.duration_seconds || 0)}</span>
                <span className="flex items-center gap-1 whitespace-nowrap"><Weight className="w-4 h-4" /> {formatVolume(selectedSessionForDetails?.total_volume_kg || 0)} {(selectedSessionForDetails?.total_volume_kg || 0) >= 1000 ? 'ton' : 'kg'}</span>
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

            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                disabled={savingAsPlan || !sessionDetails || sessionDetails.length === 0}
                onClick={async () => {
                  if (!sessionDetails || !profile?.id) return
                  setSavingAsPlan(true)
                  try {
                    const planName = selectedSessionForDetails?.plan_name || t('workouts.deletedPlan')
                    const exercises = sessionDetails.map((group: any) => {
                      const sets = group.sets
                      const validWeights = sets.map((s: any) => s.weight_kg).filter((w: number | null) => w != null && w > 0)
                      const avgWeight = validWeights.length > 0 ? Math.round(validWeights.reduce((a: number, b: number) => a + Number(b), 0) / validWeights.length) : null
                      
                      const validReps = sets.map((s: any) => s.reps).filter((r: number | null) => r != null && r > 0)
                      const avgReps = validReps.length > 0 ? Math.round(validReps.reduce((a: number, b: number) => a + Number(b), 0) / validReps.length) : 10
                      
                      return {
                        name: group.name,
                        exercise_id: sets[0]?.exercise_id || '',
                        sets: sets.length,
                        reps_min: Math.max(1, avgReps - 2),
                        reps_max: avgReps + 2,
                        rest_seconds: 90,
                        weight_kg: avgWeight,
                      }
                    })
                    navigate('/workouts/new', {
                      state: {
                        initialData: {
                          name: planName + ' (copy)',
                          description: '',
                          exercises: exercises.map((ex: any) => ({
                            name: ex.name,
                            exercise_id: ex.exercise_id,
                            sets: ex.sets,
                            reps_min: ex.reps_min,
                            reps_max: ex.reps_max,
                            rest_seconds: ex.rest_seconds,
                            weight_kg: ex.weight_kg,
                          }))
                        }
                      }
                    })
                    showToast(t('workouts.saveAsPlanSuccess'), 'success')
                    setSelectedSessionForDetails(null)
                  } catch {
                    showToast(t('workouts.saveAsPlanError'), 'error')
                  } finally {
                    setSavingAsPlan(false)
                  }
                }}
              >
                {savingAsPlan ? t('common.loading') : t('workouts.saveAsPlan')}
              </Button>
              <Button className="flex-1" onClick={() => setSelectedSessionForDetails(null)}>{t('common.close')}</Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 text-gray-500">
            {t('progress.noSessionDetails')}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => sessionToDelete && deleteSession.mutate(sessionToDelete)}
        title={t('progress.deleteWorkout')}
        message={t('progress.deleteWorkoutConfirm')}
        confirmText={t('common.delete')}
        variant="danger"
        isLoading={deleteSession.isPending}
      />
    </div>
  )
}
