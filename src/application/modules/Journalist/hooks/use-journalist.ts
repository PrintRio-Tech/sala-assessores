import { useQuery } from '@tanstack/react-query'

import { journalistService } from '@/application/composition'
import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { buildJournalistProfileViewModel } from '../presentation/journalist-profile.viewmodel'

export type { JournalistDemandHistoryItem, RelationshipEvaluation } from '@/domain/Journalist/journalist.entity'

export function useJournalist(id: string | undefined) {
  const journalistQuery = useQuery({
    queryKey: queryKeys.journalist(id ?? ''),
    queryFn: () => journalistService.getById(id!),
    enabled: Boolean(id),
  })
  const demandsQuery = useQuery({
    queryKey: queryKeys.demands({ lifecycle: 'all' }),
    queryFn: () => demandService.list({ lifecycle: 'all' }),
    enabled: Boolean(id),
  })
  const data = journalistQuery.data
    ? buildJournalistProfileViewModel(journalistQuery.data, demandsQuery.data?.items ?? [])
    : null

  return {
    data,
    isLoading: journalistQuery.isLoading || demandsQuery.isLoading,
    error: journalistQuery.error ?? demandsQuery.error,
    reload: async () => {
      const [journalistResult] = await Promise.all([
        journalistQuery.refetch(),
        demandsQuery.refetch(),
      ])
      return journalistResult
    },
  }
}
