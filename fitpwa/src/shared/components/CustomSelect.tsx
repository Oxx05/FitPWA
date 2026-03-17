import React, { useState, useRef, useEffect } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-4 bg-surface-100 border border-surface-200 rounded-xl flex items-center justify-between text-sm transition-all hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-primary/40",
          isOpen && "border-primary/50 ring-2 ring-primary/20",
          !selectedOption && "text-gray-500"
        )}
      >
        <div className="flex items-center gap-3 truncate">
          {icon && <div className="text-gray-400 shrink-0">{icon}</div>}
          <span className="truncate text-white font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[60] left-0 right-0 mt-2 p-1.5 bg-surface-200 border border-surface-100 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors",
                  value === option.value 
                    ? "bg-primary text-black font-bold" 
                    : "text-gray-300 hover:bg-surface-100 hover:text-white"
                )}
              >
                <span className="capitalize">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
