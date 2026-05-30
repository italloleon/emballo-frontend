import { useState } from 'react'
import { CalendarDays, Moon, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TrainingPlan } from '@/api/exercises'
import { cn } from '@/lib/utils'
import { goalDot } from '@/lib/calendar'

interface BulkAssignPanelProps {
  selectedDays: string[]
  plans: TrainingPlan[]
  onSave: (planId: string | null, notes: string) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function BulkAssignPanel({
  selectedDays,
  plans,
  onSave,
  onCancel,
  saving = false,
}: BulkAssignPanelProps) {
  const [planId, setPlanId] = useState<string | 'rest' | ''>('')
  const [notes, setNotes] = useState('')

  const sortedDays = [...selectedDays].sort()
  const displayDays =
    sortedDays.length <= 3
      ? sortedDays.map(d => d.slice(8, 10) + '/' + d.slice(5, 7)).join(', ')
      : `${sortedDays.length} dias selecionados`

  async function handleSave() {
    const id = planId === 'rest' ? null : planId || null
    await onSave(id, notes)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:relative sm:inset-auto">
      <div className="sm:hidden h-16" aria-hidden />
      <div
        className={cn(
          'bg-bg-800 border-t sm:border border-bg-600 sm:rounded-2xl shadow-2xl',
          'p-4 sm:p-5 space-y-4 slide-up'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ember/10 border border-ember/20 flex items-center justify-center">
              <CalendarDays size={16} className="text-ember" />
            </div>
            <div>
              <p
                className="text-sm font-black uppercase text-txt"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Atribuir treino
              </p>
              <p className="text-xs text-txt-dim">{displayDays}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors"
            aria-label="Cancelar seleção"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-txt-faint">
            Plano de treino
          </label>
          <div className="grid gap-1.5 max-h-40 overflow-y-auto">
            <button
              type="button"
              onClick={() => setPlanId('rest')}
              className={cn(
                'flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl border transition-colors',
                planId === 'rest'
                  ? 'border-ember/50 bg-ember/10 text-txt'
                  : 'border-bg-600 bg-bg-700/50 text-txt-dim hover:border-bg-500'
              )}
            >
              <Moon size={14} className="shrink-0" />
              <span className="text-sm">Dia de descanso</span>
            </button>
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanId(plan.id)}
                className={cn(
                  'flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl border transition-colors',
                  planId === plan.id
                    ? 'border-ember/50 bg-ember/10 text-txt'
                    : 'border-bg-600 bg-bg-700/50 text-txt-dim hover:border-bg-500'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full shrink-0', goalDot(plan.goal))} />
                <span className="text-sm truncate">{plan.name}</span>
              </button>
            ))}
            {plans.length === 0 && (
              <p className="text-xs text-txt-faint px-1 py-2">
                Nenhum plano ativo. Crie um plano antes de agendar.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="schedule-notes"
            className="text-xs font-semibold uppercase tracking-wider text-txt-faint"
          >
            Observações (opcional)
          </label>
          <textarea
            id="schedule-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Ex: Foco na execução, sem aumentar carga"
            className="w-full bg-bg-700 border border-bg-600 rounded-xl px-3 py-2 text-sm text-txt placeholder:text-txt-faint resize-none focus:outline-none focus:ring-2 focus:ring-ember/40"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!planId}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
