import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
  onClick?: () => void
}

const actionClass =
  'inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background bg-primary text-black hover:bg-primary-hover font-bold h-11 px-4 text-sm'

export function EmptyState({ icon, title, description, actionLabel, actionTo, onClick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 bg-surface-200/50 rounded-3xl border border-dashed border-surface-100 text-center"
    >
      <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center text-gray-500 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs mb-8">{description}</p>

      {actionLabel && (
        actionTo ? (
          <Link to={actionTo} className={actionClass}>
            <Plus className="w-4 h-4" aria-hidden="true" /> {actionLabel}
          </Link>
        ) : (
          <button onClick={onClick} className={cn(actionClass, 'cursor-pointer')}>
            <Plus className="w-4 h-4" aria-hidden="true" /> {actionLabel}
          </button>
        )
      )}
    </motion.div>
  )
}
