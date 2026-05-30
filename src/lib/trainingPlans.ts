import type { TrainingPlan } from '@/api/exercises'

/** Maps each student to their most recent active training plan. */
export function activePlanByStudentId(plans: TrainingPlan[]): Map<string, TrainingPlan> {
  const map = new Map<string, TrainingPlan>()
  for (const plan of plans) {
    if (!plan.active || !plan.student_id || map.has(plan.student_id)) continue
    map.set(plan.student_id, plan)
  }
  return map
}

export function getStudentActivePlanName(
  studentId: string,
  plansByStudent: Map<string, TrainingPlan>
): string | undefined {
  return plansByStudent.get(studentId)?.name
}
