import { useQuery, useQueryClient } from '@tanstack/react-query'

import { auth } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import { SessionUnavailableError } from '@/domain/Auth/errors/auth.errors'

export function useSession() {
  const queryClient = useQueryClient()
  const hasToken = auth.service.hasStoredToken()

  const query = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: () => auth.service.getSession(),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const session = query.data ?? null
  const isUnavailable = query.error instanceof SessionUnavailableError
  const isChecking = hasToken && (query.isLoading || query.isFetching) && !isUnavailable
  const isAuthenticated = Boolean(hasToken && session && !isUnavailable)

  return {
    isAuthenticated,
    isChecking,
    isUnavailable,
    session: session
      ? { email: session.user.email, name: session.user.name?.trim() || null }
      : null,
    logout: () => {
      queryClient.setQueryData(queryKeys.auth.session(), null)
      queryClient.removeQueries({ queryKey: queryKeys.auth.all })
      void auth.service.logoutUser()
    },
  }
}
