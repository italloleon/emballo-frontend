import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Dumbbell, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { ScheduleEntry } from '@/api/schedule'
import { isCompleted } from '@/api/schedule'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ExerciseList, GoalBadge } from './ExerciseList'

interface TrainingDayDrawerProps {
  entry: ScheduleEntry | null
  loading?: boolean
  open: boolean
  onClose: () => void
  onComplete: (id: string) => Promise<void>
  completing?: boolean
}

export function TrainingDayDrawer({
  entry,
  loading = false,
  open,
  onClose,
  onComplete,
  completing = false,
}: TrainingDayDrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const completed = entry ? isCompleted(entry) : false
  const plan = entry?.training_plan
  const isRest = entry && !entry.training_plan_id

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop: centered modal */}
      <div className="hidden sm:flex absolute inset-0 items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-lg bg-bg-800 rounded-2xl border border-bg-600 shadow-2xl',
            'max-h-[85vh] flex flex-col'
          )}
        >
          <DrawerContent
            entry={entry}
            loading={loading}
            completed={completed}
            plan={plan ?? null}
            isRest={!!isRest}
            onClose={onClose}
            onComplete={onComplete}
            completing={completing}
          />
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="sm:hidden absolute inset-x-0 bottom-0 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto bg-bg-800 rounded-t-2xl border-t border-bg-600 shadow-2xl',
            'max-h-[88svh] flex flex-col slide-up'
          )}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-bg-600" />
          </div>
          <DrawerContent
            entry={entry}
            loading={loading}
            completed={completed}
            plan={plan ?? null}
            isRest={!!isRest}
            onClose={onClose}
            onComplete={onComplete}
            completing={completing}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

interface DrawerContentProps {
  entry: ScheduleEntry | null
  loading: boolean
  completed: boolean
  plan: ScheduleEntry['training_plan']
  isRest: boolean
  onClose: () => void
  onComplete: (id: string) => Promise<void>
  completing: boolean
}

function DrawerContent({
  entry,
  loading,
  completed,
  plan,
  isRest,
  onClose,
  onComplete,
  completing,
}: DrawerContentProps) {
  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-bg-600 shrink-0">
        <div>
          <p className="text-xs text-txt-faint uppercase tracking-wider">Treino do dia</p>
          <p
            className="text-lg font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {entry ? formatDate(entry.scheduled_date) : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-bg-700 rounded w-48" />
            <div className="h-4 bg-bg-700 rounded w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-bg-700 rounded-xl" />
            ))}
          </div>
        ) : !entry ? (
          <div className="text-center py-8">
            <Dumbbell size={32} className="text-txt-faint mx-auto mb-3" />
            <p className="text-sm text-txt-dim">Nenhum treino agendado para este dia.</p>
          </div>
        ) : isRest ? (
          <div className="text-center py-8">
            <p className="text-sm text-txt-dim">Dia de descanso 💤</p>
            {entry.notes && (
              <p className="text-xs text-txt-faint mt-2 italic">{entry.notes}</p>
            )}
          </div>
        ) : plan ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  className="text-xl font-black uppercase text-txt"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {plan.name}
                </h3>
                <GoalBadge goal={plan.goal} />
              </div>
              {completed && (
                <Badge variant="success">
                  <Check size={10} className="mr-0.5" />
                  Feito
                </Badge>
              )}
            </div>

            {plan.description && (
              <p className="text-xs text-txt-dim">{plan.description}</p>
            )}

            {entry.notes && (
              <div className="bg-ember/5 border border-ember/20 rounded-xl px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-ember/70 mb-0.5">
                  Do seu instrutor
                </p>
                <p className="text-sm text-txt">{entry.notes}</p>
              </div>
            )}

            {plan.exercises && plan.exercises.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-txt-dim">
                  <Dumbbell size={13} />
                  <span>{plan.exercises.length} exercícios</span>
                </div>
                <ExerciseList exercises={plan.exercises} />
              </>
            )}
          </>
        ) : null}
      </div>

      {entry && !isRest && !completed && !loading && (
        <div className="px-5 py-4 border-t border-bg-600 shrink-0 pb-safe">
          <Button
            size="lg"
            className="w-full"
            loading={completing}
            onClick={() => onComplete(entry.id)}
          >
            <Check size={18} />
            Marcar como concluído
          </Button>
        </div>
      )}
    </>
  )
}
