import api from './client'
import { getTrainingPlan, type TrainingPlan } from './exercises'
import type { TrainingExercise } from './exercises'
import { unwrapResource } from '@/lib/utils'

export interface ScheduledPlan {
  id: string
  name: string
  goal: string | null
  description: string | null
  exercises?: TrainingExercise[]
}

export interface ScheduleEntry {
  id: string
  student_id: string
  training_plan_id: string | null
  scheduled_date: string
  notes: string | null
  completed_at: string | null
  training_plan: ScheduledPlan | null
}

export interface BulkSchedulePayload {
  training_plan_id?: string | null
  dates: string[]
  notes?: string
}

export const isCompleted = (e: ScheduleEntry) => e.completed_at !== null

export const indexByDate = (entries: ScheduleEntry[]) =>
  Object.fromEntries(entries.map(e => [e.scheduled_date.slice(0, 10), e]))

export const getStudentSchedule = (studentId: string, month?: string) =>
  api.get<ScheduleEntry[]>(`/students/${studentId}/schedule`, {
    params: month ? { month } : {},
  })

export const bulkAssignSchedule = (studentId: string, payload: BulkSchedulePayload) =>
  api.post<ScheduleEntry[]>(`/students/${studentId}/schedule`, payload)

export const deleteScheduleEntry = (scheduleId: string) =>
  api.delete(`/training-schedules/${scheduleId}`)

export const completeScheduleEntry = (scheduleId: string) =>
  api.post<ScheduleEntry>(`/training-schedules/${scheduleId}/complete`)

export const getMySchedule = (month?: string) =>
  api.get<ScheduleEntry[]>('/me/schedule', { params: month ? { month } : {} })

export const getMyDaySchedule = (date: string) =>
  api.get<ScheduleEntry>(`/me/schedule/${date}`)

export const completeMySchedule = (scheduleId: string) =>
  api.post<ScheduleEntry>(`/me/schedule/${scheduleId}/complete`)

/** Schedule day responses may omit nested exercise.machine — merge from the full plan. */
export async function enrichScheduleWithFullPlan(entry: ScheduleEntry): Promise<ScheduleEntry> {
  const planId = entry.training_plan_id
  if (!planId) return entry

  try {
    const { data } = await getTrainingPlan(planId)
    const fullPlan = unwrapResource<TrainingPlan>(data)
    return {
      ...entry,
      training_plan: {
        id: fullPlan.id,
        name: fullPlan.name,
        goal: fullPlan.goal ?? null,
        description: fullPlan.description ?? null,
        exercises: fullPlan.exercises ?? entry.training_plan?.exercises,
      },
    }
  } catch {
    return entry
  }
}

export async function fetchMyScheduleDay(date: string): Promise<ScheduleEntry> {
  const { data } = await getMyDaySchedule(date)
  const entry = unwrapResource<ScheduleEntry>(data)
  return enrichScheduleWithFullPlan(entry)
}
