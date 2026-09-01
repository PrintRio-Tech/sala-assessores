import { useMutation, useQueryClient } from '@tanstack/react-query'

import { journalistService } from '@/application/composition'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { UpdateJournalistInput } from '@/domain/Journalist/journalist.repository'
import { updateJournalistCache } from './journalist-cache'

export type EditableJournalistProfile = UpdateJournalistInput

type UpdateJournalistOptions = {
  onSuccess?: (journalist: Journalist) => void
  onError?: (error: Error) => void
}

export function useUpdateJournalist(id: string, options: UpdateJournalistOptions = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: EditableJournalistProfile) => journalistService.update(id, input),
    onSuccess: (journalist) => {
      updateJournalistCache(queryClient, journalist)
      options.onSuccess?.(journalist)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    update: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
