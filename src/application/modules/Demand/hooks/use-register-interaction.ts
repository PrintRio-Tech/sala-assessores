import { useMutation, useQueryClient } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { Demand } from '@/domain/Demand/demand.entity'
import { EXTERNAL_INTERACTION_RESULT_RULES, getExternalInteractionFieldErrors } from '@/domain/Demand/demand.entity'
import type { RegisterExternalInteractionInput } from '@/domain/Demand/demand.repository'

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
  const mutation = useMutation({
    mutationFn: (input: RegisterInteractionInput): Promise<Demand> => {
      return demandService.registerInteraction(demandId, { ...input, recordedBy: currentUser.name })
    },
    onSuccess: (demand) => {
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
