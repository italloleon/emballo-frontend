import { useRef, useState } from 'react'
import { Heart, MoreHorizontal, Pin, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/store/auth'
import { type FeedEntry, type EventType, deletePost, pinPost, toggleLike, getLikers } from '@/api/feed'
import { getInitials } from '@/lib/utils'
import { parseLikedByMe, parseLikesCount } from '@/lib/feedSocial'
import { env } from '@/lib/env'
import { CheerButton } from './CheerButton'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

const EVENT_CONFIG: Record<
  EventType,
  { emoji: string; accent: string; message: (p: Record<string, unknown>) => string }
> = {
  check_in: {
    emoji: '🏋️',
    accent: 'border-l-ember',
    message: p => `${p.name} fez check-in!`,
  },
  streak_milestone: {
    emoji: '🔥',
    accent: 'border-l-gold',
    message: p => `${p.name} atingiu ${p.streak} dias seguidos!`,
  },
  prize_won: {
    emoji: '🏆',
    accent: 'border-l-gold',
    message: p => `${p.name} ganhou ${p.prize}!`,
  },
  member_joined: {
    emoji: '👋',
    accent: 'border-l-bg-600',
    message: p => `${p.name} entrou na academia!`,
  },
}

interface FeedItemCardProps {
  entry: FeedEntry
  onDelete: (id: string) => void
  onPin: (id: string, newPinned: boolean) => void
  onLikeToggle: (id: string, likes_count: number, liked_by_me: boolean) => void
}

function LikeBar({
  entryId,
  initialLikedByMe,
  initialLikesCount,
  onLikeToggle,
}: {
  entryId: string
  initialLikedByMe: boolean
  initialLikesCount: number
  onLikeToggle: (id: string, likes_count: number, liked_by_me: boolean) => void
}) {
  const [likedByMe, setLikedByMe] = useState(() => parseLikedByMe(initialLikedByMe))
  const [likesCount, setLikesCount] = useState(() => parseLikesCount(initialLikesCount))
  const [animationKey, setAnimationKey] = useState(0)

  // Likers modal state
  const [likersOpen, setLikersOpen] = useState(false)
  const [likers, setLikers] = useState<{ user_id: string; name: string }[]>([])
  const [likersLoading, setLikersLoading] = useState(false)
  const inFlightRef = useRef(false)

  async function handleHeartClick() {
    if (inFlightRef.current) return
    inFlightRef.current = true

    const prevLiked = likedByMe
    const prevCount = parseLikesCount(likesCount)
    const nextLiked = !prevLiked
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1)

    setLikedByMe(nextLiked)
    setLikesCount(nextCount)
    setAnimationKey(k => k + 1)

    try {
      const result = await toggleLike(entryId)
      setLikesCount(result.likes_count)
      setLikedByMe(result.liked)
      onLikeToggle(entryId, result.likes_count, result.liked)
    } catch {
      setLikedByMe(prevLiked)
      setLikesCount(prevCount)
      onLikeToggle(entryId, prevCount, prevLiked)
    } finally {
      inFlightRef.current = false
    }
  }

  async function handleCountClick() {
    setLikersOpen(true)
    setLikersLoading(true)
    try {
      const { data } = await getLikers(entryId)
      setLikers(data)
    } catch {
      setLikers([])
    } finally {
      setLikersLoading(false)
    }
  }

  const displayCount = parseLikesCount(likesCount)
  const showCount = displayCount > 0 || likedByMe

  if (!env.enableSocial) return null

  return (
    <>
      <div className="border-t border-bg-700 px-4 py-2 flex items-center gap-2">
        <button
          onClick={handleHeartClick}
          className="flex items-center gap-1.5 focus:outline-none"
          aria-label={likedByMe ? 'Descurtir' : 'Curtir'}
        >
          <span key={animationKey} className={animationKey > 0 ? 'like-pop' : ''}>
            <Heart
              size={15}
              className={likedByMe ? 'fill-ember text-ember' : 'text-txt-faint'}
            />
          </span>
        </button>
        {showCount && (
          <button
            onClick={handleCountClick}
            className="text-xs text-txt-faint hover:text-txt transition-colors leading-none"
          >
            {displayCount}
          </button>
        )}
      </div>

      <Modal open={likersOpen} onClose={() => setLikersOpen(false)} title="Curtidas">
        {likersLoading ? (
          <div className="w-5 h-5 border-2 border-ember border-t-transparent rounded-full animate-spin mx-auto" />
        ) : likers.length === 0 ? (
          <p className="text-sm text-txt-faint text-center py-4">Nenhuma curtida ainda</p>
        ) : (
          <div className="space-y-3">
            {likers.map(liker => (
              <div key={liker.user_id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ember/10 border border-ember/30 flex items-center justify-center text-xs font-bold text-ember shrink-0">
                  {getInitials(liker.name)}
                </div>
                <span className="text-sm text-txt">{liker.name}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}

export function FeedItemCard({ entry, onDelete, onPin, onLikeToggle }: FeedItemCardProps) {
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const canManage = user?.role === 'admin' || user?.role === 'instructor'

  if (entry.kind === 'event') {
    const config = EVENT_CONFIG[entry.type]
    return (
      <div className={`flex flex-col bg-bg-800 border border-bg-600 border-l-2 ${config.accent} rounded-xl overflow-hidden`}>
        <div className="flex gap-3 p-4">
          <span className="text-lg shrink-0 mt-0.5">{config.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-txt">{config.message(entry.payload)}</p>
            <p className="text-xs text-txt-faint mt-1">{formatRelative(entry.created_at)}</p>
          </div>
        </div>
        {entry.type === 'check_in' &&
          env.enableSocial &&
          typeof entry.payload.user_id === 'string' && (
            <div className="px-4 pb-2">
              <CheerButton
                targetUserId={entry.payload.user_id}
                targetUserName={String(entry.payload.name ?? '')}
              />
            </div>
          )}
        <LikeBar
          entryId={entry.id}
          initialLikedByMe={parseLikedByMe(entry.liked_by_me)}
          initialLikesCount={parseLikesCount(entry.likes_count)}
          onLikeToggle={onLikeToggle}
        />
      </div>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          {entry.pinned && (
            <span className="inline-flex items-center gap-1 text-xs text-gold mb-1">
              <Pin size={11} />
              Fixado
            </span>
          )}
          <p className="text-sm font-semibold text-txt">{entry.author.name}</p>
          <p className="text-xs text-txt-faint">{formatRelative(entry.created_at)}</p>
        </div>
        {canManage && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-lg text-txt-faint hover:text-txt hover:bg-bg-700 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-bg-700 border border-bg-600 rounded-xl shadow-lg py-1 w-36">
                  {user?.role === 'admin' && (
                    <button
                      onClick={async () => {
                        setMenuOpen(false)
                        await pinPost(entry.id)
                        onPin(entry.id, !entry.pinned)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-txt-dim hover:text-txt hover:bg-bg-600 transition-colors"
                    >
                      <Pin size={14} />
                      {entry.pinned ? 'Desafixar' : 'Fixar'}
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setMenuOpen(false)
                      await deletePost(entry.id)
                      onDelete(entry.id)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="px-4 pb-4 text-sm text-txt whitespace-pre-wrap leading-relaxed">{entry.body}</p>

      {entry.media.length > 0 && (
        <div
          className={`grid gap-0.5 border-t border-bg-600 ${entry.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          {entry.media.slice(0, 4).map((m, i) => (
            <div key={i} className="aspect-square bg-bg-700 overflow-hidden">
              {m.media_type === 'image' ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" muted playsInline />
              )}
            </div>
          ))}
        </div>
      )}

      <LikeBar
        entryId={entry.id}
        initialLikedByMe={parseLikedByMe(entry.liked_by_me)}
        initialLikesCount={parseLikesCount(entry.likes_count)}
        onLikeToggle={onLikeToggle}
      />
    </Card>
  )
}
