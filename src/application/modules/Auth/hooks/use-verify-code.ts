import { useState } from 'react'

import { mockAuthService } from '@/application/services/mock-auth-service'

type VerifyCodeOptions = {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useVerifyCode(options: VerifyCodeOptions = {}) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  return {
    isPending,
    error,
    verify(input: { code: string; email: string }) {
      setIsPending(true)
      setError(null)
      window.setTimeout(() => {
        if (!mockAuthService.verifyCode(input.code)) {
          const nextError = new Error('Código inválido. Tente 123456')
          setError(nextError)
          setIsPending(false)
          options.onError?.(nextError)
          return
        }
        mockAuthService.setAuthenticated(true, input.email)
        setIsPending(false)
        options.onSuccess?.()
      }, 600)
    },
  }
}
