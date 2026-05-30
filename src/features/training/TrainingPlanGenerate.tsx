import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Search,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getInitials, unwrapList } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { getStudents, getInstructors } from '@/api/users'
import { getLlmProviders, type LlmProvider } from '@/api/llmProviders'
import {
  generateTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
  updateTrainingPlanExercise,
  deleteTrainingPlanExercise,
  type TrainingPlan,
  type TrainingExercise,
} from '@/api/exercises'

const GOAL_CHIPS = [
  'Hipertrofia',
  'Força',
  'Emagrecimento',
  'Resistência',
  'Flexibilidade',
  'Geral',
] as const

interface Student {
  id: string
  user: { name: string; email: string; avatar_url?: string }
}

interface Instructor {
  id: string
  user: { name: string }
}

interface TrainingPlanGenerateProps {
  backPath: string
  listPath: string
}

function getApiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (typeof msg === 'string') return msg
    if (err.response?.status === 429) {
      return 'Limite de gerações atingido. Tente novamente em alguns minutos.'
    }
    if (err.response?.status === 503) {
      return 'Serviço de IA temporariamente indisponível. Tente novamente mais tarde.'
    }
  }
  return fallback
}

function exerciseName(ex: TrainingExercise): string {
  return ex.exercise?.name ?? 'Exercício'
}

