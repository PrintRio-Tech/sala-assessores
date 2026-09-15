import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand } from '@/domain/Demand/demand.entity'
import { DemandNotFoundError } from '@/domain/Demand/errors/demand.errors'
import { useLocalDemandStore } from '../stores/local-demand.store'

type SavePositioningOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useSavePositioning(demandId: string, options: SavePositioningOptions = {}) {
  const queryClient = useQueryClient()
  const isLocal = useLocalDemandStore((state) => state.records.some((record) => record.id === demandId))
  const mutation = useMutation({
    mutationFn: async (input: { body: string }): Promise<Demand | null> => {
      if (!isLocal) {
        return demandService.savePositioning(demandId, {
          body: input.body,
          author: currentUser.name,
        })
      }
      const record = useLocalDemandStore.getState().savePositioning(demandId, { body: input.body })
      if (!record) throw new DemandNotFoundError()
      return null
    },
    onSuccess: (demand) => {
      if (demand) queryClient.setQueryData(queryKeys.demand(demandId), demand)
      if (!isLocal) void queryClient.invalidateQueries({ queryKey: ['demands'] })
      options.onSuccess?.()
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    save: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
