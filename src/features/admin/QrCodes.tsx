import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { QrCode, Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CheckInQrImage } from '@/components/CheckInQrImage'
import { createQrCode, deleteQrCode, getQrCodes } from '@/api/exercises'
import { buildCheckInQrPayload } from '@/lib/qr'
import { unwrapList } from '@/lib/utils'

interface QrCodeItem {
  id: string
  label: string
  token: string
  active: boolean
}

const createSchema = z.object({
  label: z.string().min(2, 'Informe um nome para o ponto de check-in'),
})

type CreateFormValues = z.infer<typeof createSchema>

function SkeletonCard() {
  return (
    <div className="bg-bg-800 border border-bg-600 rounded-xl p-5 flex flex-col items-center animate-pulse space-y-4">
      <div className="w-full flex items-center justify-between">
        <div className="w-4 h-4 bg-bg-700 rounded" />
        <div className="w-12 h-5 bg-bg-700 rounded" />
      </div>
      <div className="w-24 h-24 bg-bg-700 rounded-lg" />
      <div className="w-full space-y-2">
        <div className="h-3 bg-bg-700 rounded w-32 mx-auto" />
        <div className="h-8 bg-bg-700 rounded w-full" />
      </div>
    </div>
  )
}

export default function AdminQrCodes() {
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) })

  const loadQrCodes = useCallback(async () => {
    try {
      const { data } = await getQrCodes()
      setQrCodes(unwrapList<QrCodeItem>(data))
      setError(null)
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQrCodes()
  }, [loadQrCodes])

  function copyToken(token: string) {
    navigator.clipboard
      .writeText(token)
      .then(() => toast.success('Token copiado!'))
      .catch(() => toast.error('Não foi possível copiar.'))
  }

  function copyQrPayload(token: string) {
    navigator.clipboard
      .writeText(buildCheckInQrPayload(token))
      .then(() => toast.success('Link do QR copiado!'))
      .catch(() => toast.error('Não foi possível copiar.'))
  }

  async function onCreate(values: CreateFormValues) {
    try {
      await createQrCode({ label: values.label })
      toast.success('QR code criado!')
      setCreateOpen(false)
      reset()
      await loadQrCodes()
    } catch {
      toast.error('Erro ao criar QR code.')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este QR Code?')) return
    // Optimistic removal
    setQrCodes(prev => prev.filter(q => q.id !== id))
    setDeletingId(id)
    try {
      await deleteQrCode(id)
      toast.success('QR code excluído.')
    } catch {
      toast.error('Erro ao excluir QR code.')
      // Revert on failure
      await loadQrCodes()
    } finally {
      setDeletingId(null)
    }
  }

  const activeCount = qrCodes.filter(q => q.active).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          QR Codes
        </h1>
        <div className="flex items-center gap-3">
          {!loading && <span className="text-txt-faint text-sm hidden sm:inline">{activeCount} ativos</span>}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Novo QR Code
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <p className="text-txt-dim text-sm">
        Imprima ou exiba o QR em cada ponto de check-in. Os alunos escaneiam com o app para registrar presença.
      </p>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['sk1', 'sk2', 'sk3'].map(k => <SkeletonCard key={k} />)}
        </div>
      )}
      {!loading && qrCodes.length === 0 && (
        <div className="py-16 text-center space-y-4">
          <p className="text-txt-dim text-sm">Nenhum QR code cadastrado.</p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Criar primeiro QR code
          </Button>
        </div>
      )}
      {!loading && qrCodes.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map(qr => (
            <div
              key={qr.id}
              className={`bg-bg-800 border rounded-xl p-5 flex flex-col items-center text-center ${
                qr.active ? 'border-bg-600' : 'border-bg-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-4">
                <QrCode size={14} className="text-txt-faint" />
                {qr.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="dim">Inativo</Badge>}
              </div>

              <div className="bg-white p-3 rounded-xl">
                <CheckInQrImage value={buildCheckInQrPayload(qr.token)} size={140} />
              </div>

              <div className="mt-4 w-full">
                <p className="text-sm font-semibold text-txt mb-0.5">{qr.label}</p>
                <div className="flex items-center justify-between bg-bg-700 rounded-lg px-3 py-2 mt-2 gap-2">
                  <code className="text-xs text-txt-dim font-mono truncate" title={qr.token}>
                    {qr.token.slice(0, 12)}…
                  </code>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyQrPayload(qr.token)}
                      className="text-txt-faint hover:text-txt transition-colors p-1"
                      aria-label="Copiar link do QR"
                      title="Copiar link do QR"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToken(qr.token)}
                      className="text-[10px] text-txt-faint hover:text-ember px-1"
                      title="Copiar token"
                    >
                      token
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(qr.id)}
                      disabled={deletingId === qr.id}
                      className="text-txt-faint hover:text-danger transition-colors p-1 disabled:opacity-50"
                      aria-label="Excluir QR code"
                      title="Excluir QR code"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo QR Code">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          <Input
            label="Local / identificação"
            placeholder="Entrada Principal"
            error={errors.label?.message}
            {...register('label')}
          />
          <p className="text-xs text-txt-faint">
            Ex.: Entrada, Musculação, Cardio. O token será gerado automaticamente.
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
