import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-blue-400" aria-hidden="true" />
  }

  const backgrounds = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  }

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[100] p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 ${backgrounds[type]}`}
    >
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 -mr-1 -mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
