import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { releaseService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { MutationOptions } from '@/application/shared/mutation-options'
import type { Release } from '@/domain/Release/release.entity'
import { ReleaseNotFoundError } from '@/domain/Release/errors/release.errors'
import type { RecipientImportPreview } from '@/domain/Release/release.repository'

export function useReleaseRecipientTemplate() {
  const query = useQuery({
    queryKey: queryKeys.releases.template,
    queryFn: () => releaseService.getRecipientImportTemplate(),
  })

  return {
    template: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function usePreviewReleaseRecipientImport(options: MutationOptions<RecipientImportPreview> = {}) {
  const mutation = useMutation({
    mutationFn: (input: { releaseId: string; filename: string; contentBase64: string }) =>
      releaseService.previewRecipientImport(input),
    onSuccess: (preview) => options.onSuccess?.(preview),
    onError: (error) => options.onError?.(error),
  })

  return {
    preview: mutation.mutate,
    isPending: mutation.isPending,
    data: mutation.data ?? null,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useCommitReleaseRecipientImport(options: MutationOptions<Release> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ releaseId, filename, contentBase64 }: { releaseId: string; filename: string; contentBase64: string }) => {
      const release = await releaseService.commitRecipientImport(releaseId, { filename, contentBase64 })
      if (!release) throw new ReleaseNotFoundError()
      return release
    },
    onSuccess: (release) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.releases.all })
      queryClient.setQueryData(queryKeys.releases.detail(release.id), release)
      options.onSuccess?.(release)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    commit: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
