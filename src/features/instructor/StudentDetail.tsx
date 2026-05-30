import { getInitials, unwrapList } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, ClipboardList } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getStudent, getStudentCheckins, getStudentStats } from '@/api/users'
import { getTrainingPlans, type TrainingPlan } from '@/api/exercises'

interface StudentData {
  id: string
  user_id: string
  user: { name: string; email: string; avatar_url?: string }
  plan_name?: string
  checkins_week?: number
  checkins_total?: number
}

export default function InstructorStudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudent() {
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const from = weekAgo.toISOString()

        const [studentRes, statsRes, checkinsRes, plansRes] = await Promise.all([
          getStudent(id!),
          getStudentStats(id!),
          getStudentCheckins(id!, { from }),
          getTrainingPlans({ student_id: id!, active: true }),
        ])

        const activePlans = unwrapList<TrainingPlan>(plansRes.data)
        const checkinsWeek = unwrapList<{ checked_in_at?: string }>(checkinsRes.data).length

        setStudent({
          ...studentRes.data,
          plan_name: activePlans[0]?.name,
          checkins_total: statsRes.data?.total_check_ins ?? 0,
          checkins_week: checkinsWeek,
        })
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchStudent()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4 max-w-xl animate-pulse">
        <div className="h-6 bg-bg-700 rounded w-24" />
        <div className="h-36 bg-bg-800 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-xl">
        <button
          className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
          onClick={() => navigate('/instructor/students')}
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
    <div className="space-y-5 max-w-xl">
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/instructor/students')}
      >
        <ArrowLeft size={16} />
        Voltar para Alunos
      </button>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-info/10 border-2 border-info/30 flex items-center justify-center text-lg font-bold text-info shrink-0">
            {getInitials(student.user?.name)}
          </div>
          <div>
            <h2
              className="text-2xl font-black uppercase text-txt"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {student.user?.name}
            </h2>
            <p className="text-txt-dim text-sm">{student.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-bg-700 rounded-xl p-4 text-center">
            <p
              className="text-2xl font-bold text-txt"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {student.checkins_week ?? 0}
            </p>
            <p className="text-xs text-txt-faint mt-0.5">Check-ins esta semana</p>
          </div>
          <div className="bg-bg-700 rounded-xl p-4 text-center">
            <p
              className="text-2xl font-bold text-txt"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {student.checkins_total ?? 0}
            </p>
            <p className="text-xs text-txt-faint mt-0.5">Total de check-ins</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3
          className="text-lg font-black uppercase text-txt mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Plano de Treino
        </h3>
        {student.plan_name ? (
          <div className="flex items-center gap-3 p-3 bg-ember/5 border border-ember/20 rounded-xl">
            <ClipboardList size={18} className="text-ember shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-txt">{student.plan_name}</p>
            </div>
            <Badge variant="success">Ativo</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-bg-700 border border-bg-600 rounded-xl">
            <ClipboardList size={18} className="text-txt-faint shrink-0" />
            <p className="text-sm text-txt-dim">Nenhum plano atribuído ainda.</p>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() =>
            navigate(`/instructor/training-plans/generate?student=${student.id}`)
          }
        >
          <ClipboardList size={14} />
          {student.plan_name ? 'Trocar Plano' : 'Atribuir Plano'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="mt-2 w-full"
          onClick={() => navigate(`/instructor/students/${student.id}/calendar`)}
        >
          <Calendar size={14} />
          Calendário de Treinos
        </Button>
      </Card>
    </div>
  )
}
