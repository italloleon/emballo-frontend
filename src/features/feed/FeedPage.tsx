import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { PullToRefresh } from '@/components/PullToRefresh'
import { type FeedEntry, type PostEntry } from '@/api/feed'
import { FeedItemCard } from './FeedItemCard'
import { PostComposer } from './PostComposer'
import { useFeedQuery } from '@/hooks/queries/useFeedQuery'
import { queryKeys } from '@/hooks/queries/keys'
import { parseLikedByMe, parseLikesCount } from '@/lib/feedSocial'

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
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useFeedQuery()

  const items = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || isLoading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage().catch(() => {
            setLoadMoreError('Não foi possível carregar mais publicações.')
          })
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading])

  const handleRefresh = useCallback(async () => {
    setLoadMoreError(null)
    await queryClient.invalidateQueries({ queryKey: queryKeys.feed })
    await refetch()
  }, [queryClient, refetch])

  function handleNewPost(post: PostEntry) {
    queryClient.setQueryData(queryKeys.feed, (old: typeof data) => {
      if (!old) {
        return {
          pages: [{ items: [post], nextCursor: null, hasMore: false }],
          pageParams: [undefined],
        }
      }
      return {
        ...old,
        pages: old.pages.map((page, index) =>
          index === 0 ? { ...page, items: [post, ...page.items] } : page
        ),
      }
    })
  }

  function handleDelete(id: string) {
    queryClient.setQueryData(queryKeys.feed, (old: typeof data) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          items: page.items.filter(item => item.id !== id),
        })),
      }
    })
  }

  function handlePin(id: string, newPinned: boolean) {
    queryClient.setQueryData(queryKeys.feed, (old: typeof data) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          items: page.items.map(item =>
            item.id === id && item.kind === 'post' ? { ...item, pinned: newPinned } : item
          ),
        })),
      }
    })
  }

  function handleLikeToggle(id: string, likes_count: number, liked_by_me: boolean) {
    const heartCount = parseLikesCount(likes_count)
    const liked = parseLikedByMe(liked_by_me)

    queryClient.setQueryData(queryKeys.feed, (old: typeof data) => {
      if (!old) return old
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          items: page.items.map(item =>
            item.id === id
              ? {
                  ...item,
                  likes_count: heartCount,
                  liked_by_me: liked,
                  my_reaction: liked ? 'heart' : null,
                  reactions_summary: {
                    ...(item.reactions_summary ?? { heart: 0, halter: 0, fire: 0 }),
                    heart: heartCount,
                  },
                }
              : item
          ),
        })),
      }
    })
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={isLoading}>
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

        {isError && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-sm text-danger">
            Não foi possível carregar o feed.
          </div>
        )}

        {isLoading ? (
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
            {items.map((item: FeedEntry) => (
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

        {loadMoreError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-center text-sm text-danger">
            {loadMoreError}
            <button
              type="button"
              className="ml-2 text-ember underline"
              onClick={() => {
                setLoadMoreError(null)
                void fetchNextPage()
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-ember border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !hasNextPage && items.length > 0 && (
          <p className="text-center text-xs text-txt-faint py-4">Chegou ao fim do feed</p>
        )}
      </div>
    </PullToRefresh>
  )
}
