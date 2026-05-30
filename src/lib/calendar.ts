import type { ScheduleEntry } from '@/api/schedule'

export const GOAL_COLORS: Record<string, string> = {
  hypertrophy: 'bg-ember/20 text-ember border-ember/30',
  strength: 'bg-info/20 text-info border-info/30',
  endurance: 'bg-success/20 text-success border-success/30',
  weight_loss: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  flexibility: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  general: 'bg-bg-600 text-txt-dim border-bg-500',
}

export const GOAL_DOT: Record<string, string> = {
  hypertrophy: 'bg-ember',
  strength: 'bg-info',
  endurance: 'bg-success',
  weight_loss: 'bg-purple-400',
  flexibility: 'bg-teal-400',
  general: 'bg-txt-faint',
}

export const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Força',
  endurance: 'Resistência',
  weight_loss: 'Emagrecimento',
  flexibility: 'Flexibilidade',
  general: 'Geral',
}

export function goalLabel(goal: string | null | undefined): string {
  if (!goal) return 'Geral'
  return GOAL_LABELS[goal] ?? goal
}

export function goalColor(goal: string | null | undefined): string {
  if (!goal) return GOAL_COLORS.general
  return GOAL_COLORS[goal] ?? GOAL_COLORS.general
}

export function goalDot(goal: string | null | undefined): string {
  if (!goal) return GOAL_DOT.general
  return GOAL_DOT[goal] ?? GOAL_DOT.general
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildCalendarGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const endPad = 6 - lastDay.getDay()

  const days: Date[] = []
  for (let i = startPad; i > 0; i--)
    days.push(new Date(year, month, 1 - i))
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push(new Date(year, month, d))
  for (let i = 1; i <= endPad; i++)
    days.push(new Date(year, month + 1, i))

  return days
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function monthLabel(year: number, month: number): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export function indexEntriesByDate(entries: ScheduleEntry[]): Record<string, ScheduleEntry> {
  return Object.fromEntries(entries.map(e => [e.scheduled_date.slice(0, 10), e]))
}
