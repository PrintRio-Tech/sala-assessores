import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand } from '@/domain/Demand/demand.entity'
import { EXTERNAL_INTERACTION_RESULT_RULES, getExternalInteractionFieldErrors } from '@/domain/Demand/demand.entity'
import type { RegisterExternalInteractionInput } from '@/domain/Demand/demand.repository'
import { DemandNotFoundError } from '@/domain/Demand/errors/demand.errors'
import { useLocalDemandStore } from '../stores/local-demand.store'

export type RegisterInteractionInput = Omit<RegisterExternalInteractionInput, 'recordedBy'>
export const interactionResultRules = EXTERNAL_INTERACTION_RESULT_RULES
export const validateInteractionResultFields = getExternalInteractionFieldErrors

export function interactionClosesCase(result: RegisterInteractionInput['result'] | '') {
  return result === 'response_sent' || result === 'closed_without_send'
}

type RegisterInteractionOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useRegisterInteraction(demandId: string, options: RegisterInteractionOptions = {}) {
  const queryClient = useQueryClient()
  const isLocal = useLocalDemandStore((state) => state.records.some((record) => record.id === demandId))
  const mutation = useMutation({
    mutationFn: async (input: RegisterInteractionInput): Promise<Demand | null> => {
      const authoredInput: RegisterExternalInteractionInput = { ...input, recordedBy: currentUser.name }
      if (!isLocal) return demandService.registerInteraction(demandId, authoredInput)
      const record = useLocalDemandStore.getState().registerInteraction(demandId, authoredInput)
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
    register: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
