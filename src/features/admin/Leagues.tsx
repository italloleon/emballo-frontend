import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy, ChevronRight, Users, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createLeague, deleteLeague, getLeagues, updateLeague } from '@/api/leagues'
import { formatDate, unwrapList } from '@/lib/utils'

interface League {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'finished'
  starts_at: string
  ends_at: string
  participants_count?: number
}

const createSchema = z
  .object({
    name: z.string().min(2, 'Nome muito curto'),
    description: z.string().optional(),
    starts_at: z.string().min(1, 'Informe a data de início'),
    ends_at: z.string().min(1, 'Informe a data de término'),
    status: z.enum(['upcoming', 'active']),
  })
  .refine(data => data.ends_at > data.starts_at, {
    message: 'A data de término deve ser depois do início',
    path: ['ends_at'],
  })

type CreateFormValues = z.infer<typeof createSchema>

function statusBadge(status: League['status']) {
  if (status === 'active') return <Badge variant="success">Ativa</Badge>
  if (status === 'upcoming') return <Badge variant="default">Em breve</Badge>
  return <Badge variant="dim">Encerrada</Badge>
}

function leagueIconBg(status: League['status']) {
  if (status === 'active') return 'bg-gold/10 border border-gold/30'
  if (status === 'upcoming') return 'bg-ember/10 border border-ember/30'
  return 'bg-bg-700 border border-bg-600'
}

function leagueIconColor(status: League['status']) {
  if (status === 'active') return 'text-gold'
  if (status === 'upcoming') return 'text-ember'
  return 'text-txt-faint'
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-bg-700 animate-pulse">
      <div className="w-10 h-10 bg-bg-700 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-bg-700 rounded w-40" />
        <div className="h-2.5 bg-bg-700 rounded w-56" />
      </div>
      <div className="h-5 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminLeagues() {
  const navigate = useNavigate()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'upcoming' },
  })

  const loadLeagues = useCallback(async () => {
    try {
      const { data } = await getLeagues()
      setLeagues(unwrapList<League>(data))
      setError(null)
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeagues()
  }, [loadLeagues])

  async function handleDelete(e: React.MouseEvent, league: League) {
    e.stopPropagation()
    if (!window.confirm('Excluir esta liga? Todos os dados serão perdidos.')) return
    try {
      await deleteLeague(league.id)
      toast.success('Liga excluída.')
      await loadLeagues()
    } catch {
      toast.error('Erro ao excluir liga.')
    }
  }

  async function onCreate(values: CreateFormValues) {
    try {
      const { data: league } = await createLeague({
        name: values.name,
        description: values.description,
        starts_at: values.starts_at,
        ends_at: values.ends_at,
      })
      if (values.status === 'active') {
        await updateLeague(league.id, { status: 'active' })
      }
      toast.success('Liga criada com sucesso!')
      setCreateOpen(false)
      reset()
      await loadLeagues()
    } catch {
      toast.error('Erro ao criar liga. Verifique os dados e tente novamente.')
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Ligas
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Nova Liga
        </Button>
      </div>

      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        {loading && ['sk1', 'sk2', 'sk3'].map(k => <SkeletonRow key={k} />)}
        {!loading && leagues.length === 0 && (
          <div className="py-16 text-center space-y-4">
            <p className="text-txt-dim text-sm">Nenhuma liga encontrada.</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              Criar primeira liga
            </Button>
          </div>
        )}
        {!loading && leagues.length > 0 && leagues.map(league => (
              <div
                key={league.id}
                className="relative flex items-center gap-4 p-4 border-b border-bg-700 last:border-0 hover:bg-bg-700/40 transition-colors"
              >
                {/* Stretched nav button covers the whole row */}
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded"
                  onClick={() => navigate(`/admin/leagues/${league.id}`)}
                  aria-label={`Ver liga ${league.name}`}
                />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${leagueIconBg(league.status)}`}>
                  <Trophy size={18} className={leagueIconColor(league.status)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-txt">{league.name}</p>
                    {statusBadge(league.status)}
                  </div>
                  <p className="text-xs text-txt-faint">
                    {formatDate(league.starts_at)} — {formatDate(league.ends_at)}
                    {(league.participants_count ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Users size={10} />
                        {league.participants_count} participantes
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight size={16} className="relative z-10 text-txt-faint shrink-0 pointer-events-none" />
                <button
                  type="button"
                  title={league.status === 'active' ? 'Não é possível excluir uma liga ativa' : 'Excluir liga'}
                  disabled={league.status === 'active'}
                  onClick={e => handleDelete(e, league)}
                  className="relative z-10 p-1.5 rounded-lg text-txt-faint hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  aria-label="Excluir liga"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova Liga">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          <Input
            label="Nome"
            placeholder="Liga Junho 2026"
            error={errors.name?.message}
            {...register('name')}
          />
          <div>
            <label htmlFor="description" className="text-sm font-medium text-txt-dim block mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-lg bg-bg-700 border border-bg-600 px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
              placeholder="Regras ou tema da liga..."
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="date"
              error={errors.starts_at?.message}
              {...register('starts_at')}
            />
            <Input
              label="Término"
              type="date"
              error={errors.ends_at?.message}
              {...register('ends_at')}
            />
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium text-txt-dim block mb-1.5">
              Status inicial
            </label>
            <select
              id="status"
              className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember"
              {...register('status')}
            >
              <option value="upcoming">Em breve</option>
              <option value="active">Ativa agora</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Criar liga
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
