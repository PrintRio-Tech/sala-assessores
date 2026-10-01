import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionExpiredError } from '@/domain/Auth/errors/auth.errors'
import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import { persistSessionTokens } from '@/infrastructure/http/auth-token-storage'
import { GraphQLJournalistRepository } from './graphql-journalist.repository'
import { CREATE_JOURNALIST_MUTATION, JOURNALISTS_QUERY } from './graphql/journalist.queries'

vi.mock('@/infrastructure/graphql/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/infrastructure/graphql/graphql-client')>()
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn(),
    },
  }
})

const journalistDto = {
  id: 'j-1',
  name: 'Ana Paula',
  roleTitle: 'Repórter',
  outletName: 'Valor',
  desk: 'Economia',
  email: 'ana@valor.com',
  phone: null,
  preferredChannel: 'email' as const,
  bestContactWindow: 'Manhã',
  topics: ['economia'],
  isActive: true,
  createdAt: '2026-09-28T12:00:00.000Z',
  updatedAt: '2026-09-28T12:00:00.000Z',
  objectiveStats: {
    totalDemands: 1,
    solicitedCount: 1,
    proactiveCount: 0,
    successRate: 1,
    positioningUsageRate: 1,
  },
  demandHistory: [],
  relationshipEvaluations: [],
}

describe('GraphQLJournalistRepository', () => {
  const request = vi.mocked(graphqlClient.request)
  const repository = new GraphQLJournalistRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    persistSessionTokens({ token: 'access-token', refreshToken: 'refresh-token' })
  })

  it('lista jornalistas com Bearer e sem clientId', async () => {
    request.mockResolvedValueOnce({ journalists: { items: [journalistDto], total: 1 } })

    const listed = await repository.list()

    expect(request).toHaveBeenCalledWith(
      JOURNALISTS_QUERY,
      undefined,
      { accessToken: 'access-token' },
    )
    expect(JOURNALISTS_QUERY).not.toContain('clientId')
    expect(listed.items[0]?.email).toBe('ana@valor.com')
    expect(listed.total).toBe(1)
  })

  it('cria jornalista no BFF a partir do agregado de domínio', async () => {
    request.mockResolvedValueOnce({ createJournalist: journalistDto })

    const created = await repository.create({
      name: 'Ana Paula',
      roleTitle: 'Repórter',
      outletName: 'Valor',
      desk: 'Economia',
      email: 'ana@valor.com',
      phone: '',
      preferredChannel: 'email',
      bestContactWindow: 'Manhã',
      topics: ['economia'],
      isActive: true,
      objectiveStats: {
        totalDemands: 0,
        solicitedCount: 0,
        proactiveCount: 0,
        successRate: 0,
        positioningUsageRate: 0,
      },
      demandHistory: [],
      relationshipEvaluations: [{
        id: 'eval-1',
        authorName: 'Noel Ferreira',
        recordedAt: new Date(),
        score: 4,
        traits: [],
        editorialToneLabel: 'Nota inicial do cadastro',
        notes: '',
      }],
    })

    expect(request).toHaveBeenCalledWith(
      CREATE_JOURNALIST_MUTATION,
      {
        input: expect.objectContaining({
          name: 'Ana Paula',
          outletName: 'Valor',
          preferredChannel: 'email',
          email: 'ana@valor.com',
          initialScore: 4,
          initialScoreAuthorName: 'Noel Ferreira',
        }),
      },
      { accessToken: 'access-token' },
    )
    expect(created.id).toBe('j-1')
  })

  it('mapeia UNAUTHENTICATED para sessão expirada', async () => {
    request.mockRejectedValueOnce({
      errors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
    })

    await expect(repository.list()).rejects.toBeInstanceOf(SessionExpiredError)
  })
})
