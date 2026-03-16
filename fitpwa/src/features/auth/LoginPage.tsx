import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/shared/lib/supabase'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useAuthStore } from './authStore'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres')
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

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
    // AuthProvider will automatically handle the session change and redirect via the useEffect
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-surface-200 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">FitPWA</h1>
          <p className="text-gray-400">Entra na tua conta para continuares o teu progresso.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            label="Email" 
            type="email" 
            placeholder="exemplo@fitpwa.com"
            {...register('email')}
            error={errors.email?.message}
          />
          
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          {error && <div className="text-error text-sm text-center">{error}</div>}

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Entrar
          </Button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-surface-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">ou continua com</span>
          <div className="flex-grow border-t border-surface-100"></div>
        </div>

        <Button variant="secondary" onClick={handleGoogleLogin}>
          Google
        </Button>

        <p className="text-center text-sm text-gray-400">
          Ainda não tens conta? <Link to="/register" className="text-primary hover:underline">Regista-te aqui</Link>
        </p>
      </div>
    </div>
  )
}
