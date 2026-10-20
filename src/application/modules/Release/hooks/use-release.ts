import { useQuery } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { ReleaseNotFoundError } from '@/domain/Release/errors/release.errors'

type UseReleaseOptions = {
  enabled?: boolean
}

export function useRelease(id: string | null, options: UseReleaseOptions = {}) {
  const query = useQuery({
    queryKey: queryKeys.releases.detail(id ?? ''),
    queryFn: async () => {
      try {
        return await releaseService.getById(id!)
      } catch (error) {
        if (error instanceof ReleaseNotFoundError) return null
        throw error
      }
    },
    enabled: (options.enabled ?? true) && id != null,
  })

  return {
    release: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
