import { useState } from 'react'

type LoginOptions = {
  onSuccess?: (email: string) => void
  onError?: (error: Error) => void
}

export function useLogin(options: LoginOptions = {}) {
  const [isPending, setIsPending] = useState(false)

  return {
    isPending,
    login(email: string) {
      setIsPending(true)
      window.setTimeout(() => {
        setIsPending(false)
        options.onSuccess?.(email)
      }, 800)
    },
  }
}
