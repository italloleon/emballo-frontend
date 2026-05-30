import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flame, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getStudent, getStudentCheckins, getStudentStats } from '@/api/users'
import { formatDate, getInitials, getStreakDays } from '@/lib/utils'

interface StudentData {
  id: string
  user_id: string
  user: { name: string; email: string; avatar_url?: string }
  enrolled_at?: string
}

interface StudentStats {
  total_points?: number
  total_check_ins?: number
  streak?: { current_streak?: number } | null
}

interface ActivityItem {
  id: string
  checked_in_at: string
  points_awarded?: number
  points?: number
}

function StatBox({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="bg-bg-700 rounded-xl p-4 text-center">
      <p
        className={`text-2xl font-bold text-txt mb-0.5 ${mono ? 'font-mono' : ''}`}
        style={mono ? { fontFamily: 'DM Mono, monospace' } : undefined}
      >
        {value}
      </p>
      <p className="text-xs text-txt-faint">{label}</p>
    </div>
  )
}

export default function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [userRes, activityRes, statsRes] = await Promise.all([
          getStudent(id!),
          getStudentCheckins(id!),
          getStudentStats(id!),
        ])
        setStudent(userRes.data)
        setStats(statsRes.data)
        const actList = Array.isArray(activityRes.data)
          ? activityRes.data
          : (activityRes.data?.data ?? [])
        setActivity(actList)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchAll()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-32" />
        <div className="h-24 bg-bg-800 rounded-xl" />
        <div className="h-32 bg-bg-800 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-2xl">
        <button
          className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
          onClick={() => navigate('/admin/students')}
        >
          <ArrowLeft size={16} />
          Voltar para Alunos
        </button>
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back */}
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/admin/students')}
      >
        <ArrowLeft size={16} />
        Voltar para Alunos
      </button>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-ember/10 border-2 border-ember/30 flex items-center justify-center text-lg font-bold text-ember shrink-0">
            {getInitials(student.user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl font-black uppercase text-txt"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {student.user?.name}
            </h2>
            <p className="text-txt-dim text-sm">{student.user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="default">Aluno</Badge>
              {student.enrolled_at && (
                <span className="text-xs text-txt-faint flex items-center gap-1">
                  <Calendar size={11} />
                  Desde {formatDate(student.enrolled_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatBox
            label="Streak atual"
            value={`🔥 ${getStreakDays(stats?.streak)}d`}
            mono
          />
          <StatBox label="Pontos" value={stats?.total_points ?? 0} mono />
          <StatBox label="Check-ins" value={stats?.total_check_ins ?? 0} mono />
        </div>
      </Card>

      <Button
        className="w-full"
        onClick={() => navigate(`/admin/students/${student.id}/calendar`)}
      >
        <Calendar size={16} />
        Calendário de Treinos
      </Button>

      {/* Activity */}
      <Card>
        <h3
          className="text-lg font-black uppercase text-txt mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Histórico de Atividade
        </h3>
        {activity.length === 0 ? (
          <p className="text-sm text-txt-dim">Nenhuma atividade registrada.</p>
        ) : (
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-bg-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-700 flex items-center justify-center">
                    <Flame size={14} className="text-ember" />
                  </div>
                  <div>
                    <p className="text-sm text-txt">Check-in</p>
                    <p className="text-xs text-txt-faint">
                      {a.checked_in_at
                        ? new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(a.checked_in_at))
                        : '—'}
                    </p>
                  </div>
                </div>
                <span
                  className="text-sm font-bold text-success"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  +{a.points_awarded ?? a.points ?? 0} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
