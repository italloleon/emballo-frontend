export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/** Laravel paginator `{ data: T[] }` or a plain array. */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data
    if (Array.isArray(inner)) return inner
  }
  return []
}

/** Laravel resource wrapper `{ data: T }` or a plain object. */
export function unwrapResource<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data
    if (inner && typeof inner === 'object') return inner as T
  }
  return payload as T
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat('pt-BR').format(points)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export interface StreakPayload {
  current_streak?: number
  longest_streak?: number
}

/** API returns streak as a number or as `{ current_streak, ... }`. */
export function getStreakDays(streak: number | StreakPayload | null | undefined): number {
  if (streak == null) return 0
  if (typeof streak === 'number') return streak
  return streak.current_streak ?? 0
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
