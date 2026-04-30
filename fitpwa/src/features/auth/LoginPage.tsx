import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/shared/lib/supabase'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useAuthStore } from './authStore'
import { useTranslation } from 'react-i18next'

export function LoginPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMinLength'))
  })

  type LoginForm = z.infer<typeof loginSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  React.useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true })
    }
  }, [session, navigate])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (error) {
      setError(error.message)
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-surface-200 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">RepTrack</h1>
          <p className="text-gray-400">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            label={t('auth.email')}
            type="email" 
            placeholder="exemplo@email.com"
            {...register('email')}
            error={errors.email?.message}
          />
          
          <Input 
            label={t('auth.password')}
            type="password" 
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="mt-2">
            {t('auth.login')}
          </Button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-surface-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">{t('auth.orContinueWith')}</span>
          <div className="flex-grow border-t border-surface-100"></div>
        </div>

        <Button variant="secondary" onClick={handleGoogleLogin}>
          Google
        </Button>

        <p className="text-center text-sm text-gray-400">
          {t('auth.noAccount')} <Link to="/register" className="text-primary hover:underline">{t('auth.registerHere')}</Link>
        </p>
      </div>
    </div>
  )
}
