import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { register as registerApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { env } from '@/lib/env'

const step1Schema = z.object({
  academy_name: z.string().min(2, 'Nome muito curto'),
  academy_city: z.string().min(2, 'Cidade obrigatória'),
  academy_phone: z.string().min(8, 'Telefone inválido'),
})

const step2Schema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    password_confirmation: z.string(),
  })
  .refine(v => v.password === v.password_confirmation, {
    message: 'Senhas não conferem',
    path: ['password_confirmation'],
  })

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map(n => (
        <div key={n} className="flex items-center gap-2 flex-1 last:flex-none">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              n < step
                ? 'bg-ember text-white'
                : n === step
                ? 'bg-ember text-white ring-2 ring-ember/30'
                : 'bg-bg-700 text-txt-faint'
            }`}
          >
            {n < step ? <CheckCircle2 size={14} /> : n}
          </div>
          {n < 3 && (
            <div
              className={`h-0.5 flex-1 transition-colors ${n < step ? 'bg-ember' : 'bg-bg-700'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore(s => s.login)
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)

  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) })

  if (!env.allowRegistration) {
    return <Navigate to="/login" replace />
  }

  function onStep1(values: Step1Values) {
    setStep1Data(values)
    setStep(2)
  }

  async function onStep2(values: Step2Values) {
    if (!step1Data) return
    setStep(3)
    try {
      const { data } = await registerApi({ ...step1Data, ...values })
      authLogin(data.token, data.user)
      setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1500)
    } catch {
      toast.error('Erro ao criar academia. Tente novamente.')
      setStep(2)
    }
  }

  return (
    <div className="min-h-screen bg-bg-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="text-3xl font-black uppercase tracking-tight text-ember"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            GymLeague
          </span>
          <p className="text-txt-dim text-sm mt-1">Cadastre sua academia</p>
        </div>

        <ProgressBar step={step} />

        <div className="bg-bg-800 border border-bg-600 rounded-xl p-6">
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4" noValidate>
              <h2
                className="text-xl font-black uppercase text-txt mb-4"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Sua Academia
              </h2>
              <Input
                label="Nome da academia"
                placeholder="Academia Força Total"
                error={form1.formState.errors.academy_name?.message}
                {...form1.register('academy_name')}
              />
              <Input
                label="Cidade"
                placeholder="São Paulo"
                error={form1.formState.errors.academy_city?.message}
                {...form1.register('academy_city')}
              />
              <Input
                label="Telefone"
                placeholder="(11) 99999-0000"
                error={form1.formState.errors.academy_phone?.message}
                {...form1.register('academy_phone')}
              />
              <Button type="submit" className="w-full" size="lg">
                Próximo
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4" noValidate>
              <h2
                className="text-xl font-black uppercase text-txt mb-4"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Sua Conta
              </h2>
              <Input
                label="Seu nome"
                placeholder="Carlos Oliveira"
                error={form2.formState.errors.name?.message}
                {...form2.register('name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="carlos@academia.com"
                error={form2.formState.errors.email?.message}
                {...form2.register('email')}
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                error={form2.formState.errors.password?.message}
                {...form2.register('password')}
              />
              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Repita a senha"
                error={form2.formState.errors.password_confirmation?.message}
                {...form2.register('password_confirmation')}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={form2.formState.isSubmitting}
                >
                  Criar Academia
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2
                className="text-2xl font-black uppercase text-txt mb-2"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Academia Criada!
              </h2>
              <p className="text-txt-dim text-sm">Redirecionando para o painel...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-ember border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>

        {step < 3 && (
          <p className="text-center text-txt-dim text-sm mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-ember hover:text-ember-hover transition-colors">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
