import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand, DemandOutcomePublished } from '@/domain/Demand/demand.entity'
import { DemandNotFoundError } from '@/domain/Demand/errors/demand.errors'
import { useLocalDemandStore } from '../stores/local-demand.store'

export type RegisterDemandOutcomeInput = {
  toneScore: number
  published: DemandOutcomePublished
  usageScore: number
  resultSummary: string
}

type RegisterDemandOutcomeOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useRegisterDemandOutcome(demandId: string, options: RegisterDemandOutcomeOptions = {}) {
  const queryClient = useQueryClient()
  const isLocal = useLocalDemandStore((state) => state.records.some((record) => record.id === demandId))
  const mutation = useMutation({
    mutationFn: async (input: RegisterDemandOutcomeInput): Promise<Demand | null> => {
      const authored = {
        ...input,
        recordedBy: currentUser.name,
        recordedAt: new Date(),
      }
      if (!isLocal) return demandService.registerOutcome(demandId, authored)
      const record = useLocalDemandStore.getState().registerOutcome(demandId, authored)
      if (!record) throw new DemandNotFoundError()
      return null
    },
    onSuccess: (demand) => {
      if (demand) queryClient.setQueryData(queryKeys.demand(demandId), demand)
      if (!isLocal) {
        void queryClient.invalidateQueries({ queryKey: ['demands'] })
        void queryClient.invalidateQueries({ queryKey: queryKeys.demand(demandId) })
      }
      options.onSuccess?.()
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    register: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