export default function TrainingPlanGenerate({ backPath, listPath }: TrainingPlanGenerateProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedStudentId = searchParams.get('student')
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [step, setStep] = useState(1)
  const [students, setStudents] = useState<Student[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [providers, setProviders] = useState<LlmProvider[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<string>('')
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const [exerciseCount, setExerciseCount] = useState(6)
  const [providerId, setProviderId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<TrainingPlan | null>(null)
  const [planName, setPlanName] = useState('')
  const [activating, setActivating] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, instructorsRes] = await Promise.all([
          getStudents(),
          isAdmin ? getInstructors() : Promise.resolve({ data: [] }),
        ])
        const studentList = unwrapList<Student>(studentsRes.data)
        const instructorList = unwrapList<Instructor>(instructorsRes.data)

        setStudents(studentList)
        setInstructors(instructorList)

        if (preselectedStudentId) {
          const match = studentList.find(s => s.id === preselectedStudentId)
          if (match) {
            setSelectedStudent(match)
            setStep(2)
          }
        }

        // Only admins can manage providers — instructors use the app's default key
        if (isAdmin) {
          const providersRes = await getLlmProviders()
          const providerList = Array.isArray(providersRes.data) ? providersRes.data : []
          const active = providerList.filter((p: LlmProvider) => p.active)
          setProviders(active)
          const first = active[0]
          if (first) setProviderId(first.id)
        }
      } catch {
        toast.error('Erro ao carregar dados iniciais.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [isAdmin, preselectedStudentId])

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase()
    return (
      s.user.name.toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q)
    )
  })

  async function handleGenerate() {
    if (!selectedStudent || !goal.trim()) return
    if (isAdmin && !selectedInstructor) {
      toast.error('Selecione um instrutor.')
      return
    }

    setGenerating(true)
    try {
      const payload = {
        student_id: selectedStudent.id,
        goal: goal.trim(),
        context: context.trim() || undefined,
        exercise_count: exerciseCount,
        provider_id: providerId || undefined,
        ...(isAdmin ? { instructor_id: selectedInstructor } : {}),
      }
      const { data } = await generateTrainingPlan(payload)
      setGeneratedPlan(data)
      setPlanName(data.name)
      setStep(3)
      toast.success('Treino gerado com sucesso!')
    } catch (err) {
      toast.error(getApiError(err, 'Erro ao gerar treino. Tente novamente.'))
    } finally {
      setGenerating(false)
    }
  }

  async function handleActivate() {
    if (!generatedPlan) return
    setActivating(true)
    try {
      if (planName !== generatedPlan.name) {
        await updateTrainingPlan(generatedPlan.id, { name: planName })
      }
      await updateTrainingPlan(generatedPlan.id, { active: true })
      toast.success('Treino ativado e atribuído ao aluno!')
      navigate(listPath)
    } catch {
      toast.error('Erro ao ativar treino.')
    } finally {
      setActivating(false)
    }
  }

  async function handleDiscard() {
    if (!generatedPlan) return
    setDiscarding(true)
    try {
      await deleteTrainingPlan(generatedPlan.id)
      toast.success('Treino descartado.')
      navigate(listPath)
    } catch {
      toast.error('Erro ao descartar treino.')
    } finally {
      setDiscarding(false)
    }
  }

  async function handleRemoveExercise(exerciseId: string) {
    if (!generatedPlan || generatedPlan.exercises.length <= 1) {
      toast.error('O plano precisa ter ao menos um exercício.')
      return
    }
    try {
      await deleteTrainingPlanExercise(generatedPlan.id, exerciseId)
      setGeneratedPlan(prev =>
        prev
          ? { ...prev, exercises: prev.exercises.filter(e => e.id !== exerciseId) }
          : null
      )
    } catch {
      toast.error('Erro ao remover exercício.')
    }
  }

  async function handleUpdateExercise(
    exerciseId: string,
    field: 'sets' | 'reps' | 'rest_seconds',
    value: number | string
  ) {
    if (!generatedPlan) return
    const exercise = generatedPlan.exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const updated = { ...exercise, [field]: value }
    setGeneratedPlan(prev =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map(e => (e.id === exerciseId ? updated : e)),
          }
        : null
    )

    try {
      await updateTrainingPlanExercise(generatedPlan.id, exerciseId, { [field]: value })
    } catch {
      toast.error('Erro ao atualizar exercício.')
    }
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 bg-bg-700 rounded w-32" />
        <div className="h-64 bg-bg-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        type="button"
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => (step === 3 && generatedPlan ? setStep(2) : navigate(backPath))}
      >
        <ArrowLeft size={16} />
        {step === 3 && generatedPlan ? 'Voltar para Configuração' : 'Voltar'}
      </button>

      <div className="flex items-center gap-3">
        <Sparkles size={24} className="text-ember" />
        <h1
          className="text-3xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Gerar Treino com IA
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s ? 'bg-ember text-white' : 'bg-bg-700 text-txt-faint'
              }`}
            >
              {step > s ? <Check size={14} /> : s}
            </div>
            <span className={`text-xs ${step >= s ? 'text-txt' : 'text-txt-faint'}`}>
              {s === 1 ? 'Aluno' : s === 2 ? 'Configurar' : 'Revisar'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-bg-600" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Select student */}
      {step === 1 && (
        <Card>
          <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
            Selecionar Aluno
          </h2>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="w-full h-10 bg-bg-700 border border-bg-600 rounded-lg pl-9 pr-4 text-sm text-txt placeholder:text-txt-faint focus:border-ember outline-none transition-colors"
            />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-txt-faint text-center py-6">Nenhum aluno encontrado.</p>
            ) : (
              filteredStudents.map(student => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    selectedStudent?.id === student.id
                      ? 'bg-ember/10 border border-ember/30'
                      : 'bg-bg-700 hover:bg-bg-600 border border-transparent'
                  }`}
                >
                  {student.user.avatar_url ? (
                    <img
                      src={student.user.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-ember/10 border border-ember/20 flex items-center justify-center text-xs font-bold text-ember">
                      {getInitials(student.user.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-txt">{student.user.name}</p>
                    <p className="text-xs text-txt-faint truncate">{student.user.email}</p>
                  </div>
                  {selectedStudent?.id === student.id && (
                    <Check size={16} className="text-ember shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          <Button
            className="w-full mt-4"
            disabled={!selectedStudent}
            onClick={() => setStep(2)}
          >
            Continuar
            <ArrowRight size={16} />
          </Button>
        </Card>
      )}

      {/* Step 2 — Configure generation */}
      {step === 2 && (
        <div className="space-y-4">
          {selectedStudent && (
            <div className="flex items-center gap-3 bg-bg-800 border border-bg-600 rounded-xl p-3">
              <User size={16} className="text-txt-dim" />
              <span className="text-sm text-txt">{selectedStudent.user.name}</span>
            </div>
          )}

          <Card>
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
              Objetivo do Treino
            </h2>
            <Input
              label="Meta / Objetivo"
              placeholder="Hipertrofia muscular, foco em membros superiores"
              value={goal}
              onChange={e => setGoal(e.target.value.slice(0, 200))}
              maxLength={200}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {GOAL_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setGoal(chip)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    goal === chip
                      ? 'bg-ember/15 text-ember border-ember/30'
                      : 'bg-bg-700 text-txt-dim border-bg-600 hover:border-ember/30'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
              Contexto Adicional (opcional)
            </h2>
            <textarea
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-faint outline-none focus:border-ember transition-colors resize-none"
              rows={3}
              placeholder="Restrições, frequência semanal, equipamentos disponíveis..."
              value={context}
              onChange={e => setContext(e.target.value.slice(0, 1000))}
              maxLength={1000}
            />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
              Quantidade de Exercícios
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={3}
                max={15}
                value={exerciseCount}
                onChange={e => setExerciseCount(Number(e.target.value))}
                className="flex-1 accent-ember"
              />
              <span
                className="text-lg font-bold text-ember w-8 text-center"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {exerciseCount}
              </span>
            </div>
          </Card>

          {isAdmin && (
            <Card>
              <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
                Instrutor Responsável
              </h2>
              <select
                value={selectedInstructor}
                onChange={e => setSelectedInstructor(e.target.value)}
                className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember transition-colors"
              >
                <option value="">Selecione um instrutor</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.user.name}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {providers.length > 1 && (
            <Card>
              <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
                Provedor de IA
              </h2>
              <select
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                className="h-10 w-full rounded-lg bg-bg-700 border border-bg-600 px-3 text-sm text-txt outline-none focus:border-ember transition-colors"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.model})
                  </option>
                ))}
              </select>
            </Card>
          )}

          {isAdmin && providers.length === 0 && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
              Nenhum provedor de IA ativo configurado. Adicione uma chave API em Configurações.
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              className="flex-1"
              loading={generating}
              disabled={!goal.trim() || (isAdmin && (providers.length === 0 || !selectedInstructor))}
              onClick={handleGenerate}
            >
              <Bot size={16} />
              Gerar Treino com IA
            </Button>
          </div>
          {generating && (
            <p className="text-xs text-txt-faint text-center">
              A geração pode levar cerca de 15 segundos. Aguarde...
            </p>
          )}
        </div>
      )}

      {/* Step 3 — Review & save */}
      {step === 3 && generatedPlan && (
        <div className="space-y-4">
          <div className="bg-ember/10 border border-ember/20 rounded-xl p-3 flex items-center gap-2 text-sm text-ember">
            <Sparkles size={16} />
            Treino gerado por IA — revise antes de ativar
          </div>

          <Card>
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
              Informações do Plano
            </h2>
            <Input
              label="Nome do plano"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
            />
            {generatedPlan.description && (
              <p className="text-sm text-txt-dim mt-3">{generatedPlan.description}</p>
            )}
            <Badge variant="dim" className="mt-3">
              Rascunho — inactive até ativação
            </Badge>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-txt-dim uppercase tracking-wider mb-4">
              Exercícios ({generatedPlan.exercises.length})
            </h2>
            <div className="space-y-3">
              {generatedPlan.exercises.map((ex, idx) => (
                <div key={ex.id} className="bg-bg-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-txt-faint">
                        Exercício {idx + 1}
                      </span>
                      {ex.properties?.ai_generated && (
                        <Badge variant="gold">
                          <Sparkles size={10} className="mr-1" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="text-txt-faint hover:text-danger transition-colors"
                      aria-label="Remover exercício"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-txt mb-3">{exerciseName(ex)}</p>
                  {ex.notes && (
                    <p className="text-xs text-txt-faint mb-3 italic">{ex.notes}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Séries"
                      type="number"
                      min={1}
                      max={20}
                      value={ex.sets}
                      onChange={e =>
                        handleUpdateExercise(ex.id, 'sets', Number(e.target.value))
                      }
                    />
                    <Input
                      label="Reps"
                      value={ex.reps}
                      onChange={e => handleUpdateExercise(ex.id, 'reps', e.target.value)}
                    />
                    <Input
                      label="Descanso (s)"
                      type="number"
                      min={0}
                      value={ex.rest_seconds ?? 60}
                      onChange={e =>
                        handleUpdateExercise(ex.id, 'rest_seconds', Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              loading={discarding}
              onClick={handleDiscard}
            >
              Descartar
            </Button>
            <Button className="flex-1" loading={activating} onClick={handleActivate}>
              <Check size={16} />
              Ativar e Atribuir
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
