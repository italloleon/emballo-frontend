import api from './client'

// Me
export const getMe = () => api.get('/me/dashboard')
export const getMyStreak = () => api.get('/me/streak')
export const getMyPoints = () => api.get('/me/points')
export const getMyLeagues = () => api.get('/me/leagues')
export const getMyNotifications = () => api.get('/me/notifications')
export const markNotificationRead = (id: string) =>
  api.put(`/me/notifications/${id}/read`)

// Students (admin + instructor)
export const getStudents = () => api.get('/students')
export const getStudent = (id: string) => api.get(`/students/${id}`)
export const getStudentCheckins = (id: string, params?: { from?: string; to?: string }) =>
  api.get(`/students/${id}/check-ins`, { params })
export const getStudentStats = (id: string) => api.get(`/students/${id}/stats`)

// Instructors (admin only)
export const getInstructors = () => api.get('/instructors')
export const getInstructor = (id: string) => api.get(`/instructors/${id}`)
export const getInstructorStudents = (id: string) => api.get(`/instructors/${id}/students`)

export interface InstructorPayload { specialty?: string; hired_at?: string }
export interface StudentPayload { goal?: string; plan_type?: string; notes?: string; instructor_id?: string }

export const deleteInstructor = (id: string) => api.delete(`/instructors/${id}`)
export const updateInstructor = (id: string, data: Partial<InstructorPayload>) => api.put(`/instructors/${id}`, data)
export const deleteStudent = (id: string) => api.delete(`/students/${id}`)
export const updateStudent = (id: string, data: Partial<StudentPayload>) => api.put(`/students/${id}`, data)

// Cheers
export const cheerUser = (userId: string) =>
  api.post<{ success: boolean; cheers_count: number }>(`/users/${userId}/cheer`)

// Invitations (not yet implemented in backend)
export const sendInvitation = (data: { name: string; email: string; role: string }) =>
  api.post('/invitations', data)
