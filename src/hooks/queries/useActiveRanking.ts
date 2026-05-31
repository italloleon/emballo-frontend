import { useQuery } from '@tanstack/react-query'
import { getActiveRanking } from '@/api/leagues'
import { queryKeys } from './keys'

export interface RankEntry {
  rank: number
  student_id: string
  name: string
  total_points: number
}

function normalizeRanking(data: unknown): RankEntry[] {
  if (Array.isArray(data)) return data as RankEntry[]
  const wrapped = data as { data?: RankEntry[] } | null | undefined
  return wrapped?.data ?? []
}

export function useActiveRanking() {
  return useQuery({
    queryKey: queryKeys.activeRanking,
    queryFn: async () => {
      const { data } = await getActiveRanking()
      return normalizeRanking(data)
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
