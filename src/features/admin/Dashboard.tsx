import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckSquare, Trophy, Gift, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth'
import { getStats } from '@/api/academy'
import { getActiveRanking, getLeagues } from '@/api/leagues'

interface Stats {
  active_students: number
  at_risk_students: number
  students_with_active_streak: number
  weekly_check_ins: number
}

interface RankingEntry {
  rank: number
  student_id: string
  name: string
  total_points: number
}

function positionStyle(position: number): string {
  if (position === 1) return 'bg-gold/20 text-gold'
  if (position === 2) return 'bg-txt-dim/20 text-txt-dim'
  return 'bg-bg-700 text-txt-faint'
}

function SkeletonCard() {
  return (
    <div className="bg-bg-800 border border-bg-600 rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-bg-700 rounded w-20 mb-3" />
      <div className="h-8 bg-bg-700 rounded w-16" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-bg-700 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="h-3 bg-bg-700 rounded w-32" />
        <div className="h-1.5 bg-bg-700 rounded w-full" />
      </div>
      <div className="h-3 bg-bg-700 rounded w-8 shrink-0" />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'BOM DIA'
  if (h < 18) return 'BOA TARDE'
  return 'BOA NOITE'
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [rankingLoading, setRankingLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(({ data }) => setStats(data))
      .finally(() => setStatsLoading(false))

    getActiveRanking()
      .then(({ data }) => setRanking(Array.isArray(data) ? data : (data.data ?? [])))
      .finally(() => setRankingLoading(false))

    getLeagues()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        const active = list.find((l: { status: string }) => l.status === 'active')
        if (active) setActiveLeagueId(active.id)
      })
      .catch(() => {})
  }, [])

  const maxPoints = ranking[0]?.total_points ?? 1

  const statCards: {
    label: string
    value: number | string | undefined
    icon: React.ReactNode
    onClick?: () => void
    isText?: boolean
  }[] = [
    {
      label: 'Alunos Ativos',
      value: stats?.active_students,
      icon: <Users size={18} className="text-info" />,
      onClick: () => navigate('/admin/students'),
    },
    {
      label: 'Check-ins/semana',
      value: stats?.weekly_check_ins,
      icon: <CheckSquare size={18} className="text-success" />,
    },
    {
      label: 'Com Streak Ativo',
      value: stats?.students_with_active_streak,
      icon: <Trophy size={18} className="text-gold" />,
    },
    {
      label: 'Em Risco',
      value: stats?.at_risk_students,
      icon: <Gift size={18} className="text-danger" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {getGreeting()},{' '}
          <span className="text-ember">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-txt-dim text-sm mt-0.5">Visão geral da sua academia</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? ['s1', 's2', 's3', 's4'].map(id => <SkeletonCard key={id} />)
          : statCards.map(card => {
              const Tag = card.onClick ? 'button' : 'div'
              return (
                <Tag
                  key={card.label}
                  type={card.onClick ? 'button' : undefined}
                  className={`bg-bg-800 rounded-xl border border-bg-600 p-5 text-left w-full ${card.onClick ? 'cursor-pointer hover:border-ember/40 transition-colors' : ''}`}
                  onClick={card.onClick}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-txt-dim uppercase tracking-wider">
                      {card.label}
                    </span>
                    {card.icon}
                  </div>
                  {card.isText ? (
                    <p
                      className="text-xl font-black text-txt"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {card.value ?? '—'}
                    </p>
                  ) : (
                    <p
                      className="text-3xl font-bold text-txt"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {card.value ?? '—'}
                    </p>
                  )}
                </Tag>
              )
            })}
      </div>

      {/* Top da Liga */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-black uppercase text-txt"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Top da Liga
          </h2>
          <TrendingUp size={16} className="text-txt-faint" />
        </div>

        {rankingLoading && (
          <div className="space-y-3">
            {['r1', 'r2', 'r3'].map(id => <SkeletonRow key={id} />)}
          </div>
        )}
        {!rankingLoading && ranking.length === 0 && (
          <p className="text-sm text-txt-dim text-center py-4">Nenhum dado de ranking disponível.</p>
        )}
        {!rankingLoading && ranking.length > 0 && (
          <div className="space-y-3">
            {ranking.slice(0, 5).map(s => (
              <div key={s.student_id} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${positionStyle(s.rank)}`}
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {s.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-bg-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ember rounded-full transition-all"
                        style={{ width: `${(s.total_points / maxPoints) * 100}%` }}
                      />
                    </div>
                    <span
                      className="text-xs text-txt-dim shrink-0"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {s.total_points}
                    </span>
                  </div>
                </div>
                {s.rank === 1 && <Badge variant="gold">1°</Badge>}
              </div>
            ))}
          </div>
        )}

        <button
          className="mt-4 text-sm text-ember hover:text-ember-hover transition-colors"
          onClick={() => navigate(activeLeagueId ? `/admin/leagues/${activeLeagueId}` : '/admin/leagues')}
        >
          Ver liga completa →
        </button>
      </Card>

      <button
        onClick={() => navigate('/admin/training-plans/generate')}
        className="flex items-center justify-between p-4 w-full bg-bg-800 border border-ember/20 rounded-xl hover:border-ember/40 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-txt flex items-center gap-1.5">
            <Sparkles size={14} className="text-ember" />
            Gerar Treino com IA
          </p>
          <p className="text-xs text-txt-faint mt-0.5">
            Gere planos de treino para alunos usando inteligência artificial
          </p>
        </div>
        <ArrowRight size={16} className="text-txt-faint" />
      </button>
    </div>
  )
}
