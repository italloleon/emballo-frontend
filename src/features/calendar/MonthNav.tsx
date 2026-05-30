import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { monthLabel } from '@/lib/calendar'

interface MonthNavProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onToday?: () => void
  showToday?: boolean
}

export function MonthNav({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  showToday = false,
}: MonthNavProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="p-2 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="p-2 rounded-lg text-txt-dim hover:text-txt hover:bg-bg-700 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <h2
        className="text-xl sm:text-2xl font-black uppercase text-txt tracking-tight text-center flex-1"
        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
      >
        {monthLabel(year, month)}
      </h2>

      {showToday && onToday ? (
        <button
          type="button"
          onClick={onToday}
          className="text-xs font-semibold uppercase tracking-wider text-ember hover:text-ember-hover px-3 py-1.5 rounded-lg border border-ember/30 hover:border-ember/50 transition-colors shrink-0"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Hoje
        </button>
      ) : (
        <div className="w-[72px] shrink-0" aria-hidden />
      )}
    </div>
  )
}

interface WeekdayHeaderProps {
  className?: string
}

export function WeekdayHeader({ className }: WeekdayHeaderProps) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return (
    <div className={cn('grid grid-cols-7 gap-px mb-px', className)}>
      {days.map(d => (
        <div
          key={d}
          className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-txt-faint py-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {d}
        </div>
      ))}
    </div>
  )
}
