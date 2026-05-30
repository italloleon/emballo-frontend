import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore(s => s.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await login(values)
      authLogin(data.token, data.user)
      if (data.user.role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (data.user.role === 'instructor') navigate('/instructor/dashboard', { replace: true })
      else navigate('/student/home', { replace: true })
    } catch {
      toast.error('Credenciais inválidas. Verifique seu email e senha.')
    }
  }

  return (
    <div className="min-h-screen bg-bg-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <span
            className="text-3xl font-black uppercase tracking-tight text-ember"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            GymLeague
          </span>
          <h1
            className="text-2xl font-black uppercase text-txt mt-1"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            ENTRAR
          </h1>
        </div>

        <div className="bg-bg-800 border border-bg-600 rounded-xl p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-txt-dim text-sm mt-6">
          Quer cadastrar sua academia?{' '}
          <Link to="/register" className="text-ember hover:text-ember-hover transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
