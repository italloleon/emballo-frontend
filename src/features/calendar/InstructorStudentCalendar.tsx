import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getStudent } from '@/api/users'
import { getTrainingPlans, type TrainingPlan } from '@/api/exercises'
import {
  bulkAssignSchedule,
  deleteScheduleEntry,
  completeScheduleEntry,
  enrichScheduleWithFullPlan,
  getStudentSchedule,
  indexByDate,
  type ScheduleEntry,
} from '@/api/schedule'
import { getInitials, unwrapList } from '@/lib/utils'
import { monthKey } from '@/lib/calendar'
import { CalendarGrid } from './CalendarGrid'
import { BulkAssignPanel } from './BulkAssignPanel'
import { DayDetailModal } from './DayDetailModal'
import { GoalLegend } from './DayCell'

interface InstructorStudentCalendarProps {
  backPath: string
  backLabel: string
}

export function InstructorStudentCalendar({ backPath, backLabel }: InstructorStudentCalendarProps) {
  const { id: studentId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [studentName, setStudentName] = useState('')
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const cacheRef = useRef<Record<string, ScheduleEntry[]>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [detailEntry, setDetailEntry] = useState<ScheduleEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)

  const currentMonthKey = monthKey(year, month)
  const entriesByDate = useMemo(() => indexByDate(entries), [entries])

  const fetchMonth = useCallback(async (mKey: string) => {
    if (!studentId) return
    if (cacheRef.current[mKey]) {
      setEntries(cacheRef.current[mKey])
      return
    }
    setLoading(true)
    try {
      const { data } = await getStudentSchedule(studentId, mKey)
      const list = unwrapList<ScheduleEntry>(data)
      setEntries(list)
      cacheRef.current[mKey] = list
      setError(null)
    } catch {
      setError('Não foi possível carregar o calendário.')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (!studentId) return
    async function init() {
      try {
        const [studentRes, plansRes] = await Promise.all([
          getStudent(studentId!),
          getTrainingPlans({ student_id: studentId!, active: true }),
        ])
        setStudentName(studentRes.data?.user?.name ?? 'Aluno')
        setPlans(unwrapList<TrainingPlan>(plansRes.data))
      } catch {
        setError('Não foi possível carregar os dados do aluno.')
      }
    }
    init()
  }, [studentId])

  useEffect(() => {
    fetchMonth(currentMonthKey)
  }, [currentMonthKey, fetchMonth])

  function goToMonth(y: number, m: number) {
    setYear(y)
    setMonth(m)
    setSelectedDays(new Set())
  }

  function handlePrevMonth() {
    if (month === 0) goToMonth(year - 1, 11)
    else goToMonth(year, month - 1)
  }

  function handleNextMonth() {
    if (month === 11) goToMonth(year + 1, 0)
    else goToMonth(year, month + 1)
  }

  function handleDayClick(dateKey: string, _date: Date) {
    const entry = entriesByDate[dateKey]

    if (selectedDays.size > 0 || !entry) {
      setSelectedDays(prev => {
        const next = new Set(prev)
        if (next.has(dateKey)) next.delete(dateKey)
        else next.add(dateKey)
        return next
      })
      return
    }

    setDetailEntry(entry)
    setDetailOpen(true)
    setDetailLoading(true)
    enrichScheduleWithFullPlan(entry)
      .then(setDetailEntry)
      .finally(() => setDetailLoading(false))
  }

  function mergeEntries(updated: ScheduleEntry[]) {
    const byDate = indexByDate(updated)
    setEntries(prev => {
      const map = { ...indexByDate(prev) }
      for (const [k, v] of Object.entries(byDate)) map[k] = v
      const merged = Object.values(map)
      cacheRef.current[currentMonthKey] = merged
      return merged
    })
  }

  async function handleBulkSave(planId: string | null, notes: string) {
    if (!studentId || selectedDays.size === 0) return
    setSaving(true)
    try {
      const { data } = await bulkAssignSchedule(studentId, {
        training_plan_id: planId,
        dates: Array.from(selectedDays),
        notes: notes || undefined,
      })
      mergeEntries(unwrapList<ScheduleEntry>(data))
      setSelectedDays(new Set())
      toast.success('Calendário atualizado!')
    } catch {
      toast.error('Erro ao salvar agendamento.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await deleteScheduleEntry(id)
      setEntries(prev => {
        const next = prev.filter(e => e.id !== id)
        cacheRef.current[currentMonthKey] = next
        return next
      })
      setDetailOpen(false)
      setDetailEntry(null)
      toast.success('Agendamento removido.')
    } catch {
      toast.error('Erro ao remover agendamento.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleComplete(id: string) {
    setCompleting(true)
    try {
      const { data } = await completeScheduleEntry(id)
      mergeEntries([data])
      setDetailEntry(data)
      toast.success('Treino marcado como concluído.')
    } catch {
      toast.error('Erro ao marcar como concluído.')
    } finally {
      setCompleting(false)
    }
  }

  if (error && !studentName) {
    return (
      <div className="space-y-4 max-w-2xl">
        <BackButton onClick={() => navigate(backPath)} label={backLabel} />
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl pb-32 sm:pb-6">
      <BackButton onClick={() => navigate(backPath.replace(':id', studentId!))} label={backLabel} />

      {/* Student header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-info/10 border-2 border-info/30 flex items-center justify-center text-lg font-bold text-info shrink-0">
          {getInitials(studentName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ember shrink-0" />
            <p className="text-xs text-txt-faint uppercase tracking-wider">Calendário de treinos</p>
          </div>
          <h1
            className="text-2xl font-black uppercase text-txt truncate"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {studentName}
          </h1>
        </div>
      </div>

      <GoalLegend />

      {loading && entries.length === 0 ? (
        <div className="bg-bg-800/50 rounded-2xl border border-bg-600 p-8 animate-pulse">
          <div className="h-8 bg-bg-700 rounded w-48 mx-auto mb-6" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-14 bg-bg-700 rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          entriesByDate={entriesByDate}
          selectedDays={selectedDays}
          onDayClick={handleDayClick}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {selectedDays.size > 0 && (
        <BulkAssignPanel
          selectedDays={Array.from(selectedDays)}
          plans={plans}
          onSave={handleBulkSave}
          onCancel={() => setSelectedDays(new Set())}
          saving={saving}
        />
      )}

      <DayDetailModal
        entry={detailEntry}
        open={detailOpen}
        loading={detailLoading}
        onClose={() => {
          setDetailOpen(false)
          setDetailEntry(null)
        }}
        onDelete={handleDelete}
        onComplete={handleComplete}
        deleting={deleting}
        completing={completing}
      />

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger">
          {error}
        </div>
      )}
    </div>
  )
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 text-txt-dim hover:text-txt transition-colors text-sm"
      onClick={onClick}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  )
}
