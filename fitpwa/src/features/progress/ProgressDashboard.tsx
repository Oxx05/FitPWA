import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FeatureGate } from '../premium/FeatureGate'
import { supabase } from '@/shared/lib/supabase'
import { useAuthStore } from '../auth/AuthProvider'
import { startOfWeek, subWeeks, isSameWeek, format } from 'date-fns'
import { pt } from 'date-fns/locale'

export function ProgressDashboard() {
  const { profile } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['progress-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null

      // Get last 8 weeks of workouts
      const eightWeeksAgo = startOfWeek(subWeeks(new Date(), 8))
      
      const { data: history } = await supabase
        .from('workout_history')
        .select(`
          created_at,
          total_volume,
          duration_seconds
        `)
        .eq('user_id', profile.id)
        .gte('created_at', eightWeeksAgo.toISOString())
        .order('created_at', { ascending: true })

      if (!history) return null

      const now = new Date()
      const currentWeekWorkouts = history.filter(h => isSameWeek(new Date(h.created_at), now))
      
      // Calculate total volume for current week
      const currentWeekVolume = currentWeekWorkouts.reduce((sum, h) => sum + ((h.total_volume as number) || 0), 0)
      
      // Calculate total volume for previous week
      const previousWeekWorkouts = history.filter(h => isSameWeek(new Date(h.created_at), subWeeks(now, 1)))
      const prevWeekVolume = previousWeekWorkouts.reduce((sum, h) => sum + ((h.total_volume as number) || 0), 0)

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
        const weekDate = subWeeks(now, i)
        const weekKey = format(weekDate, "dd MMM", { locale: pt })
        chartDataMap.set(weekKey, { week: weekKey, volume: 0 })
      }

      history.forEach(h => {
        const weekKey = format(startOfWeek(new Date(h.created_at)), "dd MMM", { locale: pt })
        if (chartDataMap.has(weekKey)) {
          const entry = chartDataMap.get(weekKey)
          entry.volume += ((h.total_volume as number) || 0)
        }
      })

      // Try to determine consecutive days workout streak
      let streak = 0
      const dates = history
        .map(h => format(new Date(h.created_at), 'yyyy-MM-dd'))
        .filter((v, i, a) => a.indexOf(v) === i) // Unique dates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Descending

      if (dates.length > 0) {
        let currentDate = new Date()
        const todayStr = format(currentDate, 'yyyy-MM-dd')
        
        // If they haven't worked out today or yesterday, streak is 0
        const yesterdayStr = format(new Date(currentDate.setDate(currentDate.getDate() - 1)), 'yyyy-MM-dd')
        
        if (dates[0] === todayStr || dates[0] === yesterdayStr) {
          streak = 1
          let checkDate = new Date(dates[0])
          
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
        chartData: Array.from(chartDataMap.values())
      }
    }
  })

  // Format volume from kg to Toneladas (T)
  const formatVolume = (kg: number) => {
    if (kg >= 1000) return (kg / 1000).toFixed(1)
    return kg.toString()
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Progresso</h1>
        <p className="text-gray-400">Analisa a tua evolução ao longo do tempo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Treinos esta semana</h3>
          <p className="text-3xl font-bold text-primary">
            {stats?.currentWeekCount || 0} <span className="text-base font-normal text-gray-500">/ 4 meta</span>
          </p>
        </div>
        
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Volume Semanal</h3>
          <p className="text-3xl font-bold text-white">
            {stats ? formatVolume(stats.currentWeekVolume) : 0} <span className="text-base font-normal text-gray-500">{stats?.currentWeekVolume >= 1000 ? 'toneladas' : 'kg'}</span>
          </p>
          <p className={`text-sm mt-1 flex items-center gap-1 ${stats?.volumeChange && stats.volumeChange >= 0 ? 'text-primary' : 'text-red-400'}`}>
            <span className="text-xs">{stats?.volumeChange && stats.volumeChange >= 0 ? '▲' : '▼'}</span> 
            {stats?.volumeChange ? Math.abs(stats.volumeChange) : 0}% vs semana anterior
          </p>
        </div>

        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Streak Atual</h3>
          <p className="text-3xl font-bold text-white">
            {stats?.streak || 0} <span className="text-base font-normal text-gray-500">{stats?.streak === 1 ? 'dia' : 'dias'}</span>
          </p>
        </div>
      </div>

      <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Volume de Treino (8 semanas)</h3>
        </div>
        
        <div className="h-64 w-full">
          <FeatureGate featureName="Gráficos de Volume Detalhados">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => [value >= 1000 ? `${(value/1000).toFixed(2)} TON` : `${value} kg`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#00ff87" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </FeatureGate>
        </div>
      </div>

    </div>
  )
}
