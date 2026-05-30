import api from './client'

export interface ExerciseMachine {
  id: string
  name: string
  category?: string
}

export interface TrainingExercise {
  id: string
  exercise_id: string
  order: number
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  properties?: { ai_generated?: boolean; provider?: string }
  exercise?: {
    id: string
    name: string
    description?: string
    muscle_groups?: string[]
    machine?: ExerciseMachine | null
  }
}

export interface TrainingPlan {
  id: string
  academy_id: string
  instructor_id: string
  student_id: string | null
  name: string
  description?: string
  goal?: string
  active: boolean
  exercises: TrainingExercise[]
  student?: { id: string; user?: { name: string; avatar_url?: string } }
  instructor?: { id: string; user?: { name: string } }
  updated_at?: string
  students_count?: number
}

export interface GenerateTrainingPlanPayload {
  student_id?: string
  goal: string
  context?: string
  exercise_count?: number
  provider_id?: string
  instructor_id?: string
}

export interface TrainingPlanPayload {
  name?: string
  description?: string
  goal?: string
  student_id?: string
  active?: boolean
}

export interface TrainingExercisePayload {
  sets?: number
  reps?: string
  rest_seconds?: number
  notes?: string
}

export interface MachinePayload { name: string; category: string; brand?: string | null; model?: string | null; serial_number?: string | null; description?: string | null; manufacture_year?: number | null; acquired_year?: number | null }

export interface TrainingPlanListParams {
  student_id?: string
  active?: boolean
}

// Training plans
export const getTrainingPlans = (params?: TrainingPlanListParams) =>
  api.get('/training-plans', { params })
export const getTrainingPlan = (id: string) => api.get<TrainingPlan>(`/training-plans/${id}`)
export const createTrainingPlan = (data: TrainingPlanPayload) => api.post('/training-plans', data)
export const updateTrainingPlan = (id: string, data: Partial<TrainingPlanPayload>) =>
  api.put(`/training-plans/${id}`, data)
export const deleteTrainingPlan = (id: string) => api.delete(`/training-plans/${id}`)
export const generateTrainingPlan = (data: GenerateTrainingPlanPayload) =>
  api.post<TrainingPlan>('/training-plans/generate', data)
export const updateTrainingPlanExercise = (
  planId: string,
  exerciseId: string,
  data: TrainingExercisePayload
) => api.put(`/training-plans/${planId}/exercises/${exerciseId}`, data)
export const deleteTrainingPlanExercise = (planId: string, exerciseId: string) =>
  api.delete(`/training-plans/${planId}/exercises/${exerciseId}`)
export const createMachine = (data: MachinePayload) => api.post('/machines', data)
export const updateMachine = (id: string, data: Partial<MachinePayload>) => api.put(`/machines/${id}`, data)
export const getMyTrainingPlans = () => api.get('/me/training-plans')

// Exercises library
export const getExercises = () => api.get('/exercises')
export const getExercise = (id: string) => api.get(`/exercises/${id}`)

// Machines
export const getMachines = () => api.get('/machines')
export const getMachine = (id: string) => api.get(`/machines/${id}`)
export const deleteMachine = (id: string) => api.delete(`/machines/${id}`)
export const deleteExercise = (id: string) => api.delete(`/exercises/${id}`)

// QR codes
export const getQrCodes = () => api.get('/qr-codes')
export const createQrCode = (data: { label: string }) => api.post('/qr-codes', data)
export const deleteQrCode = (id: string) => api.delete(`/qr-codes/${id}`)
