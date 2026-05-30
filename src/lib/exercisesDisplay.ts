import type { ExerciseMachine, TrainingExercise } from '@/api/exercises'

/** Resolve machine name from schedule or training-plan exercise payloads. */
export function getExerciseMachineName(ex: TrainingExercise): string | undefined {
  const nested = ex.exercise?.machine
  if (nested?.name) return nested.name

  const pivotMachine = (ex as TrainingExercise & { machine?: ExerciseMachine | null }).machine
  if (pivotMachine?.name) return pivotMachine.name

  return undefined
}
