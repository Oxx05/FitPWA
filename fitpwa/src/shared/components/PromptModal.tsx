import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'

import { useTranslation } from 'react-i18next'

interface PromptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  label: string
  defaultValue?: string
  placeholder?: string
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  defaultValue = '',
  placeholder
}: PromptModalProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (isOpen) setValue(defaultValue)
  }, [isOpen, defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(value)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-400 mb-1.5 block">
            {label}
          </span>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface-100 border border-surface-100 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </label>
        
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            {t('common.confirm')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
