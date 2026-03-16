import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/shared/lib/supabase'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useAuthStore } from './authStore'

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As passwords não coincidem",
  path: ["confirmPassword"]
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

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
    } else {
      // Typically signUp with autoConfirm=true will immediately sign in
      // If email confirmation is required, you might need a different flow.
      // Assuming auto login for now, which triggers useEffect above.
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
          <h1 className="text-3xl font-bold text-primary mb-2">Criar Conta</h1>
          <p className="text-gray-400">Junta-te ao FitPWA e transforma o teu treino.</p>
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

          <Input 
            label="Confirmar Password" 
            type="password" 
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          {error && <div className="text-error text-sm text-center">{error}</div>}

          <Button type="submit" isLoading={isLoading} className="mt-2">
            Registar
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
          Já tens conta? <Link to="/login" className="text-primary hover:underline">Entra aqui</Link>
        </p>
      </div>
    </div>
  )
}
