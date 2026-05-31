import { unwrapList, unwrapResource } from '@/lib/utils'

export const HEART_REACTION = 'heart'

export interface LikeToggleResult {
  liked: boolean
  likes_count: number
}

export interface FeedLiker {
  user_id: string
  name: string
}

export interface FeedReactionsFields {
  reactions_summary?: Record<string, number>
  reactions_total?: number
  my_reaction?: string | null
}

/** Coerce feed like counts — API may omit or null the field on new posts. */
export function parseLikesCount(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function parseLikedByMe(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function parseHeartCountFromSummary(summary: unknown): number {
  if (!summary || typeof summary !== 'object') return 0
  const row = summary as Record<string, unknown>
  return parseLikesCount(row[HEART_REACTION])
}

export function parseLikedHeartFromReaction(reaction: unknown): boolean {
  return reaction === HEART_REACTION
}

/**
 * Maps reactions API fields onto legacy heart like fields used by the UI.
 * Feed index returns reactions_summary / my_reaction, not likes_count / liked_by_me.
 */
export function normalizeFeedEntry<T extends FeedReactionsFields & { likes_count?: number; liked_by_me?: boolean }>(
  item: T
): T & { likes_count: number; liked_by_me: boolean } {
  const heartCount = parseHeartCountFromSummary(item.reactions_summary)
  const hasReactionsSummary = item.reactions_summary != null
  const hasMyReaction = item.my_reaction !== undefined

  return {
    ...item,
    likes_count: hasReactionsSummary ? heartCount : parseLikesCount(item.likes_count),
    liked_by_me: hasMyReaction
      ? parseLikedHeartFromReaction(item.my_reaction)
      : parseLikedByMe(item.liked_by_me),
  }
}

/**
 * Normalizes POST /feed/:id/like (and reaction alias) responses.
 * Backend `likes_count` is reactions_total; the heart button needs summary.heart.
 */
export function parseLikeToggleResponse(payload: unknown): LikeToggleResult {
  const raw = unwrapResource<Record<string, unknown>>(payload)

  const liked =
    parseLikedByMe(raw.liked) ||
    parseLikedHeartFromReaction(raw.reaction) ||
    parseLikedHeartFromReaction(raw.my_reaction)

  const likes_count =
    raw.reactions_summary != null
      ? parseHeartCountFromSummary(raw.reactions_summary)
      : parseLikesCount(raw.likes_count ?? raw.likesCount)

  return { liked, likes_count }
}

/** Normalizes GET /feed/:id/likes (reactions list alias). */
export function parseLikersResponse(payload: unknown): FeedLiker[] {
  const raw = unwrapResource<Record<string, unknown>>(payload)
  const list = unwrapList<Record<string, unknown>>(raw.data ?? raw)

  return list.map(row => ({
    user_id: String(row.user_id ?? row.id ?? ''),
    name: String(row.name ?? row.user_name ?? ''),
  }))
}

export function parseLikersTotal(payload: unknown): number {
  const raw = unwrapResource<Record<string, unknown>>(payload)
  const meta = raw.meta as Record<string, unknown> | undefined
  if (meta?.total != null) return parseLikesCount(meta.total)
  return parseLikersResponse(payload).length
}
