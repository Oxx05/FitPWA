import React from 'react'
import { useAuthStore } from '../auth/authStore'
import { Link } from 'react-router-dom'
import { Lock, Crown } from 'lucide-react'
import { Button } from '@/shared/components/Button'

interface FeatureGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  featureName?: string
}

export function FeatureGate({ children, fallback, featureName }: FeatureGateProps) {
  const { isPremium } = useAuthStore()

  if (isPremium) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="bg-surface-200/50 backdrop-blur border border-surface-100 rounded-2xl p-8 text-center space-y-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Crown className="w-24 h-24" />
      </div>
      
      <div className="w-16 h-16 bg-surface-100 rounded-2xl mx-auto flex items-center justify-center text-primary">
        <Lock className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">Esta funcionalidade é PRO</h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Desbloqueia {featureName || 'esta funcionalidade'} e muito mais com o RepTrack Premium.
        </p>
      </div>

      <Link to="/premium" className="block">
        <Button size="sm" className="w-full font-bold">
          Ver Planos Premium
        </Button>
      </Link>
    </div>
  )
}
