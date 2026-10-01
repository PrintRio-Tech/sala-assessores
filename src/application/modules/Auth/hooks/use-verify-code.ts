import { useMutation, useQueryClient } from '@tanstack/react-query'

import { auth } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { MutationOptions } from '@/application/shared/mutation-options'
import type { VerifyCodeInput } from '@/domain/Auth/auth.repository'
import type { Session } from '@/domain/Auth/session.entity'

export function useVerifyCode(options: MutationOptions<Session> = {}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: VerifyCodeInput) => auth.service.verify(input),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.session(), session)
      options.onSuccess?.(session)
    },
    onError: (error) => options.onError?.(error),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    verify: mutation.mutate,
  }
}
