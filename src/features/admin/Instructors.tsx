import { getInitials } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getInstructors } from '@/api/users'

interface Instructor {
  id: string
  user_id: string
  user: { name: string; email: string; avatar_url?: string; active?: boolean }
  specialty?: string
  students_count?: number
  plans_count?: number
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-bg-700 animate-pulse">
      <div className="w-8 h-8 bg-bg-700 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-bg-700 rounded w-36" />
        <div className="h-2.5 bg-bg-700 rounded w-48" />
      </div>
      <div className="h-3 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminInstructors() {
  const navigate = useNavigate()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstructors() {
      try {
        const { data } = await getInstructors()
        const list = Array.isArray(data) ? data : (data?.data ?? [])
        setInstructors(list)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchInstructors()
  }, [])

  const q = search.toLowerCase()
  const filtered = instructors.filter(
    i =>
      (i.user?.name ?? '').toLowerCase().includes(q) ||
      (i.user?.email ?? '').toLowerCase().includes(q)
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
          Instrutores
        </h1>
        <Button onClick={() => navigate('/admin/instructors/invite')}>
          <UserPlus size={16} />
          Convidar Instrutor
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 bg-bg-800 border border-bg-600 rounded-lg pl-9 pr-4 text-sm text-txt placeholder:text-txt-faint focus:border-ember outline-none transition-colors"
        />
      </div>

      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1.5fr_100px_100px_48px] gap-4 px-4 py-3 border-b border-bg-600 text-xs font-medium text-txt-faint uppercase tracking-wider">
          <span>Instrutor</span>
          <span>Email</span>
          <span>Alunos</span>
          <span>Planos</span>
          <span />
        </div>

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4">
                <SkeletonRow />
              </div>
            ))
          : filtered.length === 0
          ? (
            <div className="py-16 text-center">
              <p className="text-txt-dim text-sm">
                {search
                  ? 'Nenhum instrutor encontrado.'
                  : 'Nenhum instrutor cadastrado. Convide seu primeiro instrutor!'}
              </p>
              {!search && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => navigate('/admin/instructors/invite')}
                >
                  <UserPlus size={14} />
                  Convidar Instrutor
                </Button>
              )}
            </div>
          )
          : filtered.map(inst => (
              <div
                key={inst.id}
                onClick={() => navigate(`/admin/instructors/${inst.id}`)}
                className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_1.5fr_100px_100px_48px] gap-4 items-center px-4 py-3 border-b border-bg-700 last:border-0 hover:bg-bg-700/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-xs font-bold text-info shrink-0">
                    {getInitials(inst.user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-txt truncate">{inst.user?.name}</p>
                    <p className="text-xs text-txt-faint sm:hidden truncate">{inst.user?.email}</p>
                  </div>
                </div>
                <span className="hidden sm:block text-sm text-txt-dim truncate">{inst.user?.email}</span>
                <Badge variant="dim">{inst.students_count ?? 0} alunos</Badge>
                <Badge variant="dim">{inst.plans_count ?? 0} planos</Badge>
                <ChevronRight size={16} className="text-txt-faint" />
              </div>
            ))}
      </div>
    </div>
  )
}
