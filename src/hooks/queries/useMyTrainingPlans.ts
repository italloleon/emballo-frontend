import { useQuery } from '@tanstack/react-query'
import { getMyTrainingPlans } from '@/api/exercises'
import { unwrapList } from '@/lib/utils'
import { queryKeys } from './keys'

export function useMyTrainingPlans() {
  return useQuery({
    queryKey: queryKeys.myTrainingPlans,
    queryFn: async () => {
      const { data } = await getMyTrainingPlans()
      return unwrapList<{ name: string }>(data)
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}
