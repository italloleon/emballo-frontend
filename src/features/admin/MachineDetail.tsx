import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { getMachine, updateMachine, deleteMachine } from '@/api/exercises'

interface Machine {
  id: string
  name: string
  category: string
  brand: string | null
  model: string | null
  serial_number: string | null
  image_url: string | null
  description: string | null
  properties: Record<string, unknown>
  active: boolean
  manufacture_year: number | null
  acquired_year: number | null
}

const editSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  category: z.string().min(2, 'Categoria obrigatória'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  description: z.string().optional(),
  manufacture_year: z.string().optional(),
  acquired_year: z.string().optional(),
})

type EditForm = z.infer<typeof editSchema>

function SkeletonCard() {
  return (
    <Card>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-bg-700 rounded w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-bg-700 rounded w-24" />
              <div className="h-3 bg-bg-700 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-bg-700 last:border-0">
      <span className="text-sm text-txt-faint shrink-0 w-40">{label}</span>
      <span className="text-sm text-txt text-right">{value ?? '—'}</span>
    </div>
  )
}

export default function AdminMachineDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  async function loadMachine() {
    try {
      const { data } = await getMachine(id!)
      const m: Machine = data?.data ?? data
      setMachine(m)
      setError(null)
    } catch {
      setError('Não foi possível carregar os dados do aparelho.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadMachine()
  }, [id])

  function openEdit() {
    if (!machine) return
    reset({
      name: machine.name,
      category: machine.category,
      brand: machine.brand ?? '',
      model: machine.model ?? '',
      serial_number: machine.serial_number ?? '',
      description: machine.description ?? '',
      manufacture_year: machine.manufacture_year != null ? String(machine.manufacture_year) : '',
      acquired_year: machine.acquired_year != null ? String(machine.acquired_year) : '',
    })
    setEditOpen(true)
  }

  async function onEdit(values: EditForm) {
    try {
      const parseYear = (val: string | undefined): number | null => {
        if (!val || val.trim() === '') return null
        const n = parseInt(val, 10)
        return isNaN(n) ? null : n
      }
      const payload = {
        name: values.name,
        category: values.category,
        brand: values.brand || null,
        model: values.model || null,
        serial_number: values.serial_number || null,
        description: values.description || null,
        manufacture_year: parseYear(values.manufacture_year),
        acquired_year: parseYear(values.acquired_year),
      }
      await updateMachine(id!, payload)
      toast.success('Aparelho atualizado com sucesso!')
      setEditOpen(false)
      await loadMachine()
    } catch {
      toast.error('Erro ao atualizar aparelho.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Excluir este aparelho?')) return
    setDeleting(true)
    try {
      await deleteMachine(id!)
      toast.success('Aparelho excluído.')
      navigate('/admin/machines')
    } catch {
      toast.error('Erro ao excluir aparelho.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="h-8 bg-bg-700 rounded w-40 animate-pulse" />
        <div className="h-9 bg-bg-700 rounded w-56 animate-pulse" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !machine) {
    return (
      <div className="space-y-5 max-w-2xl">
        <button
          className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
          onClick={() => navigate('/admin/machines')}
        >
          <ArrowLeft size={16} />
          Voltar para Aparelhos
        </button>
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error ?? 'Aparelho não encontrado.'}
        </div>
      </div>
    )
  }

  const propertyEntries = Object.entries(machine.properties ?? {})

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/admin/machines')}
      >
        <ArrowLeft size={16} />
        Voltar para Aparelhos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-bg-700 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell size={22} className="text-txt-faint" />
          </div>
          <div>
            <h1
              className="text-2xl font-black uppercase text-txt leading-tight"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {machine.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {machine.active ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="dim">Inativo</Badge>
              )}
              <Badge variant="dim">{machine.category}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={openEdit}>
            <Pencil size={14} />
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            loading={deleting}
          >
            <Trash2 size={14} />
            Excluir
          </Button>
        </div>
      </div>

      {/* Card 1 — Details */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-bg-600">
          <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider">Detalhes</h2>
        </div>
        <div className="px-5 py-1">
          <DetailRow label="Nome" value={machine.name} />
          <DetailRow label="Categoria" value={machine.category} />
          <DetailRow label="Marca" value={machine.brand} />
          <DetailRow label="Modelo" value={machine.model} />
          <DetailRow label="Número de série" value={machine.serial_number} />
          <DetailRow label="Ano de fabricação" value={machine.manufacture_year} />
          <DetailRow label="Ano de aquisição" value={machine.acquired_year} />
          {machine.description && (
            <div className="py-2.5 border-b border-bg-700 last:border-0">
              <span className="text-sm text-txt-faint block mb-1">Descrição</span>
              <p className="text-sm text-txt">{machine.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Card 2 — Properties */}
      {propertyEntries.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-3 border-b border-bg-600">
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider">
              Propriedades
            </h2>
          </div>
          <div className="px-5 py-1">
            {propertyEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 py-2.5 border-b border-bg-700 last:border-0"
              >
                <span className="text-sm text-txt-faint shrink-0 w-40 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span
                  className="text-sm text-txt text-right"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar Aparelho"
      >
        <form onSubmit={handleSubmit(onEdit)} className="space-y-4" noValidate>
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
            label="Marca"
            placeholder="Technogym"
            {...register('brand')}
          />
          <Input
            label="Modelo"
            placeholder="Model X"
            {...register('model')}
          />
          <Input
            label="Número de série"
            placeholder="SN-00001"
            {...register('serial_number')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ano de fabricação"
              type="number"
              placeholder="2020"
              error={errors.manufacture_year?.message}
              {...register('manufacture_year')}
            />
            <Input
              label="Ano de aquisição"
              type="number"
              placeholder="2022"
              error={errors.acquired_year?.message}
              {...register('acquired_year')}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-txt-dim block mb-1.5">
              Descrição
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-bg-700 border border-bg-600 px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
              placeholder="Descrição opcional do aparelho..."
              {...register('description')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setEditOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
