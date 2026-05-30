import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gift, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createLeaguePrize, getLeaguePrizes, getLeagues } from '@/api/leagues'
import { formatPoints, unwrapList } from '@/lib/utils'

interface League {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'finished'
}

interface Prize {
  id: string
  name: string
  description?: string | null
  rank_position: number
  monetary_value?: string | number | null
}

const createSchema = z.object({
  rank_position: z.number({ error: 'Informe a posição' }).int().min(1, 'Posição mínima: 1'),
  name: z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  monetary_value: z.number().min(0).optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

function rankEmoji(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🎁'
}

function SkeletonCard() {
  return (
    <div className="bg-bg-800 border border-bg-600 rounded-xl p-5 animate-pulse space-y-3">
      <div className="w-12 h-12 bg-bg-700 rounded-xl" />
      <div className="h-3 bg-bg-700 rounded w-32" />
      <div className="h-2.5 bg-bg-700 rounded w-48" />
      <div className="h-3 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminPrizes() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('')
  const [prizes, setPrizes] = useState<Prize[]>([])
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
    defaultValues: { rank_position: 1 },
  })

  const loadLeagues = useCallback(async () => {
    const { data } = await getLeagues()
    const list = unwrapList<League>(data)
    setLeagues(list)
    return list
  }, [])

  const loadPrizes = useCallback(async (leagueId: string) => {
    if (!leagueId) {
      setPrizes([])
      return
    }
    const { data } = await getLeaguePrizes(leagueId)
    setPrizes(unwrapList<Prize>(data).sort((a, b) => a.rank_position - b.rank_position))
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const list = await loadLeagues()
        const preferred =
          list.find(l => l.status === 'active') ??
          list.find(l => l.status === 'upcoming') ??
          list[0]
        if (preferred) setSelectedLeagueId(preferred.id)
        setError(null)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadLeagues])

  useEffect(() => {
    if (!selectedLeagueId) return
    loadPrizes(selectedLeagueId).catch(() => {
      setError('Não foi possível carregar os prêmios.')
    })
  }, [selectedLeagueId, loadPrizes])

  async function onCreate(values: CreateFormValues) {
    if (!selectedLeagueId) {
      toast.error('Selecione uma liga primeiro.')
      return
    }
    try {
      await createLeaguePrize(selectedLeagueId, {
        rank_position: values.rank_position,
        name: values.name,
        description: values.description,
        monetary_value: Number.isFinite(values.monetary_value) ? values.monetary_value : undefined,
      })
      toast.success('Prêmio criado!')
      setCreateOpen(false)
      reset({ rank_position: prizes.length + 1, name: '', description: '' })
      await loadPrizes(selectedLeagueId)
    } catch {
      toast.error('Erro ao criar prêmio.')
    }
  }

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId)
  const canCreate = Boolean(selectedLeagueId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Prêmios
        </h1>
        <Button onClick={() => setCreateOpen(true)} disabled={!canCreate}>
          <Plus size={16} />
          Novo Prêmio
        </Button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 max-w-md">
          <label htmlFor="league-select" className="text-sm font-medium text-txt-dim block mb-1.5">
            Liga
          </label>
          <select
            id="league-select"
            value={selectedLeagueId}
            onChange={e => setSelectedLeagueId(e.target.value)}
            disabled={loading || leagues.length === 0}
            className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember disabled:opacity-50"
          >
            {leagues.length === 0 ? (
              <option value="">Nenhuma liga cadastrada</option>
            ) : (
              leagues.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.status === 'active' ? ' (ativa)' : l.status === 'upcoming' ? ' (em breve)' : ' (encerrada)'}
                </option>
              ))
            )}
          </select>
        </div>
        {selectedLeague && (
          <p className="text-xs text-txt-faint pb-2.5">
            {prizes.length} prêmio{prizes.length === 1 ? '' : 's'} nesta liga
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : leagues.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-txt-dim text-sm">Crie uma liga em Ligas antes de cadastrar prêmios.</p>
        </div>
      ) : prizes.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <p className="text-txt-dim text-sm">Nenhum prêmio nesta liga.</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Adicionar prêmio
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map(prize => (
            <div
              key={prize.id}
              className="bg-bg-800 border border-bg-600 rounded-xl p-5 hover:border-ember/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-ember/10 border border-ember/20 rounded-xl flex items-center justify-center text-2xl">
                  {rankEmoji(prize.rank_position)}
                </div>
                <Badge variant="default">#{prize.rank_position}</Badge>
              </div>
              <h3 className="text-base font-semibold text-txt mb-1">{prize.name}</h3>
              {prize.description && (
                <p className="text-xs text-txt-dim mb-3">{prize.description}</p>
              )}
              {prize.monetary_value != null && Number(prize.monetary_value) > 0 && (
                <div className="flex items-center gap-1">
                  <Gift size={12} className="text-gold" />
                  <span
                    className="text-sm font-bold text-gold"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  >
                    R$ {formatPoints(Number(prize.monetary_value))}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Prêmio">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          {selectedLeague && (
            <p className="text-xs text-txt-faint">
              Liga: <span className="text-txt-dim">{selectedLeague.name}</span>
            </p>
          )}
          <Input
            label="Posição no ranking"
            type="number"
            min={1}
            error={errors.rank_position?.message}
            {...register('rank_position', { valueAsNumber: true })}
          />
          <Input
            label="Nome do prêmio"
            placeholder="1 mês de mensalidade grátis"
            error={errors.name?.message}
            {...register('name')}
          />
          <div>
            <label htmlFor="prize-description" className="text-sm font-medium text-txt-dim block mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              id="prize-description"
              rows={2}
              className="w-full rounded-lg bg-bg-700 border border-bg-600 px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
              {...register('description')}
            />
          </div>
          <Input
            label="Valor estimado (R$, opcional)"
            type="number"
            min={0}
            step="0.01"
            placeholder="150"
            error={errors.monetary_value?.message}
            {...register('monetary_value', { valueAsNumber: true })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Criar prêmio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
