import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'
import { getMe } from '@/api/users'

/** Validates persisted session on boot; clears auth if token is invalid. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const token = useAuthStore(s => s.token)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function validateSession() {
      try {
        await getMe()
      } catch {
        if (!cancelled) logout()
      }
    }

    void validateSession()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  return children
}
