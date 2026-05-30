import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('gl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const status: number | undefined = err.response?.status
    const method = (err.config?.method ?? 'GET').toUpperCase()
    const url = err.config?.url ?? ''

    // Always log — helps catch silent failures during development
    console.error(`[API] ${method} ${url} → ${status ?? 'Network Error'}`, {
      status,
      data: err.response?.data,
      message: err.message,
    })

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    // Show a toast only for errors that components are unlikely to handle
    // specifically (403, 429, 5xx). 422 validation errors are handled per-form.
    if (status === 403) {
      toast.error('Você não tem permissão para essa ação.')
    } else if (status === 429) {
      toast.error('Muitas requisições. Aguarde um momento e tente novamente.')
    } else if (status !== undefined && status >= 500) {
      toast.error('Erro no servidor. Tente novamente em instantes.')
    }

    return Promise.reject(err)
  }
)

export default api
