import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import { getAuthToken } from '@/infrastructure/http/auth-token-storage'

export function requestGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const accessToken = getAuthToken() ?? undefined
  return graphqlClient.request<T>(query, variables, { accessToken })
}
