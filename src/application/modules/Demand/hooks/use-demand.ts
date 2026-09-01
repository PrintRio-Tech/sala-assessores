import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { useLocalDemandStore } from '../stores/local-demand.store'

export function useDemand(id: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.demand(id ?? ''),
    queryFn: () => demandService.getById(id!),
    enabled: Boolean(id),
  })
  const localRecord = useLocalDemandStore((state) => state.records.find((record) => record.id === id))

  return {
    data: localRecord ?? query.data ?? null,
    isLoading: localRecord ? false : query.isLoading,
    localRecord,
    error: query.error,
    reload: query.refetch,
  }
}
