import { Check, Moon } from 'lucide-react'
import type { ScheduleEntry } from '@/api/schedule'
import { cn } from '@/lib/utils'
import { goalColor, goalDot, isToday } from '@/lib/calendar'
import { isCompleted } from '@/api/schedule'

interface DayCellProps {
  date: Date
  currentMonth: number
  entry?: ScheduleEntry
  selected?: boolean
  onClick: () => void
  readOnly?: boolean
  todayRef?: React.RefObject<HTMLButtonElement | null>
}

export function DayCell({
  date,
  currentMonth,
  entry,
  selected,
  onClick,
  readOnly = false,
  todayRef,
}: DayCellProps) {
  const isCurrentMonth = date.getMonth() === currentMonth
  const today = isToday(date)
  const completed = entry ? isCompleted(entry) : false
  const isRest = entry && !entry.training_plan_id
  const plan = entry?.training_plan
  const goal = plan?.goal

  return (
    <button
      type="button"
      ref={today ? todayRef : undefined}
      onClick={onClick}
      disabled={!isCurrentMonth && readOnly}
      className={cn(
        'group relative flex flex-col items-stretch min-h-[52px] sm:min-h-[72px] p-1 sm:p-1.5 rounded-lg transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-ember/50',
        !isCurrentMonth && 'opacity-30 pointer-events-none',
        isCurrentMonth && !readOnly && 'cursor-pointer hover:bg-bg-700/60',
        isCurrentMonth && readOnly && entry && 'cursor-pointer hover:bg-bg-700/40',
        isCurrentMonth && readOnly && !entry && 'cursor-default',
        selected && 'ring-2 ring-ember bg-ember/10 shadow-[0_0_12px_rgba(244,99,42,0.25)]',
        today && !selected && 'ring-1 ring-ember/40 bg-ember/[0.04]'
      )}
    >
      <div className="flex items-start justify-between gap-0.5">
        <span
          className={cn(
            'text-xs sm:text-sm font-bold leading-none',
            today ? 'text-ember' : 'text-txt-dim',
            !isCurrentMonth && 'text-txt-faint'
          )}
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {date.getDate()}
        </span>
        {completed && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-success/20 shrink-0">
            <Check size={10} className="text-success" strokeWidth={3} />
          </span>
        )}
        {today && !completed && readOnly && (
          <span className="w-1.5 h-1.5 rounded-full bg-ember shrink-0 mt-0.5 animate-pulse" />
        )}
      </div>

      {entry && isCurrentMonth && (
        <div className="mt-auto pt-0.5">
          {isRest ? (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-txt-faint truncate">
              <Moon size={9} className="shrink-0" />
              <span className="truncate">Descanso</span>
            </span>
          ) : plan ? (
            <span
              className={cn(
                'block text-[9px] sm:text-[10px] font-medium truncate rounded px-1 py-0.5 border leading-tight',
                goalColor(goal)
              )}
            >
              {plan.name}
            </span>
          ) : null}
        </div>
      )}

      {selected && (
        <span className="absolute inset-0 rounded-lg border-2 border-ember/60 pointer-events-none" />
      )}
    </button>
  )
}

interface GoalLegendProps {
  className?: string
}

export function GoalLegend({ className }: GoalLegendProps) {
  const items = [
    { key: 'hypertrophy', label: 'Hipertrofia' },
    { key: 'strength', label: 'Força' },
    { key: 'endurance', label: 'Resistência' },
    { key: 'weight_loss', label: 'Emagrecimento' },
    { key: 'flexibility', label: 'Flexibilidade' },
  ]

  return (
    <div className={cn('flex flex-wrap gap-x-3 gap-y-1.5', className)}>
      {items.map(({ key, label }) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-[10px] text-txt-faint">
          <span className={cn('w-2 h-2 rounded-full shrink-0', goalDot(key))} />
          {label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[10px] text-txt-faint">
        <Moon size={10} />
        Descanso
      </span>
    </div>
  )
}
