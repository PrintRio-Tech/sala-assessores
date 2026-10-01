import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand, DemandOutcomePublished } from '@/domain/Demand/demand.entity'
import { DemandNotFoundError } from '@/domain/Demand/errors/demand.errors'

export type RegisterDemandOutcomeInput = {
  toneScore: number
  published: DemandOutcomePublished
  usageScore: number | null
  resultSummary: string
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
    mutationFn: async (input: RegisterDemandOutcomeInput): Promise<Demand> => {
      const demandId = input.demandId ?? defaultDemandId
      if (!demandId) throw new DemandNotFoundError()
      return demandService.registerOutcome(demandId, {
        toneScore: input.toneScore,
        published: input.published,
        usageScore: input.usageScore,
        resultSummary: input.resultSummary,
        recordedBy: currentUser.name,
        recordedAt: new Date(),
      })
    },
    onSuccess: (demand, input) => {
      const demandId = demand.id ?? input.demandId ?? defaultDemandId
      queryClient.setQueryData(queryKeys.demand(demandId), demand)
      void queryClient.invalidateQueries({ queryKey: ['demands'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.pressRoomReport })
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
