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
    showToast(t('premium.redirectingMock'), 'info')
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
          <Crown className="w-4 h-4" /> {t('premium.title')}
        </motion.div>
        <h1 className="text-display text-4xl md:text-6xl text-white tracking-crush">
          {t('premium.heroTitle')}
        </h1>
        <p className="text-ink-muted text-lg max-w-2xl mx-auto">
          {t('premium.heroDescPre')}{' '}
          <span className="text-primary font-black">{t('premium.heroDescCount')}</span>{' '}
          {t('premium.heroDescPost')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Features & Comparison */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-display text-3xl text-white">
              {t('premium.whyPro').toUpperCase()}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-100/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-tightest">{t('premium.feature')}</th>
                    <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-tightest text-center">{t('premium.free')}</th>
                    <th className="p-4 text-xs font-bold text-primary uppercase tracking-tightest text-center">PRO</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { name: t('premium.rows.historyName'), free: t('premium.rows.historyFree'), pro: t('premium.rows.historyPro') },
                    { name: t('premium.rows.backupName'), free: <Shield className="w-4 h-4 mx-auto text-ink-faint opacity-40" />, pro: <Check className="w-4 h-4 mx-auto text-primary" /> },
                    { name: t('premium.rows.volumeName'), free: t('premium.rows.volumeFree'), pro: t('premium.rows.volumePro') },
                    { name: t('premium.rows.plansName'), free: t('premium.rows.dash'), pro: t('premium.rows.yes') },
                    { name: t('premium.rows.adsName'), free: t('premium.rows.no'), pro: t('premium.rows.yes') },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-ink font-medium">{row.name}</td>
                      <td className="p-4 text-ink-dim text-center">{row.free}</td>
                      <td className="p-4 text-primary font-black text-center">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-display text-3xl text-white text-right">
              {t('premium.exclusiveAdvantages').toUpperCase()}
            </h2>
            <ul className="space-y-4">
              {[
                { icon: <Zap />, title: t('premium.perks.volumeTitle'), desc: t('premium.perks.volumeDesc') },
                { icon: <Shield />, title: t('premium.perks.privacyTitle'), desc: t('premium.perks.privacyDesc') },
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
                    <p className="text-ink-muted text-sm">{f.desc}</p>
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
          className="card-surface bg-atmos with-grain border-2 border-primary p-8 shadow-glow-primary relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-tightest">
            {t('premium.bestValue')}
          </div>

          {isPremium && (
            <div className="absolute top-8 right-4 bg-primary text-black text-xs font-black px-2 py-1 rounded uppercase tracking-tightest">
              {t('premium.active')}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-display text-3xl text-white mb-2">
              {t('premium.annualPlan').toUpperCase()}
            </h3>
            <div className="flex items-baseline gap-1">
              <span data-numeric className="font-mono font-black text-6xl text-white group-hover:text-primary transition-colors">2.99€</span>
              <span className="text-ink-muted font-bold">{t('premium.perMonth')}</span>
            </div>
            <p className="text-primary text-sm mt-2 font-bold uppercase tracking-tightest">{t('premium.save40')}</p>
          </div>

          <div className="space-y-4 mb-8">
            {[t('premium.noCommitment'), t('premium.freeTrial'), t('premium.allDevices')].map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-ink">
                <Check className="w-5 h-5 text-primary" />
                <span>{line}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubscribe}
            className="w-full"
            size="lg"
            disabled={isPremium}
          >
            {isPremium ? t('premium.alreadyPremium') : t('premium.startNow')}
          </Button>

          <p className="text-center text-xs text-ink-dim mt-6">
            {t('premium.securePayments')}
          </p>
        </motion.div>
      </div>
    </div>
  )

  return useModal ? (
    <Modal
      isOpen={true}
      onClose={() => navigate(-1)}
      title={t('premium.title')}
      size="lg"
      closeButton
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-display text-2xl text-white">{t('premium.whatYouGet')}</h2>
          <ul className="space-y-4">
            {[
              { icon: <Zap />, title: t('premium.perks.volumeTitle'), desc: t('premium.perks.volumeDescLong') },
              { icon: <Shield />, title: t('premium.feature4Title'), desc: t('premium.feature4Desc') },
              { icon: <Check />, title: t('premium.feature5Title'), desc: t('premium.feature5Desc') },
            ].map((f, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-200 border border-surface-100 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{f.title}</h4>
                  <p className="text-ink-muted text-xs">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-100 p-4 rounded-xl space-y-3">
          <div className="flex items-baseline gap-1">
            <span data-numeric className="font-mono font-black text-3xl text-white">2.99€</span>
            <span className="text-ink-muted text-sm">{t('premium.perMonth')}</span>
          </div>
          <p className="text-ink-muted text-xs">{t('premium.billedAnnually', { price: '35.88€' })}</p>
          <ul className="space-y-2 text-xs text-ink">
            {[t('premium.noCommitment'), t('premium.freeTrial'), t('premium.allDevices')].map((line, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleSubscribe}
          className="w-full"
          disabled={isPremium}
        >
          {isPremium ? t('premium.alreadyPremium') : t('premium.startNow')}
        </Button>
      </div>
    </Modal>
  ) : content
}
