import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeButton = true
}: ModalProps) {
  const titleId = React.useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    // Focus close button when modal opens for keyboard users
    setTimeout(() => closeButtonRef.current?.focus(), 0)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 min-h-[100dvh] pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`${sizes[size]} w-full max-h-full flex flex-col pointer-events-auto my-auto`}
            >
              <div className="bg-surface-200 border border-surface-100 rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100dvh-48px)] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-surface-100 shrink-0">
                  <h2 id={titleId} className="text-xl font-bold text-white">{title || 'Dialog'}</h2>
                  {closeButton && (
                    <button
                      ref={closeButtonRef}
                      onClick={onClose}
                      className="p-2 hover:bg-surface-100 rounded-lg transition-colors text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Fechar diálogo"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="p-6 overflow-y-auto">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
