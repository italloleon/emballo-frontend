import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { getActiveRanking } from '@/api/leagues'

interface RankEntry {
  rank: number
  student_id: string
  name: string
  total_points: number
}

function positionStyle(pos: number) {
  if (pos === 1) return 'bg-gold/20 text-gold border border-gold/30'
  if (pos === 2) return 'bg-txt-dim/15 text-txt-dim border border-txt-dim/20'
  if (pos === 3) return 'bg-ember/15 text-ember border border-ember/20'
  return 'bg-bg-700 text-txt-faint border border-bg-600'
}

export default function StudentLeague() {
  const { user } = useAuthStore()
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRanking() {
      try {
        const { data } = await getActiveRanking()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setRanking(list)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [])

  const maxPoints = ranking[0]?.total_points ?? 1
  const myEntry = ranking.find(e => e.student_id === user?.id)

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
          <Trophy size={18} className="text-gold" />
        </div>
        <div>
          <h1
            className="text-2xl font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Liga Maio
          </h1>
          <p className="text-xs text-txt-faint">Ranking ao vivo</p>
        </div>
      </div>

      {/* My position highlight */}
      {!loading && myEntry && (
        <div className="bg-ember/5 border border-ember/25 rounded-xl p-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full bg-ember text-white flex items-center justify-center text-xs font-bold shrink-0"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {myEntry.rank}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ember">Sua posição</p>
            <p className="text-xs text-txt-faint">
              <span style={{ fontFamily: 'DM Mono, monospace' }}>{myEntry.total_points}</span> pontos este mês
            </p>
          </div>
        </div>
      )}

      {/* Full ranking */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-bg-600">
          <p className="text-xs font-medium text-txt-faint uppercase tracking-wider">Classificação Geral</p>
        </div>
        <div className="divide-y divide-bg-700">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-7 h-7 bg-bg-700 rounded-full" />
                  <div className="w-7 h-7 bg-bg-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-bg-700 rounded w-32" />
                    <div className="h-1.5 bg-bg-700 rounded w-full" />
                  </div>
                  <div className="h-3 bg-bg-700 rounded w-8" />
                </div>
              ))
            : ranking.map(entry => {
                const isMe = entry.student_id === user?.id
                const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
                return (
                  <div
                    key={entry.student_id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-ember/5' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${positionStyle(entry.rank)}`}
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {medal ?? entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-ember font-semibold' : 'text-txt'}`}>
                        {entry.name}
                        {isMe && <span className="text-xs ml-1">(você)</span>}
                      </p>
                      <div className="mt-1 h-1.5 bg-bg-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(entry.total_points / maxPoints) * 100}%`,
                            background: isMe ? '#F4632A' : entry.rank === 1 ? '#F5A623' : '#3A3735',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${isMe ? 'text-ember' : 'text-txt'}`}
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {entry.total_points}
                    </span>
                  </div>
                )
              })}
        </div>
      </Card>
    </div>
  )
}
