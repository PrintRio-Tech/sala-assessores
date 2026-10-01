import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'

export function useDemandResponsibles() {
  const query = useQuery({
    queryKey: queryKeys.demandResponsibles,
    queryFn: () => demandService.listResponsibles(),
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
