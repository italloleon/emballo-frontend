import { useNavigate } from 'react-router-dom'
import { Flame, QrCode, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { getStreakDays } from '@/lib/utils'
import { useActiveRanking } from '@/hooks/queries/useActiveRanking'
import { useMeDashboard } from '@/hooks/queries/useMeDashboard'
import { useMyTrainingPlans } from '@/hooks/queries/useMyTrainingPlans'

function SkeletonBlock({ h = 'h-16' }: { h?: string }) {
  return <div className={`${h} bg-bg-700 rounded-xl animate-pulse`} />
}

export default function StudentHome() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const {
    data: ranking = [],
    isLoading: rankingLoading,
    isError: rankingError,
  } = useActiveRanking()
  const { data: me, isLoading: meLoading, isError: meError } = useMeDashboard()
  const { data: plans = [], isLoading: plansLoading } = useMyTrainingPlans()

  const loading = rankingLoading || meLoading || plansLoading
  const error = rankingError || meError
  const topFive = ranking.slice(0, 5)
  const trainingPlanName = plans[0]?.name ?? null

  const firstName = (user?.name ?? '').split(' ')[0]
  const maxPoints = topFive[0]?.total_points ?? 1
  const streakDays = getStreakDays(me?.streak)
  const studentId = me?.studentId ?? ''

  return (
    <div className="space-y-4 max-w-sm mx-auto pb-4">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          Não foi possível carregar os dados.
        </div>
      )}
      {/* Header */}
      {loading ? (
        <SkeletonBlock h="h-14" />
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-black uppercase text-txt"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Olá, {firstName} 👋
            </h1>
            <p className="text-txt-dim text-xs">
              {me?.leagueName ?? 'Liga'} · Posição #{me?.leagueRank ?? '—'}
            </p>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 bg-ember text-white rounded-full px-3 py-1.5">
              <Flame size={14} />
              <span
                className="text-sm font-bold"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {streakDays}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Check-in + Points row */}
      {loading ? (
        <SkeletonBlock h="h-20" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-16 flex-col gap-1 rounded-xl"
            onClick={() => navigate('/student/checkin')}
          >
            <QrCode size={20} />
            <span className="text-xs font-semibold">Check-in QR</span>
          </Button>
          <Card className="h-16 flex flex-col items-center justify-center" padding="none">
            <p
              className="text-xl font-bold text-gold"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {me?.leaguePoints ?? 0}
            </p>
            <p className="text-xs text-txt-faint">pts este mês</p>
          </Card>
        </div>
      )}

      {/* Top 5 League */}
      <Card padding="none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bg-600">
          <h2
            className="text-sm font-black uppercase text-txt tracking-wide"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            Top 5 da Liga
          </h2>
          <button
            className="text-xs text-ember"
            onClick={() => navigate('/student/league')}
          >
            Ver tudo
          </button>
        </div>
        <div className="divide-y divide-bg-700">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-6 h-6 bg-bg-700 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-bg-700 rounded w-28" />
                    <div className="h-1.5 bg-bg-700 rounded w-full" />
                  </div>
                  <div className="h-2.5 bg-bg-700 rounded w-8" />
                </div>
              ))
            : topFive.map(entry => {
                const isMe = entry.student_id === studentId
                return (
                  <div
                    key={entry.student_id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-ember/5' : ''}`}
                  >
                    <span
                      className={`w-5 text-xs font-bold shrink-0 text-center ${entry.rank === 1 ? 'text-gold' : 'text-txt-faint'}`}
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-ember' : 'text-txt'}`}>
                        {entry.name}
                        {isMe && <span className="text-xs ml-1 text-ember">(você)</span>}
                      </p>
                      <div className="mt-1 h-1.5 bg-bg-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isMe ? 'bg-ember' : 'bg-bg-600'}`}
                          style={{ width: `${(entry.total_points / maxPoints) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold text-txt-dim shrink-0"
                      style={{ fontFamily: 'DM Mono, monospace' }}
                    >
                      {entry.total_points}
                    </span>
                  </div>
                )
              })}
        </div>
      </Card>

      {/* Today's Training */}
      {loading ? (
        <SkeletonBlock h="h-20" />
      ) : (
        <button
          className="w-full text-left bg-bg-800 border border-bg-600 rounded-xl p-4 hover:border-ember/30 transition-colors"
          onClick={() => navigate('/student/calendar')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-txt-faint mb-0.5 uppercase tracking-wide">Meu treino hoje</p>
              <p className="text-sm font-semibold text-txt">
                {trainingPlanName ?? 'Nenhum plano atribuído'}
              </p>
            </div>
            <ChevronRight size={16} className="text-txt-faint" />
          </div>
        </button>
      )}
    </div>
  )
}
