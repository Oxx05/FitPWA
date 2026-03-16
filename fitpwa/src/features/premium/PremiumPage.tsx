import { motion } from 'framer-motion'
import { Check, Zap, Shield, Crown } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { useAuthStore } from '../auth/AuthProvider'
import { createCheckoutSession } from '@/shared/lib/stripe'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function PremiumPage() {
  const { user, isPremium } = useAuthStore()
  const navigate = useNavigate()
  const [useModal, setUseModal] = useState(false)

  useEffect(() => {
    const handleResize = () => setUseModal(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    setUseModal(window.innerWidth < 768)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubscribe = () => {
    if (!user) return
    createCheckoutSession(user.id)
  }

  // Mobile: show as modal, Desktop: show as page
  const content = (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-5xl mx-auto space-y-12 pb-32">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-widest"
        >
          <Crown className="w-4 h-4" /> FitPWA PRO
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-white">Leva o teu treino para o nível seguinte.</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Desbloqueia estatísticas avançadas, planos personalizados e suporte prioritário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Features List */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">O que recebes com o PRO:</h2>
          <ul className="space-y-6">
            {[
              { icon: <Zap />, title: 'Análise de Volume Ilimitada', desc: 'Gráficos detalhados por grupo muscular e tendências de longo prazo.' },
              { icon: <Shield />, title: 'Backup na Nuvem automático', desc: 'Nunca percas o teu histórico de treinos, mesmo que mudes de telemóvel.' },
              { icon: <Check />, title: 'Programas de Treino Exclusivos', desc: 'Acesso a rotinas criadas por especialistas para hipertrofia e força.' },
            ].map((f, i) => (
              <motion.li 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-surface-200 border border-surface-100 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white">{f.title}</h4>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-surface-200 border-2 border-primary rounded-3xl p-8 shadow-2xl shadow-primary/10 relative overflow-hidden"
        >
          {isPremium && (
            <div className="absolute top-4 right-4 bg-primary text-black text-xs font-black px-2 py-1 rounded">
              ATIVO
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Plano Anual</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white">2.99€</span>
              <span className="text-gray-400">/mês</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Faturado anualmente (35.88€)</p>
          </div>

          <div className="space-y-4 mb-8">
            {['Sem fidelização', '7 dias de teste grátis', 'Acesso em todos os teus dispositivos'].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSubscribe} 
            className="w-full h-14 text-lg font-bold"
            disabled={isPremium}
          >
            {isPremium ? 'Já és Premium' : 'Começar Agora'}
          </Button>
          
          <p className="text-center text-xs text-gray-500 mt-6">
            Pagamentos seguros via Stripe. Cancela a qualquer momento nas definições.
          </p>
        </motion.div>
      </div>
    </div>
  )

  return useModal ? (
    <Modal
      isOpen={true}
      onClose={() => navigate(-1)}
      title="FitPWA PRO"
      size="lg"
      closeButton
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">O que recebes com o PRO:</h2>
          <ul className="space-y-4">
            {[
              { icon: <Zap />, title: 'Análise de Volume Ilimitada', desc: 'Gráficos detalhados por grupo muscular e tendências de longo prazo.' },
              { icon: <Shield />, title: 'Backup na Nuvem automático', desc: 'Nunca percas o teu histórico de treinos, mesmo que mudes de telemóvel.' },
              { icon: <Check />, title: 'Programas de Treino Exclusivos', desc: 'Acesso a rotinas criadas por especialistas para hipertrofia e força.' },
            ].map((f, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-200 border border-surface-100 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{f.title}</h4>
                  <p className="text-gray-400 text-xs">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-100 p-4 rounded-xl space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">2.99€</span>
            <span className="text-gray-400 text-sm">/mês</span>
          </div>
          <p className="text-gray-400 text-xs">Faturado anualmente (35.88€)</p>
          <ul className="space-y-2 text-xs text-gray-300">
            {['Sem fidelização', '7 dias de teste grátis', 'Acesso em todos os teus dispositivos'].map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={handleSubscribe} 
          className="w-full"
          disabled={isPremium}
        >
          {isPremium ? 'Já és Premium' : 'Começar Agora'}
        </Button>
      </div>
    </Modal>
  ) : content
}
