import { Check, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ScheduleEntry } from '@/api/schedule'
import { isCompleted } from '@/api/schedule'
import { formatDate } from '@/lib/utils'
import { ExerciseList, GoalBadge } from './ExerciseList'

interface DayDetailModalProps {
  entry: ScheduleEntry | null
  open: boolean
  loading?: boolean
  onClose: () => void
  onDelete: (id: string) => Promise<void>
  onComplete?: (id: string) => Promise<void>
  deleting?: boolean
  completing?: boolean
}

export function DayDetailModal({
  entry,
  open,
  loading = false,
  onClose,
  onDelete,
  onComplete,
  deleting = false,
  completing = false,
}: DayDetailModalProps) {
  if (!entry) return null

  const plan = entry.training_plan
  const isRest = !entry.training_plan_id
  const completed = isCompleted(entry)
  const dateLabel = formatDate(entry.scheduled_date)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={dateLabel}
      className="max-w-lg max-h-[85vh] flex flex-col"
    >
      <div className="space-y-4 -mt-1 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-bg-700 rounded w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-bg-700 rounded-xl" />
            ))}
          </div>
        ) : isRest ? (
          <div className="text-center py-6">
            <p className="text-sm text-txt-dim">Dia de descanso agendado</p>
            {entry.notes && (
              <p className="text-xs text-txt-faint mt-2 italic">{entry.notes}</p>
            )}
          </div>
        ) : plan ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  className="text-lg font-black uppercase text-txt"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {plan.name}
                </h3>
                <GoalBadge goal={plan.goal} />
              </div>
              {completed && (
                <Badge variant="success">
                  <Check size={10} className="mr-0.5" />
                  Concluído
                </Badge>
              )}
            </div>

            {plan.description && (
              <p className="text-xs text-txt-dim">{plan.description}</p>
            )}

            {entry.notes && (
              <div className="bg-bg-700/50 border border-bg-600 rounded-xl px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-txt-faint mb-0.5">
                  Observação do instrutor
                </p>
                <p className="text-sm text-txt-dim">{entry.notes}</p>
              </div>
            )}

            {plan.exercises && plan.exercises.length > 0 && (
              <ExerciseList exercises={plan.exercises} compact />
            )}
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-bg-600">
        {!completed && onComplete && !isRest && (
          <Button
            variant="secondary"
            loading={completing}
            onClick={() => onComplete(entry.id)}
          >
            <Check size={14} />
            Marcar como concluído
          </Button>
        )}
        <Button
          variant="danger"
          loading={deleting}
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 size={14} />
          Remover agendamento
        </Button>
      </div>
    </Modal>
  )
}
