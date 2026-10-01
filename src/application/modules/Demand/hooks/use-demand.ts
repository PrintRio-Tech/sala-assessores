import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'

export function useDemand(id: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.demand(id ?? ''),
    queryFn: () => demandService.getById(id!),
    enabled: Boolean(id),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
