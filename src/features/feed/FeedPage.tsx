import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import { PullToRefresh } from '@/components/PullToRefresh'
import { getFeed, type FeedEntry, type PostEntry } from '@/api/feed'
import { FeedItemCard } from './FeedItemCard'
import { PostComposer } from './PostComposer'

function SkeletonCard() {
  return (
    <div className="bg-bg-800 border border-bg-600 rounded-xl p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-bg-700 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 bg-bg-700 rounded w-1/3" />
          <div className="h-2 bg-bg-700 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-bg-700 rounded w-full" />
        <div className="h-2.5 bg-bg-700 rounded w-4/5" />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedEntry[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  const loadInitialFeed = useCallback(async () => {
    const res = await getFeed()
    const { data, next_cursor, has_more } = res.data
    setItems(Array.isArray(data) ? data : [])
    setCursor(next_cursor)
    setHasMore(has_more)
    setError(null)
  }, [])

  const handleRefresh = useCallback(async () => {
    await loadInitialFeed()
  }, [loadInitialFeed])

  // Initial load
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await loadInitialFeed()
      } catch {
        if (!cancelled) setError('Não foi possível carregar o feed.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [loadInitialFeed])

  // Infinite scroll via IntersectionObserver — only active after initial load
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || loading) return

    async function doLoadMore() {
      if (loadingMoreRef.current || !hasMore) return
      loadingMoreRef.current = true
      setLoadingMore(true)
      try {
        const res = await getFeed(cursor ?? undefined)
        const { data, next_cursor, has_more } = res.data
        setItems(prev => [...prev, ...(Array.isArray(data) ? data : [])])
        setCursor(next_cursor)
        setHasMore(has_more)
      } finally {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) doLoadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [cursor, hasMore, loading])

  function handleNewPost(post: PostEntry) {
    setItems(prev => [post, ...prev])
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function handlePin(id: string, newPinned: boolean) {
    setItems(prev =>
      prev.map(item =>
        item.id === id && item.kind === 'post' ? { ...item, pinned: newPinned } : item
      )
    )
  }

  function handleLikeToggle(id: string, likes_count: number, liked_by_me: boolean) {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, likes_count, liked_by_me } : item
      )
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
      <div className="space-y-4 w-full max-w-sm md:max-w-2xl mx-auto pb-4">
        <div className="flex items-center gap-2">
        <Activity size={20} className="text-ember" />
        <h1
          className="text-2xl font-black uppercase text-txt"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          Feed da Academia
        </h1>
        </div>

        <PostComposer onPost={handleNewPost} />

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🏋️</span>
            <p className="text-sm font-medium text-txt-dim">Nenhuma atividade ainda.</p>
            <p className="text-xs text-txt-faint mt-1">
              O feed será atualizado conforme os alunos treinarem!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <FeedItemCard
                key={item.id}
                entry={item}
                onDelete={handleDelete}
                onPin={handlePin}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-ember border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !hasMore && items.length > 0 && (
          <p className="text-center text-xs text-txt-faint py-4">Chegou ao fim do feed</p>
        )}
      </div>
    </PullToRefresh>
  )
}
