import { createApiClient } from '@/api/createClient'
import { webAdapters } from '@/adapters/web'
import { env } from '@/lib/env'

const api = createApiClient({
  baseURL: env.apiUrl,
  ...webAdapters,
})

export default api
