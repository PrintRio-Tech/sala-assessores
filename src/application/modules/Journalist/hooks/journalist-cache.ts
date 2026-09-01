import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { Paginated } from '@/domain/Journalist/journalist.repository'

export function updateJournalistCache(queryClient: QueryClient, journalist: Journalist): void {
  queryClient.setQueryData(queryKeys.journalist(journalist.id), journalist)
  queryClient.setQueryData<Paginated<Journalist>>(
    queryKeys.journalists,
    (current) => current
      ? {
          ...current,
          items: current.items.map((item) => item.id === journalist.id ? journalist : item),
        }
      : undefined,
  )
}
