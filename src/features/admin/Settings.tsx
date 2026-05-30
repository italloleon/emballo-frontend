import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getAcademyProfile, updateAcademyProfile } from '@/api/academy'
import { LlmProvidersSection } from '@/features/admin/LlmProvidersSection'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  city: z.string().min(2, 'Cidade obrigatória'),
  phone: z.string().min(8, 'Telefone inválido'),
})

type FormValues = z.infer<typeof schema>

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    async function fetchAcademy() {
      try {
        const { data } = await getAcademyProfile()
        reset({ name: data.name, city: data.city, phone: data.phone })
      } catch {
        reset({ name: 'Academia Força Total', city: 'São Paulo', phone: '(11) 99999-0000' })
      } finally {
        setLoading(false)
      }
    }
    fetchAcademy()
  }, [reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateAcademyProfile({ name: values.name })
      toast.success('Configurações salvas com sucesso!')
      reset(values)
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-md space-y-4 animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-40" />
        <div className="h-48 bg-bg-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1
        className="text-3xl font-black uppercase text-txt"
        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        Configurações
      </h1>

      <Card>
        <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
          Dados da Academia
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Nome da academia"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Cidade"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="Telefone"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={!isDirty}
          >
            <Save size={16} />
            Salvar Alterações
          </Button>
        </form>
      </Card>

      <LlmProvidersSection />
    </div>
  )
}
