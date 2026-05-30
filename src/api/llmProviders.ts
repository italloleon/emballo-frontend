import api from './client'

export type LlmProviderType = 'openai' | 'anthropic' | 'gemini'

export interface LlmProvider {
  id: string
  academy_id: string
  name: string
  provider: LlmProviderType
  model: string
  active: boolean
  masked_key: string
  created_at: string
  updated_at: string
}

export interface LlmProviderPayload {
  name: string
  provider: LlmProviderType
  model: string
  api_key?: string
  active?: boolean
}

export const getLlmProviders = () => api.get<LlmProvider[]>('/academy/llm-providers')

export const createLlmProvider = (data: LlmProviderPayload & { api_key: string }) =>
  api.post<LlmProvider>('/academy/llm-providers', data)

export const updateLlmProvider = (id: string, data: Partial<LlmProviderPayload>) =>
  api.put<LlmProvider>(`/academy/llm-providers/${id}`, data)

export const deleteLlmProvider = (id: string) => api.delete(`/academy/llm-providers/${id}`)

export const SUGGESTED_MODELS: Record<LlmProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-1.5-pro', 'gemini-1.0-pro'],
}

export const PROVIDER_LABELS: Record<LlmProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
}
