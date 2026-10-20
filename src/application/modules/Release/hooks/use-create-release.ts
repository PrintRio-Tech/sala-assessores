import { useMutation, useQueryClient } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { currentUser } from '@/application/current-user'
import type { MutationOptions } from '@/application/shared/mutation-options'
import type { Release } from '@/domain/Release/release.entity'
import type { NewRelease } from '@/domain/Release/release.repository'

export function useCreateRelease(options: MutationOptions<Release> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: Omit<NewRelease, 'authorUserId' | 'authorName'> & Partial<Pick<NewRelease, 'authorUserId' | 'authorName'>>) =>
      releaseService.create({
        ...input,
        authorUserId: input.authorUserId || currentUser.id,
        authorName: input.authorName || currentUser.name,
      }),
    onSuccess: (release) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all })
      queryClient.setQueryData(queryKeys.releases.detail(release.id), release)
      options.onSuccess?.(release)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    create: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
