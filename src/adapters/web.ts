import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import type { ApiAdapters, TokenProvider } from './types'

export const webTokenProvider: TokenProvider = {
  getToken: () => useAuthStore.getState().token,
  setToken: token => {
    if (token) {
      useAuthStore.setState({ token })
    } else {
      useAuthStore.getState().logout()
    }
  },
}

export const webAdapters: ApiAdapters = {
  tokenProvider: webTokenProvider,
  navigation: {
    redirectToLogin: () => {
      window.location.href = '/login'
    },
  },
  notifications: {
    error: message => toast.error(message),
  },
}
