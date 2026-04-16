import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  icon?: React.ReactNode
  placeholder?: string
  className?: string
}

export function CustomSelect({
  value,
  onChange,
  options,
  icon,
  placeholder = 'Selecionar...',
  className
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = React.useId()

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [])

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex, isOpen])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setFocusedIndex(Math.max(0, options.findIndex(opt => opt.value === value)))
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value)
          setIsOpen(false)
          buttonRef.current?.focus()
        }
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }, [isOpen, focusedIndex, options, value, onChange])

  const select = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => {
          setIsOpen(prev => {
            if (!prev) setFocusedIndex(Math.max(0, options.findIndex(opt => opt.value === value)))
            return !prev
          })
        }}
        className={cn(
          'w-full h-11 px-4 bg-surface-100 border border-surface-200 rounded-xl flex items-center justify-between text-sm transition-all hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-primary/40',
          isOpen && 'border-primary/50 ring-2 ring-primary/20',
          !selectedOption && 'text-gray-500'
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {icon && <div className="text-gray-400 shrink-0" aria-hidden="true">{icon}</div>}
          <span className="truncate text-white font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-primary'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            ref={listRef}
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[60] left-0 right-0 mt-2 p-1.5 bg-surface-200 border border-surface-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => select(option.value)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors',
                  value === option.value
                    ? 'bg-primary text-black font-bold'
                    : index === focusedIndex
                    ? 'bg-surface-100 text-white'
                    : 'text-gray-300 hover:bg-surface-100 hover:text-white'
                )}
              >
                <span className="capitalize">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
