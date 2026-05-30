import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MachineTag } from '@/components/ui/MachineTag'
import type { TrainingExercise } from '@/api/exercises'
import { getExerciseMachineName } from '@/lib/exercisesDisplay'
import { goalLabel } from '@/lib/calendar'

interface ExerciseListProps {
  exercises: TrainingExercise[]
  compact?: boolean
}

export function ExerciseList({ exercises, compact = false }: ExerciseListProps) {
  const sorted = [...exercises].sort((a, b) => a.order - b.order)

  if (sorted.length === 0) {
    return <p className="text-sm text-txt-dim">Nenhum exercício neste plano.</p>
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {sorted.map((ex, idx) => {
        const machineName = getExerciseMachineName(ex)
        return (
        <Card key={ex.id} className={compact ? '!p-3' : undefined}>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-ember/10 border border-ember/20 flex items-center justify-center text-xs font-bold text-ember shrink-0">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-txt">
                  {ex.exercise?.name ?? 'Exercício'}
                </p>
                {ex.properties?.ai_generated && (
                  <Badge variant="gold">
                    <Sparkles size={10} className="mr-0.5" />
                    IA
                  </Badge>
                )}
                {machineName && <MachineTag name={machineName} />}
              </div>
              {ex.exercise?.muscle_groups && ex.exercise.muscle_groups.length > 0 && (
                <p className="text-[11px] text-txt-faint mt-0.5 capitalize">
                  {ex.exercise.muscle_groups.join(' · ')}
                </p>
              )}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
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
                {ex.rest_seconds != null && (
                  <>
                    <span className="text-txt-faint text-xs">·</span>
                    <span className="text-xs text-txt-faint">{ex.rest_seconds}s descanso</span>
                  </>
                )}
              </div>
              {ex.notes && !compact && (
                <p className="text-xs text-txt-dim mt-1.5 italic">{ex.notes}</p>
              )}
            </div>
          </div>
        </Card>
        )
      })}
    </div>
  )
}

interface GoalBadgeProps {
  goal: string | null | undefined
}

export function GoalBadge({ goal }: GoalBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-bg-700 text-txt-dim border-bg-600"
    >
      {goalLabel(goal)}
    </span>
  )
}
