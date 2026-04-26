import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Share2, TrendingUp, Trophy } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { ConquestCard } from '@/shared/components/ConquestCard'
import { useTranslation } from 'react-i18next'

export function SessionSummary() {
  const { t } = useTranslation()
  const location = useLocation()
  const stats = location.state?.stats || { volume: 0, exercisesCount: 0, setsCount: 0 }
  const duration = location.state?.duration || 0
  const xpGained = location.state?.xpGained || 0
  const newPrs = (location.state?.newPrs || []) as Array<{ exerciseName: string; weight: number; reps: number; oneRepMax?: number; exerciseId?: string }>

  // Defensive cleanup — once we reach the summary screen, the workout is
  // definitively over. Nuke any stale `titanpulse_active_session` breadcrumb
  // that earlier code paths might have left behind, so the dashboard banner
  // and resume guards stay accurate.
  useEffect(() => {
    try { localStorage.removeItem('titanpulse_active_session') } catch { /* noop */ }
  }, [])

  const [mood, setMood] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}min`
    return `${m} min`
  }

  const bestPr = newPrs.length > 0 ? newPrs.sort((a, b) => (b.oneRepMax || 0) - (a.oneRepMax || 0))[0] : null
  
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8 pb-24 text-center mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
          {t('session.workoutCompleted')}
        </h1>
        <p className="text-primary font-bold mt-2 text-xl tracking-tighter italic">+ {xpGained} XP</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="bg-surface-200 p-4 rounded-xl border border-white/5 shadow-lg">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{t('session.duration')}</p>
          <p className="text-2xl font-black text-white italic">{formatTime(duration)}</p>
        </div>
        <div className="bg-surface-200 p-4 rounded-xl border border-white/5 shadow-lg">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{t('session.volume')}</p>
          <p className="text-2xl font-black text-white italic">{stats.volume.toLocaleString()} kg</p>
        </div>
      </div>

      <div className="bg-surface-200 p-6 rounded-3xl border border-primary/20 text-left relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <TrendingUp className="text-primary w-6 h-6" />
          <h3 className="font-black text-lg text-white italic uppercase tracking-tighter">{t('session.newPrs')}</h3>
        </div>
        {newPrs.length > 0 ? (
          <ul className="space-y-3 relative z-10">
            {newPrs.map((pr, idx) => (
              <li
                key={`${pr.exerciseName}-${idx}`}
                className={`flex justify-between items-center text-sm ${idx < newPrs.length - 1 ? 'border-b border-white/5 pb-2' : ''}`}
              >
                <span className="text-gray-300 font-bold">{pr.exerciseName}</span>
                <span className="font-black text-primary italic">
                  {pr.weight}kg x {pr.reps}
                  {pr.oneRepMax ? ` · 1RM ${Math.round(pr.oneRepMax)}kg` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 font-medium italic">{t('session.noNewPrs')}</p>
        )}
      </div>

      <div className="bg-surface-200 p-6 rounded-3xl border border-white/5 shadow-md">
        <h3 className="text-white font-black italic uppercase tracking-tighter mb-4">{t('session.howDidYouFeel')}</h3>
        <div className="flex justify-around text-4xl">
          {['😫', '😕', '😐', '🙂', '🤩'].map(emoji => (
            <button
              key={emoji}
              onClick={() => setMood(emoji)}
              className={`hover:scale-125 transition-transform ${mood === emoji ? 'scale-125 drop-shadow-md drop-shadow-primary/50' : 'opacity-30 grayscale'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => setShowShareModal(true)}
          className="w-full text-black font-black h-14 uppercase tracking-tighter italic text-lg"
        >
          <Share2 className="w-5 h-5 mr-2" />
          {t('session.shareResult')}
        </Button>

        {stats.exercisesCount > 0 && (
          <Link
            to="/workouts/new"
            state={{
              initialData: {
                name: t('session.convertToPlanName', { date: new Date().toLocaleDateString() }),
                description: t('session.convertToPlanDesc'),
                exercises: location.state?.exercises || []
              }
            }}
          >
            <Button variant="ghost" className="w-full text-white border border-white/10 font-black h-14 uppercase tracking-tighter italic">
              {t('session.convertToPlan')}
            </Button>
          </Link>
        )}

        <Link to="/dashboard">
          <Button variant="ghost" className="w-full text-gray-500 hover:text-white font-black uppercase tracking-tight">
            {t('session.finish')}
          </Button>
        </Link>
      </div>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={t('session.shareAchievement')}
        size="md"
        closeButton
      >
        <div className="flex flex-col items-center">
          <ConquestCard 
            title={bestPr ? t('progress.newRecord') : t('session.workoutCompleted')}
            subtitle={bestPr ? bestPr.exerciseName : "RepTrack Session"}
            value={bestPr ? `${Math.round(bestPr.oneRepMax || 0)}` : `${stats.volume}`}
            label={bestPr ? t('progress.estimated1rm') : t('social.feed.valueVolume')}
            achievementIcon={bestPr ? <Trophy className="w-10 h-10" /> : <TrendingUp className="w-10 h-10" />}
          />
          <p className="text-[10px] text-gray-500 mt-4 uppercase font-black tracking-widest text-center">
            {t('session.shareTip')}
          </p>
        </div>
      </Modal>
    </div>
  )
}
