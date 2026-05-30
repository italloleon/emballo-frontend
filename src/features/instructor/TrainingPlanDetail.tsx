import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { MachineTag } from '@/components/ui/MachineTag'
import { getTrainingPlan, updateTrainingPlan, type TrainingExercise } from '@/api/exercises'

const exerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do exercício obrigatório'),
  machineName: z.string().optional(),
  sets: z.number().min(1).max(20),
  reps: z.string().min(1, 'Reps obrigatório'),
  rest_seconds: z.number().min(0).optional(),
})

function mapExercise(ex: TrainingExercise) {
  return {
    id: ex.id,
    name: ex.exercise?.name ?? '',
    machineName: ex.exercise?.machine?.name ?? '',
    sets: ex.sets,
    reps: ex.reps,
    rest_seconds: ex.rest_seconds,
  }
}

const schema = z.object({
  name: z.string().min(2, 'Nome do plano obrigatório'),
  description: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, 'Adicione ao menos um exercício'),
})

type FormValues = z.infer<typeof schema>

export default function InstructorTrainingPlanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { exercises: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })
  const watchedExercises = useWatch({ control, name: 'exercises' })

  useEffect(() => {
    async function fetchPlan() {
      try {
        const { data } = await getTrainingPlan(id!)
        reset({
          name: data.name,
          description: data.description,
          exercises: (data.exercises ?? []).map(mapExercise),
        })
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchPlan()
  }, [id, reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateTrainingPlan(id!, values as Parameters<typeof updateTrainingPlan>[1])
      toast.success('Plano atualizado!')
      reset(values)
    } catch {
      toast.error('Erro ao atualizar plano.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-32" />
        <div className="h-48 bg-bg-800 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl">
        <button
          className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
          onClick={() => navigate('/instructor/training-plans')}
        >
          <ArrowLeft size={16} />
          Voltar para Planos
        </button>
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      </div>
    )
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
        Editar Plano
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
            Informações do Plano
          </h2>
          <div className="space-y-4">
            <Input
              label="Nome do plano"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-txt-dim">Descrição (opcional)</label>
              <textarea
                className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
                rows={2}
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
              onClick={() => append({ name: '', machineName: '', sets: 3, reps: '12', rest_seconds: 60 })}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="bg-bg-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-medium text-txt-faint">Exercício {idx + 1}</span>
                    {watchedExercises?.[idx]?.machineName && (
                      <MachineTag name={watchedExercises[idx].machineName!} />
                    )}
                  </div>
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
                    error={errors.exercises?.[idx]?.name?.message}
                    {...register(`exercises.${idx}.name`)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Séries"
                      type="number"
                      {...register(`exercises.${idx}.sets`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Reps"
                      {...register(`exercises.${idx}.reps`)}
                    />
                    <Input
                      label="Descanso (s)"
                      type="number"
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
          <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!isDirty}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
