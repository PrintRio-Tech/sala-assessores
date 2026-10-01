import type { AuthRepository, VerifyCodeInput } from '@/domain/Auth/auth.repository'
import type { Session } from '@/domain/Auth/session.entity'
import type { User } from '@/domain/Auth/user.entity'
import { SessionExpiredError, SessionUnavailableError } from '@/domain/Auth/errors/auth.errors'
import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  hasStoredAuthTokens,
  persistSessionTokens,
} from '@/infrastructure/http/auth-token-storage'

import { classifyAuthFailure, mapAuthGraphqlError } from './auth-failure'
import {
  graphqlLogoutResponseDtoSchema,
  graphqlMagicLinkResponseDtoSchema,
  type GraphQLSessionDto,
  type GraphQLUserDto,
} from './DTOs/graphql-auth.dto'
import {
  LOGOUT_MUTATION,
  ME_QUERY,
  REFRESH_SESSION_MUTATION,
  REQUEST_MAGIC_LINK_MUTATION,
  VERIFY_MAGIC_LINK_MUTATION,
} from './graphql/auth.queries'
import { fromGraphQLSession, fromGraphQLUser } from './mappers/graphql-auth.mapper'

function storeSession(session: Session): Session {
  persistSessionTokens(session)
  return session
}

function buildSessionFromStorage(user: User): Session {
  const token = getAuthToken()
  const refreshToken = getRefreshToken()
  if (!token || !refreshToken) throw new SessionExpiredError()
  return {
    user,
    token,
    refreshToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }
}

export class GraphQLAuthRepository implements AuthRepository {
  async requestMagicLink(email: string): Promise<void> {
    try {
      const data = await graphqlClient.request<{ requestMagicLink: unknown }>(
        REQUEST_MAGIC_LINK_MUTATION,
        { email },
      )
      graphqlMagicLinkResponseDtoSchema.parse(data.requestMagicLink)
    } catch (error) {
      mapAuthGraphqlError(error, 'request')
    }
  }

  async verify(input: VerifyCodeInput): Promise<Session> {
    try {
      const data = await graphqlClient.request<{ verifyMagicLink: GraphQLSessionDto }>(
        VERIFY_MAGIC_LINK_MUTATION,
        { email: input.email, token: input.code },
      )
      return storeSession(fromGraphQLSession(data.verifyMagicLink))
    } catch (error) {
      mapAuthGraphqlError(error, 'verify')
    }
  }

  async refreshSession(): Promise<Session> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new SessionExpiredError()

    try {
      const data = await graphqlClient.request<{ refreshSession: GraphQLSessionDto }>(
        REFRESH_SESSION_MUTATION,
        { refreshToken },
      )
      return storeSession(fromGraphQLSession(data.refreshSession))
    } catch (error) {
      if (classifyAuthFailure(error) === 'unavailable') {
        throw error instanceof SessionUnavailableError
          ? error
          : new SessionUnavailableError()
      }
      clearAuthTokens()
      throw error instanceof SessionExpiredError ? error : new SessionExpiredError()
    }
  }

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken()
    clearAuthTokens()
    if (!refreshToken) return
    try {
      const data = await graphqlClient.request<{ logout: unknown }>(LOGOUT_MUTATION, {
        refreshToken,
      })
      graphqlLogoutResponseDtoSchema.parse(data.logout)
    } catch {
      // best-effort: wipe local already happened
    }
  }

  hasStoredToken(): boolean {
    return hasStoredAuthTokens()
  }

  async getSession(): Promise<Session | null> {
    const token = getAuthToken()
    const refreshToken = getRefreshToken()
    if (!token && !refreshToken) return null

    if (token) {
      try {
        const data = await graphqlClient.request<{ me: GraphQLUserDto | null }>(
          ME_QUERY,
          undefined,
          { accessToken: token },
        )
        if (data.me) return buildSessionFromStorage(fromGraphQLUser(data.me))
      } catch (error) {
        if (classifyAuthFailure(error) === 'unavailable') {
          throw error instanceof SessionUnavailableError
            ? error
            : new SessionUnavailableError()
        }
      }
    }

    if (getRefreshToken()) {
      try {
        return await this.refreshSession()
      } catch (error) {
        if (classifyAuthFailure(error) === 'unavailable') {
          throw error instanceof SessionUnavailableError
            ? error
            : new SessionUnavailableError()
        }
        clearAuthTokens()
        return null
      }
    }

    clearAuthTokens()
    return null
  }
}
