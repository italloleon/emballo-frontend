import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Dumbbell, Flame } from 'lucide-react'
import { toast } from 'sonner'
import {
  completeMySchedule,
  enrichScheduleWithFullPlan,
  fetchMyScheduleDay,
  getMySchedule,
  indexByDate,
  type ScheduleEntry,
} from '@/api/schedule'
import { unwrapList, unwrapResource } from '@/lib/utils'
import { monthKey, toDateKey } from '@/lib/calendar'
import { CalendarGrid } from '@/features/calendar/CalendarGrid'
import { GoalLegend } from '@/features/calendar/DayCell'
import { TrainingDayDrawer } from '@/features/calendar/TrainingDayDrawer'

export default function StudentCalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const cacheRef = useRef<Record<string, ScheduleEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dayEntry, setDayEntry] = useState<ScheduleEntry | null>(null)
  const [dayLoading, setDayLoading] = useState(false)
  const [completing, setCompleting] = useState(false)

  const currentMonthKey = monthKey(year, month)
  const entriesByDate = useMemo(() => indexByDate(entries), [entries])

  const monthStats = useMemo(() => {
    const scheduled = entries.length
    const completed = entries.filter(e => e.completed_at).length
    const todayKey = toDateKey(now)
    const todayEntry = entriesByDate[todayKey]
    return { scheduled, completed, todayEntry }
  }, [entries, entriesByDate, now])

  const fetchMonth = useCallback(async (mKey: string) => {
    if (cacheRef.current[mKey]) {
      setEntries(cacheRef.current[mKey])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await getMySchedule(mKey)
      const list = unwrapList<ScheduleEntry>(data)
      setEntries(list)
      cacheRef.current[mKey] = list
      setError(null)
    } catch {
      setError('Não foi possível carregar o calendário.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonth(currentMonthKey)
  }, [currentMonthKey, fetchMonth])

  function goToMonth(y: number, m: number) {
    setYear(y)
    setMonth(m)
  }

  function handlePrevMonth() {
    if (month === 0) goToMonth(year - 1, 11)
    else goToMonth(year, month - 1)
  }

  function handleNextMonth() {
    if (month === 11) goToMonth(year + 1, 0)
    else goToMonth(year, month + 1)
  }

  function handleToday() {
    const today = new Date()
    goToMonth(today.getFullYear(), today.getMonth())
  }

  async function handleDayClick(dateKey: string) {
    const cached = entriesByDate[dateKey]
    if (!cached) return

    setDrawerOpen(true)
    setDayEntry(cached)
    setDayLoading(true)

    try {
      const entry = await fetchMyScheduleDay(dateKey)
      setDayEntry(entry)
    } catch {
      toast.error('Não foi possível carregar o treino do dia.')
      setDrawerOpen(false)
      setDayEntry(null)
    } finally {
      setDayLoading(false)
    }
  }

  async function handleComplete(id: string) {
    setCompleting(true)
    try {
      const { data } = await completeMySchedule(id)
      const entry = await enrichScheduleWithFullPlan(unwrapResource<ScheduleEntry>(data))
      setEntries(prev => {
        const next = prev.map(e => (e.id === id ? entry : e))
        cacheRef.current[currentMonthKey] = next
        return next
      })
      setDayEntry(entry)
      toast.success('Treino do dia concluído! 💪')
    } catch {
      toast.error('Erro ao marcar como concluído.')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-ember" />
          <p className="text-xs text-txt-faint uppercase tracking-wider">Agenda</p>
        </div>
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Meu Calendário
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill
          icon={<Dumbbell size={14} />}
          value={monthStats.scheduled}
          label="Agendados"
        />
        <StatPill
          icon={<Flame size={14} />}
          value={monthStats.completed}
          label="Feitos"
          accent
        />
        <StatPill
          value={
            monthStats.scheduled > 0
              ? Math.round((monthStats.completed / monthStats.scheduled) * 100)
              : 0
          }
          label="% mês"
          suffix="%"
        />
      </div>

      <GoalLegend />

      {loading && entries.length === 0 ? (
        <div className="bg-bg-800/50 rounded-2xl border border-bg-600 p-6 animate-pulse">
          <div className="h-7 bg-bg-700 rounded w-40 mx-auto mb-5" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 bg-bg-700 rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          entriesByDate={entriesByDate}
          onDayClick={key => handleDayClick(key)}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          readOnly
          showTodayButton
        />
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <TrainingDayDrawer
        entry={dayEntry}
        loading={dayLoading}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDayEntry(null)
        }}
        onComplete={handleComplete}
        completing={completing}
      />
    </div>
  )
}

function StatPill({
  icon,
  value,
  label,
  suffix = '',
  accent = false,
}: {
  icon?: React.ReactNode
  value: number
  label: string
  suffix?: string
  accent?: boolean
}) {
  return (
    <div className="bg-bg-800 border border-bg-600 rounded-xl px-2 py-2.5 text-center">
      {icon && (
        <div className={`flex justify-center mb-0.5 ${accent ? 'text-ember' : 'text-txt-faint'}`}>
          {icon}
        </div>
      )}
      <p
        className={`text-lg font-bold ${accent ? 'text-ember' : 'text-txt'}`}
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        {value}{suffix}
      </p>
      <p className="text-[10px] text-txt-faint uppercase tracking-wide">{label}</p>
    </div>
  )
}
