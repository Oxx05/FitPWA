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
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-US'

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
        date: finalDate.toLocaleDateString(locale, {
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
        className="p-6 bg-surface-200 border border-surface-100 rounded-2xl"
      >
        <p className="text-gray-400 text-center">
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

  const colors = ['#BEF264', '#a78bfa', '#fb923c'] // primary, purple, orange

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-surface-200 border border-surface-100 rounded-2xl"
    >
      <h3 className="text-lg font-bold text-white italic uppercase tracking-tighter mb-4">📈 {t('session.evolution')}</h3>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
          <LineChart
            data={combinedData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F1F23',
                border: '1px solid #2a2a2e',
                borderRadius: '12px',
                fontSize: '11px',
              }}
              labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />

            {topExercises.map((exercise, idx) => (
              <Line
                key={exercise.exercise}
                type="monotone"
                dataKey={exercise.exercise}
                stroke={colors[idx]}
                strokeWidth={2}
                dot={{ fill: colors[idx], r: 4 }}
                activeDot={{ r: 6 }}
                name={exercise.exercise.charAt(0).toUpperCase() + exercise.exercise.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {topExercises.map((exercise, idx) => (
          <div key={exercise.exercise} className="text-sm bg-surface-100 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx] }} />
              <span className="text-gray-400 text-xs truncate">{exercise.exercise}</span>
            </div>
            <div className="text-white font-bold">{exercise.maxWeight} kg</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
