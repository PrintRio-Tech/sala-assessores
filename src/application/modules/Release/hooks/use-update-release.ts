import { useMutation, useQueryClient } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { MutationOptions } from '@/application/shared/mutation-options'
import type { Release } from '@/domain/Release/release.entity'
import type { ReleaseUpdate } from '@/domain/Release/release.repository'

export function useUpdateRelease(options: MutationOptions<Release> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, input, journalistIds }: { id: string; input: ReleaseUpdate; journalistIds: string[] }) =>
      releaseService.update(id, input, journalistIds),
    onSuccess: (release) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all })
      queryClient.setQueryData(queryKeys.releases.detail(release.id), release)
      options.onSuccess?.(release)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    update: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
