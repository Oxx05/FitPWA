import { useRef } from 'react'
import { Download, Trophy, Crown } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { toPng } from 'html-to-image'
import { useTranslation } from 'react-i18next'

interface ConquestCardProps {
  title: string
  subtitle: string
  value: string
  label: string
  achievementIcon?: React.ReactNode
  showShare?: boolean
}

export function ConquestCard({ title, subtitle, value, label, achievementIcon, showShare = true }: ConquestCardProps) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true })
      const link = document.createElement('a')
      link.download = `TitanPulse-Conquest-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating image:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6 items-center p-2">
      <div 
        ref={cardRef}
        className="w-full max-w-[320px] aspect-[4/5] bg-[#0A0A0B] border-[12px] border-primary rounded-[40px] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl"
      >
        {/* Design Elements */}
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-3xl bg-surface-100 flex items-center justify-center text-primary mb-4 border border-white/10 rotate-3">
             {achievementIcon || <Trophy className="w-10 h-10" />}
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
            {title}
          </h2>
          <p className="text-primary font-bold text-xs uppercase tracking-[0.2em]">{subtitle}</p>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1">
          <span className="text-6xl font-black text-white italic tracking-tighter">{value}</span>
          <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{label}</span>
        </div>

        <div className="relative z-10 flex justify-between items-center w-full pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-black font-black text-[10px]">FP</div>
            <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">TitanPulse</span>
          </div>
          <Crown className="w-4 h-4 text-primary opacity-50" />
        </div>
      </div>

      {showShare && (
        <div className="flex w-full gap-3 mt-4">
          <Button onClick={handleShare} className="flex-1 font-black uppercase tracking-tighter flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> {t('social.feed.saveImage')}
          </Button>
        </div>
      )}
    </div>
  )
}
