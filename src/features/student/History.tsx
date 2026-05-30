import { useEffect, useState } from 'react'
import { Flame, Calendar } from 'lucide-react'
import { getMyPoints } from '@/api/users'

interface ActivityItem {
  id: string
  // /me/points returns point transactions
  created_at?: string
  // /students/:id/check-ins returns check-ins
  checked_in_at?: string
  // amount (point transactions) or points (check-ins)
  amount?: number
  points?: number
  points_awarded?: number
  reason?: string
  bonus?: string
}

function getTimestamp(item: ActivityItem): string {
  return item.created_at ?? item.checked_in_at ?? ''
}

function getPoints(item: ActivityItem): number {
  return item.amount ?? item.points_awarded ?? item.points ?? 0
}

function groupByDate(items: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {}
  for (const item of items) {
    const ts = getTimestamp(item)
    if (!ts) continue
    const key = new Date(ts).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export default function StudentHistory() {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const { data } = await getMyPoints()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setActivity(list)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [])

  const totalPoints = activity.reduce((sum, a) => sum + getPoints(a), 0)
  const groups = groupByDate(activity)

  if (loading) {
    return (
      <div className="max-w-sm mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
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

  if (activity.length === 0) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Calendar size={40} className="text-txt-faint" />
        <h2
          className="text-xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Sem Histórico
        </h2>
        <p className="text-txt-dim text-sm">
          Você ainda não fez nenhum check-in. Que tal começar hoje?
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Histórico
        </h1>
        <div className="text-right">
          <p
            className="text-lg font-bold text-gold"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {totalPoints} pts
          </p>
          <p className="text-xs text-txt-faint">{activity.length} check-ins</p>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="space-y-4">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <p className="text-xs font-medium text-txt-faint uppercase tracking-wider mb-2 capitalize">
              {date}
            </p>
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-bg-800 border border-bg-600 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-ember/10 border border-ember/20 flex items-center justify-center shrink-0">
                    <Flame size={14} className="text-ember" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-txt">Check-in realizado</p>
                    {item.bonus && (
                      <p className="text-xs text-gold mt-0.5">{item.bonus}</p>
                    )}
                    <p className="text-xs text-txt-faint mt-0.5">
                      {getTimestamp(item)
                        ? new Date(getTimestamp(item)).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold text-success shrink-0"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    +{getPoints(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
