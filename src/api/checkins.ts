import api from './client'
import { getMe } from './users'

export interface CheckInResponse {
  message: string
  checked_in_at: string
}

export const createCheckin = (data: { token: string; student_id: string }) =>
  api.post<CheckInResponse>('/check-in', data)

/** Resolves student_id from /me/dashboard and submits check-in. */
export async function submitCheckIn(token: string) {
  const { data: me } = await getMe()
  const studentId = (me as { student_id?: string })?.student_id
  if (!studentId) {
    throw Object.assign(new Error('Perfil de aluno não encontrado.'), { code: 'NO_STUDENT' })
  }
  return createCheckin({ token, student_id: studentId })
}

export const getAllCheckins = () => api.get('/check-ins')
