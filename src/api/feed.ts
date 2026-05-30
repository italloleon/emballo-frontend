import api from './client'

export type EventType = 'check_in' | 'streak_milestone' | 'prize_won' | 'member_joined'

export interface EventEntry {
  id: string
  kind: 'event'
  type: EventType
  payload: Record<string, unknown>
  created_at: string
  likes_count: number
  liked_by_me: boolean
}

export interface PostEntry {
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

export const createPost = (data: { body: string; pinned?: boolean }) =>
  api.post<PostEntry>('/feed/posts', data)

export const deletePost = (id: string) =>
  api.delete(`/feed/posts/${id}`)

export const pinPost = (id: string) =>
  api.put(`/feed/posts/${id}/pin`)

export const toggleLike = (id: string) =>
  api.post<{ liked: boolean; likes_count: number }>(`/feed/${id}/like`)

export const getLikers = (id: string) =>
  api.get<{ data: { user_id: string; name: string }[]; meta: { total: number } }>(`/feed/${id}/likes`)
