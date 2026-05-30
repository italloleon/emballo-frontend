import api from './client'

export interface CreateLeaguePayload {
  name: string
  description?: string
  starts_at: string
  ends_at: string
}

export const getLeagues = () => api.get('/leagues')
export const getLeague = (id: string) => api.get(`/leagues/${id}`)
export const createLeague = (data: CreateLeaguePayload) => api.post('/leagues', data)
export const updateLeague = (
  id: string,
  data: Partial<{ name: string; description: string; status: 'upcoming' | 'active' | 'finished' }>
) => api.put(`/leagues/${id}`, data)
export const getActiveRanking = () => api.get('/leagues/active/ranking')
export const getLeagueRanking = (id: string) => api.get(`/leagues/${id}/ranking`)

export interface CreatePrizePayload {
  rank_position: number
  name: string
  description?: string
  monetary_value?: number
}

export const getLeaguePrizes = (leagueId: string) => api.get(`/leagues/${leagueId}/prizes`)
export const createLeaguePrize = (leagueId: string, data: CreatePrizePayload) =>
  api.post(`/leagues/${leagueId}/prizes`, data)
export const deleteLeaguePrize = (prizeId: string) => api.delete(`/prizes/${prizeId}`)
export const deleteLeague = (id: string) => api.delete(`/leagues/${id}`)
