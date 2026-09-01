import { useMutation, useQueryClient } from '@tanstack/react-query'

import { journalistService } from '@/application/composition'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { NewRelationshipEvaluation } from '@/domain/Journalist/journalist.repository'
import { updateJournalistCache } from './journalist-cache'

export type RelationshipEvaluationInput = NewRelationshipEvaluation

type RegisterRelationshipEvaluationOptions = {
  onSuccess?: (journalist: Journalist) => void
  onError?: (error: Error) => void
}

export function useRegisterRelationshipEvaluation(
  id: string,
  options: RegisterRelationshipEvaluationOptions = {},
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: RelationshipEvaluationInput) => journalistService.registerEvaluation(id, input),
    onSuccess: (journalist) => {
      updateJournalistCache(queryClient, journalist)
      options.onSuccess?.(journalist)
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
