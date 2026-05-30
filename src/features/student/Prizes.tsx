import { useEffect, useState } from 'react'
import { Gift, Lock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getLeagues, getLeaguePrizes } from '@/api/leagues'
import { getMe } from '@/api/users'
import { unwrapList } from '@/lib/utils'

interface Prize {
  id: string
  name: string
  description?: string | null
  rank_position: number
  monetary_value?: number | string | null
}

function rankEmoji(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🎁'
}

function SkeletonCard() {
  return (
    <div className="bg-bg-800 border border-bg-700 rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-14 h-14 bg-bg-700 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-bg-700 rounded w-32" />
          <div className="h-2.5 bg-bg-700 rounded w-48" />
          <div className="h-1.5 bg-bg-700 rounded w-full" />
        </div>
      </div>
    </div>
  )
}

export default function StudentPrizes() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [myPoints, setMyPoints] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [leaguesRes, meRes] = await Promise.all([getLeagues(), getMe()])

        const leagues = unwrapList<{ id: string; status: string }>(leaguesRes.data)
        const activeLeague =
          leagues.find(l => l.status === 'active') ??
          leagues.find(l => l.status === 'upcoming') ??
          leagues[0]

        if (activeLeague) {
          const { data } = await getLeaguePrizes(activeLeague.id)
          const list = unwrapList<Prize>(data).sort((a, b) => a.rank_position - b.rank_position)
          setPrizes(list)
        }

        const me = meRes.data as { points?: number; total_points?: number }
        setMyPoints(me?.points ?? me?.total_points ?? 0)
      } catch {
        setError('Não foi possível carregar os prêmios.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  function handleRedeem(prize: Prize) {
    toast.success(`Resgate de "${prize.name}" solicitado! Fale com a recepção.`)
  }

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Prêmios
        </h1>
        <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-full px-3 py-1.5">
          <Gift size={13} className="text-gold" />
          <span
            className="text-sm font-bold text-gold"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {myPoints} pts
          </span>
        </div>
      </div>

      <p className="text-xs text-txt-faint">
        Os prêmios são distribuídos ao final da liga por posição no ranking.
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading
          ? ['p1', 'p2', 'p3'].map(k => <SkeletonCard key={k} />)
          : prizes.length === 0
          ? (
            <div className="py-16 text-center">
              <p className="text-txt-dim text-sm">Nenhum prêmio cadastrado nesta liga.</p>
            </div>
          )
          : prizes.map(prize => {
              const canRedeem = myPoints > 0
              return (
                <div
                  key={prize.id}
                  className={`bg-bg-800 border rounded-xl p-4 transition-colors ${
                    canRedeem ? 'border-bg-600 hover:border-ember/30' : 'border-bg-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-ember/10 border border-ember/20 flex items-center justify-center text-2xl shrink-0">
                      {rankEmoji(prize.rank_position)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-txt">{prize.name}</h3>
                        <Badge variant="default" className="shrink-0">#{prize.rank_position}</Badge>
                      </div>
                      {prize.description && (
                        <p className="text-xs text-txt-faint mt-0.5">{prize.description}</p>
                      )}
                      {prize.monetary_value != null && Number(prize.monetary_value) > 0 && (
                        <p className="text-xs text-gold mt-1 font-medium">
                          Valor:{' '}
                          <span style={{ fontFamily: 'DM Mono, monospace' }}>
                            R$ {Number(prize.monetary_value).toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {canRedeem && (
                    <Button size="sm" className="w-full mt-3" onClick={() => handleRedeem(prize)}>
                      <CheckCircle2 size={14} />
                      Solicitar Resgate
                    </Button>
                  )}
                  {!canRedeem && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-txt-faint">
                      <Lock size={12} />
                      Acumule pontos na liga para resgatar
                    </div>
                  )}
                </div>
              )
            })}
      </div>
    </div>
  )
}
