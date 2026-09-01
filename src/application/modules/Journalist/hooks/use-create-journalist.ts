import { useMutation, useQueryClient } from '@tanstack/react-query'

import { journalistService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type {
  CreateJournalistInput,
  Paginated,
} from '@/domain/Journalist/journalist.repository'

export type NewJournalistInput = CreateJournalistInput

type CreateJournalistOptions = {
  onSuccess?: (journalist: Journalist) => void
  onError?: (error: Error) => void
}

export function useCreateJournalist(options: CreateJournalistOptions = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: NewJournalistInput) => journalistService.create(input),
    onSuccess: (journalist) => {
      queryClient.setQueryData<Paginated<Journalist>>(
        queryKeys.journalists,
        (current) => ({
          items: [journalist, ...(current?.items ?? [])],
          total: (current?.total ?? 0) + 1,
        }),
      )
      queryClient.setQueryData(queryKeys.journalist(journalist.id), journalist)
      options.onSuccess?.(journalist)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    create: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
