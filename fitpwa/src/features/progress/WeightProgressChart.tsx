import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { PersonalRecord } from '@/shared/types'

interface WeightProgressChartProps {
  records: PersonalRecord[]
}

export function WeightProgressChart({ records }: WeightProgressChartProps) {
  const { t } = useTranslation()
  // Group by exercise and get weight progression over time
  const exerciseProgress = records.reduce(
    (acc, record) => {
      if (!acc[record.exercise_id]) {
        acc[record.exercise_id] = []
      }
      
      const recordDate = record.date_set || record.created_at
      const dateObj = recordDate ? new Date(recordDate) : new Date()
      const finalDate = isNaN(dateObj.getTime()) ? new Date() : dateObj

      acc[record.exercise_id].push({
        date: finalDate.toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: 'short',
        }),
        weight: record.weight_kg,
        exercise: record.exercise_id,
        fullDate: finalDate,
      })
      return acc
    },
    {} as Record<
      string,
      Array<{ date: string; weight: number; exercise: string; fullDate: Date }>
    >
  )

  // Sort by date
  Object.keys(exerciseProgress).forEach((key) => {
    exerciseProgress[key].sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
  })

  // Get top 3 exercises by weight
  const topExercises = Object.entries(exerciseProgress)
    .map(([exercise, data]) => ({
      exercise,
      maxWeight: Math.max(...data.map((d) => d.weight)),
      data,
    }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 3)

  if (topExercises.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg"
      >
        <p className="text-slate-400 text-center">
          {t('progress.noProgressData')}
        </p>
      </motion.div>
    )
  }

  // Combine data from top 3 exercises by date
  const combinedData: Array<{
    date: string
    [key: string]: string | number | undefined
  }> = []
  const dateMap = new Map<string, Record<string, number | string>>()

  topExercises.forEach(({ exercise, data }) => {
    data.forEach(({ date, weight, fullDate }) => {
      const dateStr = date
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr, fullDate: fullDate.getTime() })
      }
      const entry = dateMap.get(dateStr)!
      entry[exercise] = weight
    })
  })

  // Sort by date and create array
  Array.from(dateMap.entries())
    .sort((a, b) => {
      const dateA = a[1].fullDate as number
      const dateB = b[1].fullDate as number
      return dateA - dateB
    })
    .forEach(([, data]) => {
      delete data.fullDate
      combinedData.push(data as typeof combinedData[0])
    })

  const colors = ['#3b82f6', '#fbbf24', '#10b981'] // Blue, Yellow, Green

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg"
    >
      <h3 className="text-lg font-semibold text-white mb-4">📈 {t('session.evolution')}</h3>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />

            {topExercises.map((exercise, idx) => (
              <Line
                key={exercise.exercise}
                type="monotone"
                dataKey={exercise.exercise}
                stroke={colors[idx]}
                strokeWidth={2}
                dot={{ fill: colors[idx], r: 5 }}
                activeDot={{ r: 7 }}
                name={exercise.exercise.charAt(0).toUpperCase() + exercise.exercise.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {topExercises.map((exercise, idx) => (
          <div key={exercise.exercise} className="text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }} />
              <span className="text-slate-300">{exercise.exercise}</span>
            </div>
            <div className="text-white font-semibold">{exercise.maxWeight} kg</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
