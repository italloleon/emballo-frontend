import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dumbbell, Plus, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createMachine, getMachines } from '@/api/exercises'
import { unwrapList } from '@/lib/utils'

interface Machine {
  id: string
  name: string
  category: string
  brand?: string
  status?: 'available' | 'maintenance'
}

const createSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  category: z.string().min(2, 'Categoria obrigatória'),
  brand: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const CATEGORY_COLORS: Record<string, string> = {
  Peito: 'text-ember bg-ember/10 border-ember/20',
  Costas: 'text-info bg-info/10 border-info/20',
  Pernas: 'text-success bg-success/10 border-success/20',
  Bíceps: 'text-gold bg-gold/10 border-gold/20',
  Tríceps: 'text-gold bg-gold/10 border-gold/20',
  Ombros: 'text-txt-dim bg-bg-700 border-bg-600',
  Cardio: 'text-danger bg-danger/10 border-danger/20',
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-bg-700 animate-pulse">
      <div className="w-8 h-8 bg-bg-700 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-bg-700 rounded w-36" />
      </div>
      <div className="h-5 bg-bg-700 rounded w-20" />
      <div className="h-5 bg-bg-700 rounded w-16" />
    </div>
  )
}

export default function AdminMachines() {
  const navigate = useNavigate()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  async function loadMachines() {
    const { data } = await getMachines()
    setMachines(unwrapList<Machine>(data))
  }

  useEffect(() => {
    loadMachines()
      .catch(() => setError('Não foi possível carregar os dados.'))
      .finally(() => setLoading(false))
  }, [])

  async function onCreate(values: CreateForm) {
    try {
      await createMachine(values)
      toast.success('Aparelho criado!')
      setCreateOpen(false)
      reset()
      await loadMachines()
    } catch {
      toast.error('Erro ao criar aparelho.')
    }
  }

  const available = machines.filter(m => m.status === 'available').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Aparelhos
        </h1>
        <div className="flex items-center gap-3">
          {!loading && machines.length > 0 && (
            <span className="text-sm text-txt-faint">
              <span className="text-success">{available} disponíveis</span>
              {' · '}
              <span className="text-danger">{machines.length - available} manutenção</span>
            </span>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Novo Aparelho
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[auto_1fr_140px_120px_80px_32px] gap-4 px-4 py-3 border-b border-bg-600 text-xs font-medium text-txt-faint uppercase tracking-wider">
          <span className="w-8" />
          <span>Aparelho</span>
          <span>Categoria</span>
          <span>Marca</span>
          <span>Status</span>
          <span />
        </div>

        {loading
          ? ['r1', 'r2', 'r3', 'r4', 'r5'].map(k => <SkeletonRow key={k} />)
          : machines.length === 0
          ? (
            <div className="py-16 text-center space-y-4">
              <Dumbbell size={32} className="text-txt-faint mx-auto" />
              <p className="text-txt-dim text-sm">Nenhum aparelho cadastrado.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={14} />
                Adicionar primeiro aparelho
              </Button>
            </div>
          )
          : machines.map(machine => (
            <div
              key={machine.id}
              onClick={() => navigate(`/admin/machines/${machine.id}`)}
              className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_1fr_140px_120px_80px_32px] gap-4 items-center px-4 py-3 border-b border-bg-700 last:border-0 cursor-pointer hover:bg-bg-700/40 transition-colors"
            >
              <div className="w-8 h-8 bg-bg-700 rounded-lg flex items-center justify-center shrink-0">
                <Dumbbell size={14} className="text-txt-faint" />
              </div>
              <div>
                <p className="text-sm font-medium text-txt">{machine.name}</p>
                <p className="text-xs text-txt-faint sm:hidden">{machine.category}{machine.brand ? ` · ${machine.brand}` : ''}</p>
              </div>
              <span
                className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${CATEGORY_COLORS[machine.category] ?? 'text-txt-dim bg-bg-700 border-bg-600'}`}
              >
                {machine.category}
              </span>
              <span className="hidden sm:block text-xs text-txt-faint">{machine.brand ?? '—'}</span>
              {machine.status === 'maintenance' ? (
                <Badge variant="danger">Manutenção</Badge>
              ) : (
                <Badge variant="success">OK</Badge>
              )}
              <ChevronRight size={16} className="text-txt-faint hidden sm:block" />
            </div>
          ))}
      </div>

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); reset() }}
        title="Novo Aparelho"
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Leg Press 45°"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Categoria"
            placeholder="Pernas"
            error={errors.category?.message}
            {...register('category')}
          />
          <Input
            label="Marca (opcional)"
            placeholder="Technogym"
            {...register('brand')}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { setCreateOpen(false); reset() }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Criar Aparelho'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
