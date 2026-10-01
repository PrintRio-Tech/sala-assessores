import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@print/ui'
import type { PropsWithChildren } from 'react'

export function AuthTestProviders({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={client}>
      <Toaster>{children}</Toaster>
    </QueryClientProvider>
  )
}
