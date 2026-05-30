import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { sendInvitation } from '@/api/users'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
})

type FormValues = z.infer<typeof schema>

export default function AdminInstructorInvite() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await sendInvitation({ ...values, role: 'instructor' })
      toast.success(`Convite enviado para ${values.email}`)
      navigate('/admin/instructors')
    } catch {
      toast.error('Erro ao enviar convite. Tente novamente.')
    }
  }

  return (
    <div className="max-w-md space-y-5">
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/admin/instructors')}
      >
        <ArrowLeft size={16} />
        Voltar para Instrutores
      </button>

      <div>
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Convidar Instrutor
        </h1>
        <p className="text-txt-dim text-sm mt-1">
          O instrutor receberá um link por email para criar sua conta.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Nome do instrutor"
            placeholder="Rafael Cardoso"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="rafael@academia.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="flex items-center gap-3 p-3 bg-bg-700 rounded-lg">
            <span className="text-xs text-txt-faint">Perfil</span>
            <span className="text-xs font-medium text-info bg-info/10 border border-info/30 rounded-full px-2 py-0.5">
              Instrutor
            </span>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/admin/instructors')}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Enviar Convite
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
