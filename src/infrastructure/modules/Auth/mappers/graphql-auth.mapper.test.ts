import { afterEach, describe, expect, it, vi } from 'vitest'

import { fromGraphQLSession, fromGraphQLUser } from './graphql-auth.mapper'

const graphqlUser = {
  id: 'user-1',
  personId: 'person-1',
  email: 'ana@imprensa.gov.br',
  emails: ['ana@imprensa.gov.br', 'ana.alias@imprensa.gov.br'],
  name: 'Ana Silva',
  role: 'advisor',
  app: 'imprensa',
  isAdmin: false,
}

const graphqlSession = {
  user: graphqlUser,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
}

describe('graphql-auth.mapper', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mapeia SessionUser do BFF imprensa, sem tenant Forms', () => {
    expect(fromGraphQLUser(graphqlUser)).toEqual({
      id: 'user-1',
      personId: 'person-1',
      email: 'ana@imprensa.gov.br',
      emails: ['ana@imprensa.gov.br', 'ana.alias@imprensa.gov.br'],
      name: 'Ana Silva',
      role: 'advisor',
      app: 'imprensa',
      isAdmin: false,
    })
  })

  it('aceita name nulo', () => {
    expect(fromGraphQLUser({ ...graphqlUser, name: null }).name).toBeNull()
  })

  it('usa vencimento temporário de quinze minutos no AuthPayload', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T21:45:00.000Z'))

    const session = fromGraphQLSession(graphqlSession)
    expect(session.token).toBe('access-token')
    expect(session.refreshToken).toBe('refresh-token')
    expect(session.expiresAt).toEqual(new Date('2026-09-22T22:00:00.000Z'))
    expect(session.user.app).toBe('imprensa')
  })

  it('rejeita payload com clientId/officeIds no lugar do contrato da Sala', () => {
    expect(() =>
      fromGraphQLSession({
        ...graphqlSession,
        user: {
          id: 'user-1',
          personId: 'person-1',
          email: 'ana@imprensa.gov.br',
          name: 'Ana',
          role: 'advisor',
          officeIds: ['office-1'],
          isAdmin: false,
        },
      }),
    ).toThrow()
  })
})
