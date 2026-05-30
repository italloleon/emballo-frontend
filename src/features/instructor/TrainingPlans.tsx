import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, ChevronRight, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getTrainingPlans } from '@/api/exercises'
import { formatDate, unwrapList } from '@/lib/utils'

interface TrainingPlan {
  id: string
  name: string
  description?: string
  active?: boolean
  student?: { id: string; user?: { name: string } }
  updated_at: string
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

export default function InstructorTrainingPlans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data } = await getTrainingPlans()
        setPlans(unwrapList(data))
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Planos de Treino
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/instructor/training-plans/generate')}>
            <Sparkles size={16} />
            Gerar com IA
          </Button>
          <Button onClick={() => navigate('/instructor/training-plans/new')}>
            <Plus size={16} />
            Novo Plano
          </Button>
        </div>
      </div>

      <div className="bg-bg-800 border border-bg-600 rounded-xl overflow-hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          : plans.length === 0
          ? (
            <div className="py-16 text-center">
              <ClipboardList size={32} className="text-txt-faint mx-auto mb-3" />
              <p className="text-txt-dim text-sm mb-4">Nenhum plano de treino criado ainda.</p>
              <Button size="sm" onClick={() => navigate('/instructor/training-plans/new')}>
                <Plus size={14} />
                Criar Plano
              </Button>
            </div>
          )
          : plans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center gap-4 p-4 border-b border-bg-700 last:border-0 hover:bg-bg-700/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/instructor/training-plans/${plan.id}`)}
              >
                <div className="w-10 h-10 bg-ember/10 border border-ember/20 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-ember" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-txt">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-txt-faint mt-0.5 truncate">{plan.description}</p>
                  )}
                  <p className="text-xs text-txt-faint mt-1">
                    Atualizado em {formatDate(plan.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {plan.student?.user?.name && (
                    <div className="hidden sm:flex items-center gap-1 text-txt-dim">
                      <Users size={12} />
                      <span className="text-xs truncate max-w-[120px]">{plan.student.user.name}</span>
                    </div>
                  )}
                  {plan.active === false && (
                    <span className="text-xs text-txt-faint">Rascunho</span>
                  )}
                  <ChevronRight size={16} className="text-txt-faint" />
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
