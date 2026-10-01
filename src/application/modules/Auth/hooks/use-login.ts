import { useMutation } from '@tanstack/react-query'

import { auth } from '@/application/composition'
import type { MutationOptions } from '@/application/shared/mutation-options'
import { normalizeEmail } from '@/domain/Auth/user.entity'

export function useLogin(options: MutationOptions<string> = {}) {
  const mutation = useMutation({
    mutationFn: async (email: string) => {
      await auth.service.requestMagicLink(email)
      return normalizeEmail(email)
    },
    onSuccess: (email) => options.onSuccess?.(email),
    onError: (error) => options.onError?.(error),
  })

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    login: mutation.mutate,
  }
}
