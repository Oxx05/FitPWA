import { useAuthStore } from './authStore'
import { Modal } from '@/shared/components/Modal'
import { Button } from '@/shared/components/Button'
import { Trophy, Zap, Star, Gift } from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export function LevelUpOverlay() {
  const { pendingLevelUp, clearPendingLevelUp } = useAuthStore()

  useEffect(() => {
    if (pendingLevelUp) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ff87', '#00dfd8', '#ffffff']
      })
    }
  }, [pendingLevelUp])

  if (!pendingLevelUp) return null

  const rewards = [
    { icon: <Zap className="w-5 h-5 text-yellow-400" />, text: "Aumento de stamina +5%" },
    { icon: <Star className="w-5 h-5 text-primary" />, text: "Nova Badge de Nível" },
    { icon: <Gift className="w-5 h-5 text-blue-400" />, text: "Desbloqueio de novos exercícios" }
  ]

  return (
    <Modal
      isOpen={!!pendingLevelUp}
      onClose={clearPendingLevelUp}
      title=""
      size="sm"
    >
      <div className="text-center space-y-6 py-4">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-primary shadow-lg shadow-primary/20"
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
        
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Level Up!</h2>
          <p className="text-gray-400 mt-1">Alcançaste o Nível <span className="text-primary font-bold">{pendingLevelUp}</span></p>
        </div>

        <div className="bg-surface-100 rounded-2xl p-4 space-y-3 text-left border border-surface-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">As tuas Recompensas</p>
          <div className="space-y-2">
            {rewards.map((reward, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="flex items-center gap-3 bg-surface-200/50 p-2 rounded-xl border border-surface-200"
              >
                {reward.icon}
                <span className="text-sm text-gray-200">{reward.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <Button 
          onClick={clearPendingLevelUp}
          className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase italic"
        >
          Continuar Jornada
        </Button>
      </div>
    </Modal>
  )
}
