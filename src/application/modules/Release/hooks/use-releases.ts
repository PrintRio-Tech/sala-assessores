import { useQuery } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Release } from '@/domain/Release/release.entity'
import type { ReleaseListParams } from '@/domain/Release/release.repository'

export type { Release }

export function useReleases(params: ReleaseListParams = {}) {
  const query = useQuery({
    queryKey: queryKeys.releases.list(params),
    queryFn: () => releaseService.list(params),
  })

  return {
    data: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
