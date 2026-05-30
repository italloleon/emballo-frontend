import { useEffect, useState } from 'react'
import { ClipboardList, Dumbbell, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getMyTrainingPlans } from '@/api/exercises'
import type { TrainingExercise } from '@/api/exercises'

interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  ai_generated?: boolean
}

interface TrainingPlan {
  id: string
  name: string
  description?: string
  exercises: Exercise[]
}

function normalizeExercise(ex: TrainingExercise): Exercise {
  return {
    name: ex.exercise?.name ?? 'Exercício',
    sets: ex.sets,
    reps: ex.reps,
    rest_seconds: ex.rest_seconds,
    ai_generated: ex.properties?.ai_generated,
  }
}

export default function StudentTraining() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlan() {
      try {
        const { data } = await getMyTrainingPlans()
        const plans = Array.isArray(data) ? data : (data?.data ?? [])
        const first = plans[0] ?? null
        if (first) {
          setPlan({
            ...first,
            exercises: (first.exercises ?? []).map(normalizeExercise),
          })
        } else {
          setPlan(null)
        }
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [])

  if (loading) {
    return (
      <div className="max-w-sm mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-48" />
        <div className="h-6 bg-bg-700 rounded w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-bg-800 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <ClipboardList size={40} className="text-txt-faint" />
        <h2
          className="text-xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Sem Plano de Treino
        </h2>
        <p className="text-txt-dim text-sm">
          Nenhum plano atribuído ainda. Fale com seu instrutor.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Meu Treino
        </h1>
        <h2
          className="text-lg font-semibold text-ember mt-0.5"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {plan.name}
        </h2>
        {plan.description && (
          <p className="text-txt-faint text-xs mt-1">{plan.description}</p>
        )}
      </div>

      {/* Exercise count */}
      <div className="flex items-center gap-2 text-xs text-txt-dim">
        <Dumbbell size={13} />
        <span>{plan.exercises.length} exercícios</span>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {plan.exercises.map((ex, idx) => (
          <Card key={idx}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-ember/10 border border-ember/20 flex items-center justify-center text-xs font-bold text-ember shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-txt">{ex.name}</p>
                  {ex.ai_generated && (
                    <Badge variant="gold">
                      <Sparkles size={10} className="mr-0.5" />
                      IA
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-txt-dim">
                    <span
                      className="font-bold text-txt"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {ex.sets}
                    </span>{' '}
                    séries
                  </span>
                  <span className="text-txt-faint text-xs">×</span>
                  <span className="text-xs text-txt-dim">
                    <span
                      className="font-bold text-txt"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {ex.reps}
                    </span>{' '}
                    reps
                  </span>
                  {ex.rest_seconds && (
                    <>
                      <span className="text-txt-faint text-xs">·</span>
                      <span className="text-xs text-txt-faint">
                        {ex.rest_seconds}s descanso
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
