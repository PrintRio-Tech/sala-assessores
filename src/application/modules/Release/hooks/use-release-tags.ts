import { useQuery } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'

export function useReleaseTags(search?: string) {
  const query = useQuery({
    queryKey: queryKeys.releases.tags(search),
    queryFn: () => releaseService.listTags(search),
  })

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
