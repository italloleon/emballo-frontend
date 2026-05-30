import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    password_confirmation: z.string(),
  })
  .refine(v => v.password === v.password_confirmation, {
    message: 'Senhas não conferem',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof schema>

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(_values: FormValues) {
    // Endpoint not yet built — show coming soon
    await new Promise(r => setTimeout(r, 600))
    toast.info('Funcionalidade em breve! O convite ainda não está ativo.')
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
        </div>

        <div className="bg-bg-800 border border-bg-600 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 p-3 bg-info/10 border border-info/30 rounded-lg mb-6">
            <Users size={18} className="text-info shrink-0" />
            <p className="text-sm text-txt-dim">
              Você foi convidado para uma{' '}
              <span className="text-txt font-medium">Academia GymLeague</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <h2
              className="text-xl font-black uppercase text-txt mb-4"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Complete seu Cadastro
            </h2>

            <Input
              label="Seu nome"
              placeholder="Maria Santos"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Crie uma senha"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Entrar na Academia
            </Button>
          </form>
        </div>

        <p className="text-center text-txt-faint text-xs">
          Token do convite:{' '}
          <span className="font-mono text-txt-dim">{token ?? '—'}</span>
        </p>
      </div>
    </div>
  )
}
