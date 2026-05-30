import { getInitials, formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getLeague, getLeagueRanking } from '@/api/leagues'

interface League {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'finished'
  starts_at: string
  ends_at: string
}

interface RankEntry {
  rank: number
  student_id: string
  name: string
  total_points: number
  joined_at?: string
}

function positionColor(pos: number) {
  if (pos === 1) return 'bg-gold/20 text-gold border border-gold/30'
  if (pos === 2) return 'bg-txt-dim/20 text-txt-dim border border-txt-dim/30'
  if (pos === 3) return 'bg-ember/15 text-ember border border-ember/25'
  return 'bg-bg-700 text-txt-faint border border-bg-600'
}

function statusBadge(status: League['status']) {
  if (status === 'active') return <Badge variant="success">Ativa</Badge>
  if (status === 'upcoming') return <Badge variant="default">Em breve</Badge>
  return <Badge variant="dim">Encerrada</Badge>
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="w-8 h-8 bg-bg-700 rounded-full" />
      <div className="w-8 h-8 bg-bg-700 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-bg-700 rounded w-32" />
        <div className="h-2 bg-bg-700 rounded w-full" />
      </div>
      <div className="h-3 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminLeagueDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [league, setLeague] = useState<League | null>(null)
  const [ranking, setRanking] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [leagueRes, rankingRes] = await Promise.all([
          getLeague(id!),
          getLeagueRanking(id!),
        ])
        const l: League = leagueRes.data?.data ?? leagueRes.data
        const list: RankEntry[] = Array.isArray(rankingRes.data)
          ? rankingRes.data
          : (rankingRes.data?.data ?? [])
        setLeague(l)
        setRanking(list)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  const maxPoints = ranking[0]?.total_points ?? 1

  return (
    <div className="space-y-5 max-w-2xl">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/admin/leagues')}
      >
        <ArrowLeft size={16} />
        Voltar para Ligas
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
          <Trophy size={18} className="text-gold" />
        </div>
        <div>
          <h1
            className="text-2xl font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {loading ? 'Liga' : (league?.name ?? 'Ranking da Liga')}
          </h1>
          {!loading && league ? statusBadge(league.status) : <Badge variant="success">Ativa</Badge>}
          {!loading && league && (
            <p className="text-xs text-txt-faint mt-0.5">
              {formatDate(league.starts_at)} — {formatDate(league.ends_at)}
            </p>
          )}
        </div>
      </div>

      {/* INSCRITOS / Full ranking table */}
      <div>
        <h2
          className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-3"
        >
          Inscritos{!loading && ` (${ranking.length})`}
        </h2>
        <Card padding="none">
          <div className="px-4 py-3 border-b border-bg-600 grid grid-cols-[40px_1fr_100px_120px] gap-3 text-xs font-medium text-txt-faint uppercase tracking-wider">
            <span>#</span>
            <span>Aluno</span>
            <span className="hidden sm:block">Inscrito em</span>
            <span className="text-right">Pontos</span>
          </div>

          <div className="divide-y divide-bg-700">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4">
                    <SkeletonRow />
                  </div>
                ))
              : ranking.length === 0
              ? (
                <div className="py-12 text-center">
                  <p className="text-txt-dim text-sm">Nenhum inscrito nesta liga.</p>
                </div>
              )
              : ranking.map(entry => (
                  <div
                    key={entry.student_id}
                    className="grid grid-cols-[40px_1fr_120px] sm:grid-cols-[40px_1fr_100px_120px] gap-3 items-center px-4 py-3"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${positionColor(entry.rank)}`}
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {entry.rank}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-bg-700 flex items-center justify-center text-xs font-bold text-txt-dim shrink-0">
                        {getInitials(entry.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-txt truncate">{entry.name}</p>
                        <div className="mt-1 h-1.5 bg-bg-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(entry.total_points / maxPoints) * 100}%`,
                              background:
                                entry.rank === 1 ? '#F5A623' : entry.rank <= 3 ? '#F4632A' : '#3B82F6',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="hidden sm:block text-xs text-txt-faint">
                      {entry.joined_at ? formatDate(entry.joined_at) : '—'}
                    </span>
                    <span
                      className="text-sm font-bold text-txt text-right shrink-0"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {entry.total_points}
                    </span>
                  </div>
                ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
