import { motion } from 'framer-motion'
import { Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/components/Button'

interface ShareProps {
  title: string
  text: string
  url?: string
  exerciseName?: string
  weight?: number
  reps?: number
}

export function SocialShare({
  title,
  text,
  url = window.location.href,
  exerciseName,
  weight,
  reps,
}: ShareProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Construir mensagem de compartilhamento
  const buildShareMessage = (): string => {
    if (exerciseName && weight && reps) {
      return `🏆 Novo PR! ${exerciseName}: ${weight}kg x ${reps} reps\n\n${text}`
    }
    return text
  }

  const shareMessage = buildShareMessage()

  // Web Share API
  const handleWebShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: shareMessage,
          url,
        })
        setShowMenu(false)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err)
      }
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    const textToCopy = `${shareMessage}\n\n${url}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  // Share on X (formerly Twitter)
  const handleShareX = () => {
    const xUrl = new URL('https://x.com/intent/tweet')
    xUrl.searchParams.set('text', shareMessage)
    xUrl.searchParams.set('url', url)
    window.open(xUrl.toString(), '_blank', 'width=550,height=420')
    setShowMenu(false)
  }

  // Share on Facebook
  const handleShareFacebook = () => {
    const fbUrl = new URL('https://www.facebook.com/sharer/sharer.php')
    fbUrl.searchParams.set('u', url)
    fbUrl.searchParams.set('quote', shareMessage)
    window.open(fbUrl.toString(), '_blank', 'width=550,height=420')
    setShowMenu(false)
  }

  // Share on WhatsApp
  const handleShareWhatsApp = () => {
    const waUrl = new URL('https://wa.me/')
    waUrl.searchParams.set('text', `${shareMessage}\n\n${url}`)
    window.open(waUrl.toString(), '_blank')
    setShowMenu(false)
  }

  // Share on LinkedIn
  const handleShareLinkedIn = () => {
    const liUrl = new URL('https://www.linkedin.com/sharing/share-offsite/')
    liUrl.searchParams.set('url', url)
    window.open(liUrl.toString(), '_blank', 'width=550,height=420')
    setShowMenu(false)
  }

  const supportsWebShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (supportsWebShare ? handleWebShare() : setShowMenu(!showMenu))}
        className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
        title="Compartilhar"
      >
        <Share2 size={20} />
      </motion.button>

      {/* Menu de compartilhamento (se Web Share não suportado) */}
      {!supportsWebShare && showMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 min-w-max"
        >
          <div className="flex flex-col">
            {/* Copy Link */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="justify-start px-4 py-2 rounded-none text-sm"
            >
              {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>

            {/* X (Twitter) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareX}
              className="justify-start px-4 py-2 rounded-none text-sm"
            >
              𝕏 X
            </Button>

            {/* Facebook */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareFacebook}
              className="justify-start px-4 py-2 rounded-none text-sm"
            >
              f Facebook
            </Button>

            {/* WhatsApp */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareWhatsApp}
              className="justify-start px-4 py-2 rounded-none text-sm"
            >
              💬 WhatsApp
            </Button>

            {/* LinkedIn */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareLinkedIn}
              className="justify-start px-4 py-2 rounded-none text-sm"
            >
              in LinkedIn
            </Button>
          </div>
        </motion.div>
      )}

      {/* Fechar menu ao clicar fora */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
