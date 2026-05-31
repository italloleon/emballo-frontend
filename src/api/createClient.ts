import axios, { type AxiosInstance } from 'axios'
import type { CreateApiClientOptions } from '@/adapters/types'

export function createApiClient({
  baseURL,
  tokenProvider,
  navigation,
  notifications,
}: CreateApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: { Accept: 'application/json' },
  })

  api.interceptors.request.use(config => {
    const token = tokenProvider.getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    res => res,
    err => {
      const status: number | undefined = err.response?.status
      const method = (err.config?.method ?? 'GET').toUpperCase()
      const url = err.config?.url ?? ''

      if (import.meta.env.DEV) {
        console.error(`[API] ${method} ${url} → ${status ?? 'Network Error'}`, {
          status,
          data: err.response?.data,
          message: err.message,
        })
      }

      if (status === 401) {
        tokenProvider.setToken(null)
        navigation.redirectToLogin()
        return Promise.reject(err)
      }

      if (status === 403) {
        notifications.error('Você não tem permissão para essa ação.')
      } else if (status === 429) {
        notifications.error('Muitas requisições. Aguarde um momento e tente novamente.')
      } else if (status !== undefined && status >= 500) {
        notifications.error('Erro no servidor. Tente novamente em instantes.')
      }

      return Promise.reject(err)
    }
  )

  return api
}
