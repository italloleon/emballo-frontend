import api from './client'

export const getStats = () => api.get('/academy/stats')
export const getAcademyProfile = () => api.get('/academy/profile')
export const updateAcademyProfile = (data: { name?: string; logo_url?: string }) =>
  api.put('/academy/profile', data)
export const getAcademySettings = () => api.get('/academy/settings')
export const updateAcademySettings = (data: {
  operating_hours?: string
  streak_break_days?: number
  streak_risk_notification_hour?: number
}) => api.put('/academy/settings', data)
