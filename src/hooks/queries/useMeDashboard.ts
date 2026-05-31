import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/users'
import { parseMeDashboard, type MeDashboard } from '@/lib/meDashboard'
import { queryKeys } from './keys'

export function useMeDashboard() {
  return useQuery({
    queryKey: queryKeys.meDashboard,
    queryFn: async (): Promise<MeDashboard> => {
      const { data } = await getMe()
      return parseMeDashboard(data as Record<string, unknown>)
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
