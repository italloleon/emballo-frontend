import api from './client'
import {
  normalizeFeedEntry,
  parseLikeToggleResponse,
  parseLikersResponse,
  type FeedLiker,
  type FeedReactionsFields,
  type LikeToggleResult,
} from '@/lib/feedSocial'

export type { FeedLiker, FeedReactionsFields, LikeToggleResult }

export type EventType = 'check_in' | 'streak_milestone' | 'prize_won' | 'member_joined'

export interface EventEntry extends FeedReactionsFields {
  id: string
  kind: 'event'
  type: EventType
  payload: Record<string, unknown>
  created_at: string
  likes_count: number
  liked_by_me: boolean
}

export interface PostEntry extends FeedReactionsFields {
  id: string
  kind: 'post'
  type: 'post'
  author: { id: string; name: string }
  body: string
  pinned: boolean
  media: { url: string; media_type: 'image' | 'video'; order: number }[]
  created_at: string
  likes_count: number
  liked_by_me: boolean
}

export type FeedEntry = EventEntry | PostEntry

export interface FeedResponse {
  data: FeedEntry[]
  next_cursor: string | null
  has_more: boolean
}

export const getFeed = (cursor?: string, perPage = 20) =>
  api.get<FeedResponse>('/feed', { params: { cursor, per_page: perPage } })

export const createPost = async (data: { body: string; pinned?: boolean }): Promise<PostEntry> => {
  const res = await api.post<PostEntry>('/feed/posts', data)
  return normalizeFeedEntry(res.data)
}

export const deletePost = (id: string) =>
  api.delete(`/feed/posts/${id}`)

export const pinPost = (id: string) =>
  api.put(`/feed/posts/${id}/pin`)

export const toggleLike = async (id: string): Promise<LikeToggleResult> => {
  const res = await api.post(`/feed/${id}/like`)
  return parseLikeToggleResponse(res.data)
}

export const getLikers = async (id: string): Promise<{ data: FeedLiker[]; total: number }> => {
  const res = await api.get(`/feed/${id}/likes`)
  const data = parseLikersResponse(res.data)
  return { data, total: data.length }
}
