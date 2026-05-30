import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createTrainingPlan } from '@/api/exercises'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome do exercício obrigatório'),
  sets: z.number().min(1).max(20),
  reps: z.string().min(1, 'Reps obrigatório'),
  rest_seconds: z.number().min(0).optional(),
})

const schema = z.object({
  name: z.string().min(2, 'Nome do plano obrigatório'),
  description: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, 'Adicione ao menos um exercício'),
})

type FormValues = z.infer<typeof schema>

export default function InstructorTrainingPlanNew() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      exercises: [{ name: '', sets: 3, reps: '12', rest_seconds: 60 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })

  async function onSubmit(values: FormValues) {
    try {
      await createTrainingPlan(values)
      toast.success('Plano de treino criado!')
      navigate('/instructor/training-plans')
    } catch {
      toast.error('Erro ao criar plano. Tente novamente.')
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/instructor/training-plans')}
      >
        <ArrowLeft size={16} />
        Voltar para Planos
      </button>

      <h1
        className="text-3xl font-black uppercase text-txt"
        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        Novo Plano de Treino
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
            Informações do Plano
          </h2>
          <div className="space-y-4">
            <Input
              label="Nome do plano"
              placeholder="Plano A — Peito + Tríceps"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-txt-dim">Descrição (opcional)</label>
              <textarea
                className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
                rows={2}
                placeholder="Descreva o objetivo do plano..."
                {...register('description')}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider">
              Exercícios
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ name: '', sets: 3, reps: '12', rest_seconds: 60 })}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>

          {errors.exercises?.root && (
            <p className="text-xs text-danger mb-3">{errors.exercises.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="bg-bg-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-txt-faint">Exercício {idx + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-txt-faint hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <Input
                    label="Nome"
                    placeholder="Supino Reto com Barra"
                    error={errors.exercises?.[idx]?.name?.message}
                    {...register(`exercises.${idx}.name`)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Séries"
                      type="number"
                      min={1}
                      max={20}
                      error={errors.exercises?.[idx]?.sets?.message}
                      {...register(`exercises.${idx}.sets`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Reps"
                      placeholder="12 ou 8-12"
                      error={errors.exercises?.[idx]?.reps?.message}
                      {...register(`exercises.${idx}.reps`)}
                    />
                    <Input
                      label="Descanso (s)"
                      type="number"
                      min={0}
                      error={errors.exercises?.[idx]?.rest_seconds?.message}
                      {...register(`exercises.${idx}.rest_seconds`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/instructor/training-plans')}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            Criar Plano
          </Button>
        </div>
      </form>
    </div>
  )
}
