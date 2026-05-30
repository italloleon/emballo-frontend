import { getInitials, unwrapList } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { getStudents } from '@/api/users'
import { getTrainingPlans, type TrainingPlan } from '@/api/exercises'
import { activePlanByStudentId } from '@/lib/trainingPlans'

interface Student {
  id: string
  user_id: string
  user: { name: string; email: string; avatar_url?: string }
  plan_name?: string
  checkins_week?: number
}

export default function InstructorStudents() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const [studentsRes, plansRes] = await Promise.all([
          getStudents(),
          getTrainingPlans({ active: true }),
        ])
        const list = unwrapList<Student>(studentsRes.data)
        const plansByStudent = activePlanByStudentId(unwrapList<TrainingPlan>(plansRes.data))
        setStudents(
          list.map(student => ({
            ...student,
            plan_name: plansByStudent.get(student.id)?.name,
          }))
        )
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const q = search.toLowerCase()
  const filtered = students.filter(
    s =>
      (s.user?.name ?? '').toLowerCase().includes(q) ||
      (s.user?.email ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Meus Alunos
        </h1>
        <span className="text-txt-faint text-sm">{students.length} alunos</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint" />
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 bg-bg-800 border border-bg-600 rounded-lg pl-9 pr-4 text-sm text-txt placeholder:text-txt-faint focus:border-ember outline-none transition-colors"
        />
      </div>

      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-bg-700 animate-pulse">
                <div className="w-8 h-8 bg-bg-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-bg-700 rounded w-32" />
                  <div className="h-2.5 bg-bg-700 rounded w-48" />
                </div>
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="py-12 text-center">
              <p className="text-txt-dim text-sm">Nenhum aluno encontrado.</p>
            </div>
          )
          : filtered.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-bg-700 last:border-0 hover:bg-bg-700/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/instructor/students/${s.id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-xs font-bold text-info shrink-0">
                  {getInitials(s.user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt">{s.user?.name}</p>
                  <p className="text-xs text-txt-faint">{s.user?.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.plan_name ? (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-txt-dim">
                      <ClipboardList size={11} />
                      <span className="truncate max-w-[140px]">{s.plan_name}</span>
                    </div>
                  ) : (
                    <Badge variant="danger" className="hidden sm:inline-flex text-xs">
                      Sem plano
                    </Badge>
                  )}
                  <ChevronRight size={16} className="text-txt-faint" />
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
