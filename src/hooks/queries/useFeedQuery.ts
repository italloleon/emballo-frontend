import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed, type FeedEntry } from '@/api/feed'
import { normalizeFeedEntry } from '@/lib/feedSocial'
import { queryKeys } from './keys'

const PAGE_SIZE_HINT = 20

export function useFeedQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: async ({ pageParam }) => {
      const res = await getFeed(pageParam)
      const { data, next_cursor, has_more } = res.data
      return {
        items: (Array.isArray(data) ? data : []).map(item => normalizeFeedEntry(item)) as FeedEntry[],
        nextCursor: next_cursor,
        hasMore: has_more,
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    meta: { pageSizeHint: PAGE_SIZE_HINT },
  })
}
