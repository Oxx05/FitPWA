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

export function RegisterPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const registerSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMinLength')),
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: t('auth.passwordsDontMatch'),
    path: ["confirmPassword"]
  })

  type RegisterForm = z.infer<typeof registerSchema>

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  React.useEffect(() => {
    if (session) {
      navigate('/onboarding', { replace: true })
    }
  }, [session, navigate])

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password
    })

    if (error) {
      setError(error.message)
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-surface-200 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-gray-400">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            label={t('auth.email')}
            type="email" 
            placeholder="exemplo@fitpwa.com"
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

          <Input 
            label={t('auth.confirmPassword')}
            type="password" 
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          {error && <div className="text-error text-sm text-center">{error}</div>}

          <Button type="submit" isLoading={isLoading} className="mt-2">
            {t('auth.register')}
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
          {t('auth.hasAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.loginHere')}</Link>
        </p>
      </div>
    </div>
  )
}
