import api from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  academy_name: string
  academy_city: string
  academy_phone: string
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'instructor' | 'student'
  academy_id: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const login = (data: LoginPayload) =>
  api.post<AuthResponse>('/auth/login', data)

export const register = (data: RegisterPayload) =>
  api.post<AuthResponse>('/register', data)

export const logout = () => api.post('/auth/logout')

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (data: {
  token: string
  email: string
  password: string
  password_confirmation: string
}) => api.post('/auth/reset-password', data)
