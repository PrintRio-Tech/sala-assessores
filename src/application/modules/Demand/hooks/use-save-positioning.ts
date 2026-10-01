import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand, PositioningAttachment } from '@/domain/Demand/demand.entity'

type SavePositioningOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useSavePositioning(demandId: string, options: SavePositioningOptions = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: { body: string; attachment?: PositioningAttachment | null }): Promise<Demand> => {
      return demandService.savePositioning(demandId, {
        body: input.body,
        author: currentUser.name,
        attachment: input.attachment ?? null,
      })
    },
    onSuccess: (demand) => {
      queryClient.setQueryData(queryKeys.demand(demandId), demand)
      void queryClient.invalidateQueries({ queryKey: ['demands'] })
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
