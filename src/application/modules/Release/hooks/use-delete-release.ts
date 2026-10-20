import { useMutation, useQueryClient } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { MutationOptions } from '@/application/shared/mutation-options'

export function useDeleteRelease(options: MutationOptions<void> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => releaseService.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all })
      queryClient.removeQueries({ queryKey: queryKeys.releases.detail(id) })
      options.onSuccess?.()
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    remove: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
