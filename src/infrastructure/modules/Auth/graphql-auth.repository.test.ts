import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AuthForbiddenError,
  AuthRateLimitedError,
  InvalidMagicLinkError,
  SessionExpiredError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'
import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import {
  clearAuthTokens,
  persistSessionTokens,
} from '@/infrastructure/http/auth-token-storage'

import { GraphQLAuthRepository } from './graphql-auth.repository'
import {
  LOGOUT_MUTATION,
  ME_QUERY,
  REFRESH_SESSION_MUTATION,
  REQUEST_MAGIC_LINK_MUTATION,
  VERIFY_MAGIC_LINK_MUTATION,
} from './graphql/auth.queries'

vi.mock('@/infrastructure/graphql/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/infrastructure/graphql/graphql-client')>()
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn(),
    },
  }
})

const graphqlUser = {
  id: 'user-1',
  personId: 'person-1',
  email: 'ana@imprensa.gov.br',
  emails: ['ana@imprensa.gov.br'],
  name: 'Ana Silva',
  role: 'advisor',
  app: 'imprensa',
  isAdmin: false,
}

const graphqlSession = {
  user: graphqlUser,
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
}

describe('GraphQLAuthRepository', () => {
  const request = vi.mocked(graphqlClient.request)
  const repository = new GraphQLAuthRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    clearAuthTokens()
    localStorage.clear()
  })

  it('pede o código sem app e sem Authorization', async () => {
    request.mockResolvedValueOnce({ requestMagicLink: { ok: true } })

    await repository.requestMagicLink('ana@imprensa.gov.br')

    expect(request).toHaveBeenCalledWith(
      REQUEST_MAGIC_LINK_MUTATION,
      { email: 'ana@imprensa.gov.br' },
    )
    expect(REQUEST_MAGIC_LINK_MUTATION).toContain('requestMagicLink(email: $email)')
    expect(REQUEST_MAGIC_LINK_MUTATION).not.toContain('$app')
  })

  it('verifica OTP com email e token, persistindo JWT do BFF', async () => {
    request.mockResolvedValueOnce({ verifyMagicLink: graphqlSession })

    const session = await repository.verify({
      email: 'ana@imprensa.gov.br',
      code: '482913',
    })

    expect(request).toHaveBeenCalledWith(VERIFY_MAGIC_LINK_MUTATION, {
      email: 'ana@imprensa.gov.br',
      token: '482913',
    })
    expect(VERIFY_MAGIC_LINK_MUTATION).toContain(
      'verifyMagicLink(email: $email, token: $token)',
    )
    expect(session.token).toBe('new-access-token')
    expect(session.user.app).toBe('imprensa')
    expect(localStorage.getItem('sala_assessores_auth_token')).toBe('new-access-token')
  })

  it('mapeia RATE_LIMITED, OTP inválido, FORBIDDEN e INTERNAL', async () => {
    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'Too many',
      errors: [{ extensions: { code: 'RATE_LIMITED', metadata: { code: 'RATE_LIMITED' } } }],
    })
    await expect(repository.requestMagicLink('ana@imprensa.gov.br')).rejects.toBeInstanceOf(
      AuthRateLimitedError,
    )

    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'Invalid',
      errors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    })
    await expect(
      repository.verify({ email: 'ana@imprensa.gov.br', code: '000000' }),
    ).rejects.toBeInstanceOf(InvalidMagicLinkError)

    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'Forbidden',
      errors: [{ extensions: { code: 'FORBIDDEN' } }],
    })
    await expect(
      repository.verify({ email: 'ana@imprensa.gov.br', code: '123456' }),
    ).rejects.toBeInstanceOf(AuthForbiddenError)

    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'boom',
      errors: [{ extensions: { code: 'INTERNAL' } }],
    })
    await expect(repository.requestMagicLink('ana@imprensa.gov.br')).rejects.toBeInstanceOf(
      SessionUnavailableError,
    )
  })

  it('refresh revogado limpa tokens; INTERNAL preserva o refresh', async () => {
    persistSessionTokens({ token: 'old-access', refreshToken: 'old-refresh' })

    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'gone',
      errors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    })
    await expect(repository.refreshSession()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(localStorage.getItem('sala_assessores_refresh_token')).toBeNull()

    persistSessionTokens({ token: 'old-access', refreshToken: 'old-refresh' })
    request.mockRejectedValueOnce({
      name: 'GraphQLClientError',
      message: 'down',
      errors: [{ extensions: { code: 'INTERNAL' } }],
    })
    await expect(repository.refreshSession()).rejects.toBeInstanceOf(SessionUnavailableError)
    expect(localStorage.getItem('sala_assessores_refresh_token')).toBe('old-refresh')
  })

  it('logout limpa tokens mesmo se a mutation falhar', async () => {
    persistSessionTokens({ token: 'access', refreshToken: 'refresh-1' })
    request.mockRejectedValueOnce(new Error('network'))

    await repository.logout()

    expect(request).toHaveBeenCalledWith(LOGOUT_MUTATION, { refreshToken: 'refresh-1' })
    expect(localStorage.getItem('sala_assessores_auth_token')).toBeNull()
  })

  it('me nulo tenta refresh; me autenticado usa Bearer', async () => {
    persistSessionTokens({ token: 'access', refreshToken: 'refresh-1' })
    request
      .mockResolvedValueOnce({ me: null })
      .mockResolvedValueOnce({ refreshSession: graphqlSession })

    const session = await repository.getSession()

    expect(request).toHaveBeenNthCalledWith(1, ME_QUERY, undefined, {
      accessToken: 'access',
    })
    expect(request).toHaveBeenNthCalledWith(2, REFRESH_SESSION_MUTATION, {
      refreshToken: 'refresh-1',
    })
    expect(session?.user.email).toBe('ana@imprensa.gov.br')
    expect(session?.token).toBe('new-access-token')
  })
})
