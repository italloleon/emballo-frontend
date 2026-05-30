import { useRef } from 'react'
import type { ScheduleEntry } from '@/api/schedule'
import { buildCalendarGrid } from '@/lib/calendar'
import { DayCell, toDateKey } from './DayCell'
import { MonthNav, WeekdayHeader } from './MonthNav'

interface CalendarGridProps {
  year: number
  month: number
  entriesByDate: Record<string, ScheduleEntry>
  selectedDays?: Set<string>
  onDayClick: (dateKey: string, date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday?: () => void
  readOnly?: boolean
  showTodayButton?: boolean
}

export function CalendarGrid({
  year,
  month,
  entriesByDate,
  selectedDays = new Set(),
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onToday,
  readOnly = false,
  showTodayButton = false,
}: CalendarGridProps) {
  const days = buildCalendarGrid(year, month)
  const todayRef = useRef<HTMLButtonElement>(null)

  function handleToday() {
    onToday?.()
    requestAnimationFrame(() => {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div className="space-y-4">
      <MonthNav
        year={year}
        month={month}
        onPrev={onPrevMonth}
        onNext={onNextMonth}
        onToday={handleToday}
        showToday={showTodayButton}
      />

      <div className="bg-bg-800/50 rounded-2xl border border-bg-600 p-2 sm:p-3">
        <WeekdayHeader />
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map(date => {
            const key = toDateKey(date)
            return (
              <DayCell
                key={key}
                date={date}
                currentMonth={month}
                entry={entriesByDate[key]}
                selected={selectedDays.has(key)}
                onClick={() => onDayClick(key, date)}
                readOnly={readOnly}
                todayRef={todayRef}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
