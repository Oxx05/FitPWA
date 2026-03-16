import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FeatureGate } from '../premium/FeatureGate'

const mockVolumeData = [
  { week: 'W1', volume: 12000 },
  { week: 'W2', volume: 13500 },
  { week: 'W3', volume: 14200 },
  { week: 'W4', volume: 13800 },
  { week: 'W5', volume: 15400 },
  { week: 'W6', volume: 16100 },
  { week: 'W7', volume: 17200 },
  { week: 'W8', volume: 18500 },
]

export function ProgressDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Progresso</h1>
        <p className="text-gray-400">Analisa a tua evolução ao longo do tempo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Treinos esta semana</h3>
          <p className="text-3xl font-bold text-primary">3 <span className="text-base font-normal text-gray-500">/ 4 meta</span></p>
        </div>
        
        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Volume Semanal</h3>
          <p className="text-3xl font-bold text-white">18.5 <span className="text-base font-normal text-gray-500">toneladas</span></p>
          <p className="text-sm text-primary mt-1 flex items-center gap-1">
            <span className="text-xs">▲</span> +7% vs semana anterior
          </p>
        </div>

        <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Streak Total</h3>
          <p className="text-3xl font-bold text-white">14 <span className="text-base font-normal text-gray-500">dias</span></p>
        </div>
      </div>

      <div className="bg-surface-200 border border-surface-100 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Volume de Treino (8 semanas)</h3>
        </div>
        
        <div className="h-64 w-full">
          <FeatureGate featureName="Gráficos de Volume Detalhados">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111111', borderColor: '#262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#00ff87' }}
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
