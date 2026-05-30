import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Pencil, Trash2, ChevronRight, Users, Award } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { getInstructor, getInstructorStudents, updateInstructor, deleteInstructor } from '@/api/users'
import { getInitials, formatDate } from '@/lib/utils'

interface Instructor {
  id: string
  user_id: string
  specialty: string
  hired_at: string
  bonus_config: {
    attendance_bonus: number
    new_student_bonus: number
    attendance_threshold_percent: number
  }
  user: {
    name: string
    email: string
    role: string
    active: boolean
  }
}

interface InstructorStudent {
  id: string
  user_id: string
  instructor_id: string
  goal: string
  plan_type: string
  enrolled_at: string
  user: {
    name: string
    email: string
    active: boolean
  }
}

const editSchema = z.object({
  specialty: z.string().min(2, 'Especialidade obrigatória'),
})

type EditForm = z.infer<typeof editSchema>

function SkeletonProfile() {
  return (
    <Card>
      <div className="animate-pulse flex items-center gap-4">
        <div className="w-16 h-16 bg-bg-700 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-bg-700 rounded w-48" />
          <div className="h-3 bg-bg-700 rounded w-64" />
          <div className="h-3 bg-bg-700 rounded w-40" />
        </div>
      </div>
    </Card>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-bg-700 animate-pulse">
      <div className="w-8 h-8 bg-bg-700 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-bg-700 rounded w-32" />
        <div className="h-2.5 bg-bg-700 rounded w-48" />
      </div>
      <div className="h-5 bg-bg-700 rounded w-16" />
    </div>
  )
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  weight_loss: 'Emagrecimento',
  endurance: 'Resistência',
  strength: 'Força',
  flexibility: 'Flexibilidade',
  rehabilitation: 'Reabilitação',
}

export default function AdminInstructorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [students, setStudents] = useState<InstructorStudent[]>([])
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

  async function loadData() {
    try {
      const [instructorRes, studentsRes] = await Promise.all([
        getInstructor(id!),
        getInstructorStudents(id!),
      ])
      const inst: Instructor = instructorRes.data?.data ?? instructorRes.data
      const studs: InstructorStudent[] = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : (studentsRes.data?.data ?? [])
      setInstructor(inst)
      setStudents(studs)
      setError(null)
    } catch {
      setError('Não foi possível carregar os dados do instrutor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadData()
  }, [id])

  function openEdit() {
    if (!instructor) return
    reset({ specialty: instructor.specialty })
    setEditOpen(true)
  }

  async function onEdit(values: EditForm) {
    try {
      await updateInstructor(id!, { specialty: values.specialty })
      toast.success('Especialidade atualizada!')
      setEditOpen(false)
      await loadData()
    } catch {
      toast.error('Erro ao atualizar instrutor.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Excluir este instrutor? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    try {
      await deleteInstructor(id!)
      toast.success('Instrutor excluído.')
      navigate('/admin/instructors')
    } catch {
      toast.error('Erro ao excluir instrutor.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="h-8 bg-bg-700 rounded w-40 animate-pulse" />
        <SkeletonProfile />
        <Card padding="none">
          <div className="divide-y divide-bg-700">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (error || !instructor) {
    return (
      <div className="space-y-5 max-w-2xl">
        <button
          className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
          onClick={() => navigate('/admin/instructors')}
        >
          <ArrowLeft size={16} />
          Voltar para Instrutores
        </button>
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error ?? 'Instrutor não encontrado.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
        onClick={() => navigate('/admin/instructors')}
      >
        <ArrowLeft size={16} />
        Voltar para Instrutores
      </button>

      {/* Profile card */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-xl font-bold text-info shrink-0">
              {getInitials(instructor.user.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1
                  className="text-2xl font-black uppercase text-txt leading-tight"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  {instructor.user.name}
                </h1>
                {instructor.user.active ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="dim">Inativo</Badge>
                )}
              </div>
              <p className="text-sm text-txt-dim">{instructor.user.email}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-txt-faint">
                <Award size={13} />
                <span>{instructor.specialty}</span>
              </div>
              <p className="text-xs text-txt-faint mt-0.5">
                Contratado em {formatDate(instructor.hired_at)}
              </p>
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
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info/10 border border-info/20 rounded-xl flex items-center justify-center shrink-0">
              <Users size={18} className="text-info" />
            </div>
            <div>
              <p
                className="text-2xl font-bold text-txt"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {students.length}
              </p>
              <p className="text-xs text-txt-faint">Alunos</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ember/10 border border-ember/20 rounded-xl flex items-center justify-center shrink-0">
              <Award size={18} className="text-ember" />
            </div>
            <div>
              <p className="text-sm font-medium text-txt leading-tight">{instructor.specialty}</p>
              <p className="text-xs text-txt-faint">Especialidade</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Students section */}
      <div>
        <h2
          className="text-lg font-black uppercase text-txt mb-3"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Alunos ({students.length})
        </h2>
        <Card padding="none">
          {students.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-txt-dim text-sm">Este instrutor não tem alunos vinculados.</p>
            </div>
          ) : (
            <div className="divide-y divide-bg-700">
              {students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-700/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/students/${student.id}`)}
                >
                  <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-xs font-bold text-info shrink-0">
                    {getInitials(student.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-txt">{student.user.name}</p>
                    <p className="text-xs text-txt-faint">{student.user.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Badge variant="dim">
                      {GOAL_LABELS[student.goal] ?? student.goal}
                    </Badge>
                    <Badge variant="dim">{student.plan_type}</Badge>
                  </div>
                  <div className="hidden sm:block text-xs text-txt-faint shrink-0">
                    {formatDate(student.enrolled_at)}
                  </div>
                  <ChevronRight size={16} className="text-txt-faint shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Edit specialty modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Especialidade">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-4" noValidate>
          <Input
            label="Especialidade"
            placeholder="Musculação e Hipertrofia"
            error={errors.specialty?.message}
            {...register('specialty')}
          />
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
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
