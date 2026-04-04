import { motion } from 'framer-motion'
import { Check, Zap, Shield, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { useAuthStore } from '../auth/authStore'
import { createCheckoutSession } from '@/shared/lib/stripe'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useToast } from '@/shared/contexts/ToastContext'

export function PremiumPage() {
  const { t } = useTranslation()
  const { user, isPremium } = useAuthStore()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [useModal, setUseModal] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ))

  useEffect(() => {
    const handleResize = () => setUseModal(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubscribe = () => {
    if (!user) return
    showToast('A redirecionar para o checkout... (Mock)', 'info')
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
          <Crown className="w-4 h-4" /> RepTrack PRO
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-white">Leva o teu treino para o nível seguinte.</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto italic">
          Junta-te a mais de <span className="text-primary font-black">1.000+</span> atletas que já estão a maximizar os seus resultados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Features & Comparison */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">Porquê ser PRO?</h2>
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-100/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Funcionalidade</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Grátis</th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-widest text-center">PRO</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { name: 'Histórico de Treinos', free: '7 dias', pro: 'Ilimitado' },
                    { name: 'Backup Automático', free: <Shield className="w-4 h-4 mx-auto text-gray-600 opacity-20" />, pro: <Check className="w-4 h-4 mx-auto text-primary" /> },
                    { name: 'Análise de Volume', free: 'Básico', pro: 'Avançado' },
                    { name: 'Planos Exclusivos', free: '-', pro: 'Sim' },
                    { name: 'Sem Publicidade', free: 'Não', pro: 'Sim' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-300 font-medium">{row.name}</td>
                      <td className="p-4 text-gray-500 text-center">{row.free}</td>
                      <td className="p-4 text-primary font-black text-center">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic text-right">Vantagens Exclusivas</h2>
            <ul className="space-y-4">
              {[
                { icon: <Zap />, title: 'Análise de Volume Ilimitada', desc: 'Gráficos detalhados por grupo muscular.' },
                { icon: <Shield />, title: 'Privacidade Total', desc: 'Backup seguro na nuvem.' },
              ].map((f, i) => (
                <motion.li 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl bg-surface-200/50 border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
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
        </div>

        {/* Pricing Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-surface-200 border-2 border-primary rounded-3xl p-8 shadow-2xl shadow-primary/10 relative overflow-hidden group hover:shadow-primary/20 transition-all"
        >
          <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tighter">
            Melhor Valor
          </div>

          {isPremium && (
            <div className="absolute top-8 right-4 bg-primary text-black text-xs font-black px-2 py-1 rounded">
              ATIVO
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">Plano Anual</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-black text-white group-hover:text-primary transition-colors">2.99€</span>
              <span className="text-gray-400 font-bold">/mês</span>
            </div>
            <p className="text-primary text-sm mt-2 font-bold uppercase tracking-widest">Poupas 40% anualmente</p>
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
      title="RepTrack PRO"
      size="lg"
      closeButton
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">O que recebes com o PRO:</h2>
          <ul className="space-y-4">
            {[
              { icon: <Zap />, title: 'Análise de Volume Ilimitada', desc: 'Gráficos detalhados por grupo muscular e tendências de longo prazo.' },
              { icon: <Shield />, title: t('premium.feature4Title'), desc: t('premium.feature4Desc') },
              { icon: <Check />, title: t('premium.feature5Title'), desc: t('premium.feature5Desc') },
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
