import { getInitials } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Flame, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getStudents } from '@/api/users'
import { getActiveRanking } from '@/api/leagues'

interface Student {
  id: string
  user_id: string
  user: { name: string; email: string; avatar_url?: string; active?: boolean }
}

interface RankEntry { student_id: string; total_points: number }

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-bg-700 animate-pulse">
      <div className="w-8 h-8 bg-bg-700 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-bg-700 rounded w-36" />
        <div className="h-2.5 bg-bg-700 rounded w-48" />
      </div>
      <div className="h-3 bg-bg-700 rounded w-12" />
      <div className="h-3 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminStudents() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [pointsMap, setPointsMap] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const PER_PAGE = 5

  useEffect(() => {
    async function fetchAll() {
      try {
        const [studentsRes, rankingRes] = await Promise.all([
          getStudents(),
          getActiveRanking(),
        ])
        const list: Student[] = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data?.data ?? [])
        setStudents(list)
        const ranking: RankEntry[] = Array.isArray(rankingRes.data) ? rankingRes.data : (rankingRes.data?.data ?? [])
        setPointsMap(new Map(ranking.map(r => [r.student_id, r.total_points])))
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const q = search.toLowerCase()
  const filtered = students.filter(
    s =>
      (s.user?.name ?? '').toLowerCase().includes(q) ||
      (s.user?.email ?? '').toLowerCase().includes(q)
  )
  const total = filtered.length
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Alunos
        </h1>
        <Button onClick={() => navigate('/admin/students/invite')}>
          <UserPlus size={16} />
          Convidar Aluno
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full h-10 bg-bg-800 border border-bg-600 rounded-lg pl-9 pr-4 text-sm text-txt placeholder:text-txt-faint focus:border-ember outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        {/* Header Row */}
        <div className="hidden sm:grid grid-cols-[1fr_1.5fr_80px_100px_48px] gap-4 px-4 py-3 border-b border-bg-600 text-xs font-medium text-txt-faint uppercase tracking-wider">
          <span>Aluno</span>
          <span>Email</span>
          <span>Streak</span>
          <span>Pontos</span>
          <span />
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4">
                <SkeletonRow />
              </div>
            ))
          : paginated.length === 0
          ? (
            <div className="py-16 text-center">
              <p className="text-txt-dim text-sm">
                {search
                  ? 'Nenhum aluno encontrado para esta busca.'
                  : 'Nenhum aluno cadastrado. Convide seu primeiro aluno!'}
              </p>
              {!search && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => navigate('/admin/students/invite')}
                >
                  <UserPlus size={14} />
                  Convidar Aluno
                </Button>
              )}
            </div>
          )
          : paginated.map(s => {
              const pts = pointsMap.get(s.id) ?? 0
              return (
                <div
                  key={s.id}
                  className="relative grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_1.5fr_80px_100px_48px] gap-4 items-center px-4 py-3 border-b border-bg-700 last:border-0 hover:bg-bg-700/40 transition-colors"
                >
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded"
                    onClick={() => navigate(`/admin/students/${s.id}`)}
                    aria-label={`Ver aluno ${s.user?.name}`}
                  />
                  <div className="flex items-center gap-3 col-span-1">
                    <div className="w-8 h-8 rounded-full bg-ember/10 border border-ember/20 flex items-center justify-center text-xs font-bold text-ember shrink-0">
                      {getInitials(s.user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-txt truncate">{s.user?.name}</p>
                      <p className="text-xs text-txt-faint sm:hidden truncate">{s.user?.email}</p>
                    </div>
                  </div>
                  <span className="hidden sm:block text-sm text-txt-dim truncate">{s.user?.email}</span>
                  <div className="flex items-center gap-1">
                    {pts > 0 && <Flame size={13} className="text-ember" />}
                  </div>
                  <span
                    className={`text-sm font-bold ${pts > 0 ? 'text-gold' : 'text-txt-faint'}`}
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    {pts} pts
                  </span>
                  <ChevronRight size={16} className="relative z-10 text-txt-faint pointer-events-none" />
                </div>
              )
            })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-txt-dim">
          <span>{total} alunos</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 bg-bg-800 border border-bg-600 rounded-lg text-xs">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
