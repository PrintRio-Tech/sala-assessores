import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { DemandListParams } from '@/domain/Demand/demand.repository'
import type { Demand } from '@/domain/Demand/demand.entity'

export type DemandListItem = Demand

export function useDemands(params: DemandListParams = {}) {
  const query = useQuery({
    queryKey: queryKeys.demands(params),
    queryFn: () => demandService.list(params),
  })
  const data = query.data?.items ?? []

  return {
    data,
    total: query.data?.total ?? data.length,
    activeCount: query.data?.activeCount ?? 0,
    historyCount: query.data?.historyCount ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
