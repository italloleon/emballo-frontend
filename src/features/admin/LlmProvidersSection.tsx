import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Bot, Plus, Trash2, Pencil, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  getLlmProviders,
  createLlmProvider,
  updateLlmProvider,
  deleteLlmProvider,
  SUGGESTED_MODELS,
  PROVIDER_LABELS,
  type LlmProvider,
  type LlmProviderType,
} from '@/api/llmProviders'

const createSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  model: z.string().min(1, 'Modelo obrigatório'),
  api_key: z.string().min(10, 'Chave API obrigatória'),
  active: z.boolean(),
})

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100),
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  model: z.string().min(1, 'Modelo obrigatório'),
  api_key: z.string().optional(),
  active: z.boolean(),
})

type CreateFormValues = z.infer<typeof createSchema>
type EditFormValues = z.infer<typeof editSchema>

function getApiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (typeof msg === 'string') return msg
  }
  return fallback
}

export function LlmProvidersSection() {
  const [providers, setProviders] = useState<LlmProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LlmProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LlmProvider | null>(null)
  const [keySavedBanner, setKeySavedBanner] = useState<string | null>(null)

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { provider: 'openai', model: SUGGESTED_MODELS.openai[0], active: true },
  })

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  const watchCreateProvider = createForm.watch('provider')
  const watchEditProvider = editForm.watch('provider')

  async function fetchProviders() {
    try {
      const { data } = await getLlmProviders()
      setProviders(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Não foi possível carregar os provedores de IA.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  useEffect(() => {
    const models = SUGGESTED_MODELS[watchCreateProvider]
    if (models && !models.includes(createForm.getValues('model'))) {
      createForm.setValue('model', models[0])
    }
  }, [watchCreateProvider, createForm])

  useEffect(() => {
    if (!editTarget) return
    editForm.reset({
      name: editTarget.name,
      provider: editTarget.provider,
      model: editTarget.model,
      api_key: '',
      active: editTarget.active,
    })
  }, [editTarget, editForm])

  useEffect(() => {
    if (!editTarget) return
    const models = SUGGESTED_MODELS[watchEditProvider]
    if (models && !models.includes(editForm.getValues('model'))) {
      editForm.setValue('model', models[0])
    }
  }, [watchEditProvider, editTarget, editForm])

  async function onCreate(values: CreateFormValues) {
    try {
      const { data } = await createLlmProvider(values)
      setProviders(prev => [...prev, data])
      setCreateOpen(false)
      createForm.reset({ provider: 'openai', model: SUGGESTED_MODELS.openai[0], active: true })
      setKeySavedBanner(data.masked_key)
      toast.success('Provedor adicionado com sucesso!')
    } catch (err) {
      toast.error(getApiError(err, 'Erro ao adicionar provedor.'))
    }
  }

  async function onEdit(values: EditFormValues) {
    if (!editTarget) return
    try {
      const payload = { ...values }
      if (!payload.api_key) delete payload.api_key
      const { data } = await updateLlmProvider(editTarget.id, payload)
      setProviders(prev => prev.map(p => (p.id === data.id ? data : p)))
      if (values.api_key) {
        setKeySavedBanner(data.masked_key)
      }
      setEditTarget(null)
      toast.success('Provedor atualizado!')
    } catch (err) {
      toast.error(getApiError(err, 'Erro ao atualizar provedor.'))
    }
  }

  async function onDelete() {
    if (!deleteTarget) return
    try {
      await deleteLlmProvider(deleteTarget.id)
      setProviders(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('Provedor removido.')
    } catch (err) {
      toast.error(getApiError(err, 'Erro ao remover provedor.'))
    }
  }

  async function toggleActive(provider: LlmProvider) {
    try {
      const { data } = await updateLlmProvider(provider.id, { active: !provider.active })
      setProviders(prev => prev.map(p => (p.id === data.id ? data : p)))
    } catch {
      toast.error('Erro ao alterar status do provedor.')
    }
  }

  function ProviderSelect({
    value,
    onChange,
  }: {
    value: LlmProviderType
    onChange: (v: LlmProviderType) => void
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-txt-dim">Provedor</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value as LlmProviderType)}
          className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember transition-colors"
        >
          {(Object.keys(PROVIDER_LABELS) as LlmProviderType[]).map(key => (
            <option key={key} value={key}>
              {PROVIDER_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    )
  }

  function ModelSelect({
    provider,
    value,
    onChange,
    error,
  }: {
    provider: LlmProviderType
    value: string
    onChange: (v: string) => void
    error?: string
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-txt-dim">Modelo</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember transition-colors"
        >
          {SUGGESTED_MODELS[provider].map(model => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-ember" />
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider">
              Provedores de IA
            </h2>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Adicionar
          </Button>
        </div>

        {keySavedBanner && (
          <div className="mb-4 flex items-start gap-2 bg-success/10 border border-success/30 rounded-xl p-3 text-sm text-success">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Chave salva com segurança ({keySavedBanner})</p>
              <p className="text-xs mt-0.5 opacity-80">
                Ela não pode ser visualizada novamente. Use o campo de chave apenas para rotacionar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setKeySavedBanner(null)}
              className="ml-auto text-xs opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 bg-bg-700 rounded-xl" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <p className="text-sm text-txt-faint py-4 text-center">
            Nenhum provedor configurado. Adicione uma chave de API para habilitar a geração de treinos com IA.
          </p>
        ) : (
          <div className="space-y-3">
            {providers.map(provider => (
              <div
                key={provider.id}
                className="flex items-center gap-3 bg-bg-700 rounded-xl p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-txt">{provider.name}</p>
                    <Badge variant={provider.active ? 'success' : 'dim'}>
                      {provider.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-txt-faint mt-0.5">
                    {PROVIDER_LABELS[provider.provider]} · {provider.model}
                  </p>
                  <p className="text-xs text-txt-dim mt-1 font-mono">{provider.masked_key}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.active}
                      onChange={() => toggleActive(provider)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-bg-600 peer-focus:outline-none rounded-full peer peer-checked:bg-ember transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditTarget(provider)}
                    className="p-1.5 text-txt-dim hover:text-txt transition-colors"
                    aria-label="Editar provedor"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(provider)}
                    className="p-1.5 text-txt-dim hover:text-danger transition-colors"
                    aria-label="Remover provedor"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Adicionar Provedor de IA">
        <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4" noValidate>
          <Input
            label="Nome de exibição"
            placeholder="OpenAI Principal"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <ProviderSelect
            value={watchCreateProvider}
            onChange={v => createForm.setValue('provider', v)}
          />
          <ModelSelect
            provider={watchCreateProvider}
            value={createForm.watch('model')}
            onChange={v => createForm.setValue('model', v)}
            error={createForm.formState.errors.model?.message}
          />
          <Input
            label="Chave API"
            type="password"
            placeholder="sk-proj-..."
            error={createForm.formState.errors.api_key?.message}
            {...createForm.register('api_key')}
          />
          <label className="flex items-center gap-2 text-sm text-txt-dim cursor-pointer">
            <input type="checkbox" {...createForm.register('active')} className="rounded" />
            Ativo (disponível para geração)
          </label>
          <Button type="submit" className="w-full" loading={createForm.formState.isSubmitting}>
            Salvar Provedor
          </Button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Provedor">
        <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4" noValidate>
          <Input
            label="Nome de exibição"
            error={editForm.formState.errors.name?.message}
            {...editForm.register('name')}
          />
          <ProviderSelect
            value={watchEditProvider}
            onChange={v => editForm.setValue('provider', v)}
          />
          <ModelSelect
            provider={watchEditProvider}
            value={editForm.watch('model')}
            onChange={v => editForm.setValue('model', v)}
            error={editForm.formState.errors.model?.message}
          />
          <Input
            label="Nova chave API (opcional)"
            type="password"
            placeholder="Deixe em branco para manter a atual"
            error={editForm.formState.errors.api_key?.message}
            {...editForm.register('api_key')}
          />
          <label className="flex items-center gap-2 text-sm text-txt-dim cursor-pointer">
            <input type="checkbox" {...editForm.register('active')} className="rounded" />
            Ativo
          </label>
          <Button type="submit" className="w-full" loading={editForm.formState.isSubmitting}>
            Salvar Alterações
          </Button>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover Provedor">
        <p className="text-sm text-txt-dim mb-4">
          Tem certeza que deseja remover <strong className="text-txt">{deleteTarget?.name}</strong>?
          Treinos gerados anteriormente com este provedor não serão afetados, mas novas gerações
          precisarão de outro provedor ativo.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={onDelete}>
            Remover
          </Button>
        </div>
      </Modal>
    </>
  )
}
