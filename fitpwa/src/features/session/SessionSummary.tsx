import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Share2, TrendingUp } from 'lucide-react'
import { Button } from '@/shared/components/Button'

export function SessionSummary() {
  const location = useLocation()
  const stats = location.state?.stats || { volume: 0, exercisesCount: 0, setsCount: 0 }
  const duration = location.state?.duration || 0
  
  const xpGained = 100 + (stats.exercisesCount * 10) + (stats.setsCount * 2)

  const [mood, setMood] = useState<string | null>(null)
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    return `${m} min`
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 pb-24 text-center mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Treino Concluído!
        </h1>
        <p className="text-primary font-bold mt-2 text-xl">+ {xpGained} XP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="bg-surface-200 p-4 rounded-xl border border-surface-100">
          <p className="text-gray-400 text-sm">Duração</p>
          <p className="text-2xl font-bold text-white">{formatTime(duration)}</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-xl border border-surface-100">
          <p className="text-gray-400 text-sm">Volume Total</p>
          <p className="text-2xl font-bold text-white">{stats.volume.toLocaleString()} kg</p>
        </div>
      </div>

      <div className="bg-surface-200 p-6 rounded-2xl border border-pr/50 text-left">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-pr w-6 h-6" />
          <h3 className="font-bold text-lg text-white">Novos PRs!</h3>
        </div>
        <ul className="space-y-3">
          <li className="flex justify-between items-center text-sm border-b border-surface-100 pb-2">
            <span className="text-gray-300">Agachamento com Barra</span>
            <span className="font-bold text-pr">100kg x 8</span>
          </li>
          <li className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Supino Plano</span>
            <span className="font-bold text-pr">80kg x 6</span>
          </li>
        </ul>
      </div>

      <div className="bg-surface-200 p-6 rounded-2xl border border-surface-100">
        <h3 className="text-white font-medium mb-4">Como te sentiste hoje?</h3>
        <div className="flex justify-around text-4xl">
          {['😫', '😕', '😐', '🙂', '🤩'].map(emoji => (
            <button
              key={emoji}
              onClick={() => setMood(emoji)}
              className={`hover:scale-125 transition-transform ${mood === emoji ? 'scale-125 drop-shadow-md' : 'opacity-50 grayscale'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button className="w-full text-black font-bold h-14">
          <Share2 className="w-5 h-5 mr-2" />
          Partilhar Resultado
        </Button>
        <Link to="/dashboard">
          <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
            Finalizar
          </Button>
        </Link>
      </div>

    </div>
  )
}
