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
  usageScore: number | null
  resultSummary: string
  /** Quando omitido, usa o `demandId` passado ao hook. */
  demandId?: string
}

type RegisterDemandOutcomeOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useRegisterDemandOutcome(
  defaultDemandId: string = '',
  options: RegisterDemandOutcomeOptions = {},
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (input: RegisterDemandOutcomeInput): Promise<Demand | null> => {
      const demandId = input.demandId ?? defaultDemandId
      if (!demandId) throw new DemandNotFoundError()
      const authored = {
        toneScore: input.toneScore,
        published: input.published,
        usageScore: input.usageScore,
        resultSummary: input.resultSummary,
        recordedBy: currentUser.name,
        recordedAt: new Date(),
      }
      const isLocal = useLocalDemandStore.getState().records.some((record) => record.id === demandId)
      if (!isLocal) return demandService.registerOutcome(demandId, authored)
      const record = useLocalDemandStore.getState().registerOutcome(demandId, authored)
      if (!record) throw new DemandNotFoundError()
      return null
    },
    onSuccess: (demand, input) => {
      const demandId = demand?.id ?? input.demandId ?? defaultDemandId
      if (demand) queryClient.setQueryData(queryKeys.demand(demandId), demand)
      void queryClient.invalidateQueries({ queryKey: ['demands'] })
      if (demandId) void queryClient.invalidateQueries({ queryKey: queryKeys.demand(demandId) })
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
