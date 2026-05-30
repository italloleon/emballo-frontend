import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'admin' | 'instructor' | 'student'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  academy_id: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem('gl_token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('gl_token')
        set({ token: null, user: null })
      },
    }),
    { name: 'gl-auth' }
  )
)
