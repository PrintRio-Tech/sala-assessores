import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import { persistSessionTokens } from '@/infrastructure/http/auth-token-storage'
import { GraphQLDemandRepository } from './graphql-demand.repository'
import {
  CREATE_ATTACHMENT_UPLOAD_MUTATION,
  CREATE_DEMAND_MUTATION,
  DELETE_DEMAND_MUTATION,
  DEMAND_QUERY,
  DEMAND_RESPONSIBLES_QUERY,
  DEMANDS_QUERY,
} from './graphql/demand.queries'

vi.mock('@/infrastructure/graphql/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/infrastructure/graphql/graphql-client')>()
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn(),
    },
  }
})

const demandDto = {
  id: 'd-1',
  code: 'IMP-001',
  title: 'Acidente',
  requestSummary: 'Pedido de nota',
  factContext: null,
  journalistId: 'j-1',
  contactMode: 'known' as const,
  contactName: null,
  contactOutlet: null,
  journalistName: 'Ana Paula',
  outletName: 'Valor',
  responsibleUserId: 'user-1',
  responsibleName: 'Admin Imprensa',
  deadlineAt: '2026-09-29T17:00:00.000Z',
  channel: null,
  origin: 'solicited' as const,
  priority: 'high' as const,
  status: 'in_progress' as const,
  tags: [],
  topics: [],
  relatedAreas: [],
  confirmedFacts: [],
  pendingFacts: [],
  enrichmentNextStep: null,
  positioningState: 'empty' as const,
  positioning: { state: 'empty' as const, versions: [], approval: null },
  interactions: [],
  outcome: null,
  stateTransitions: [],
  createdAt: '2026-09-28T12:00:00.000Z',
  updatedAt: '2026-09-28T12:00:00.000Z',
}

describe('GraphQLDemandRepository', () => {
  const request = vi.mocked(graphqlClient.request)
  const repository = new GraphQLDemandRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    persistSessionTokens({ token: 'access-token', refreshToken: 'refresh-token' })
  })

  it('consulta demandas com filtro e Bearer, sem clientId', async () => {
    request.mockResolvedValueOnce({
      demands: { items: [demandDto], total: 1, activeCount: 1, historyCount: 0 },
    })

    const listed = await repository.list({ lifecycle: 'active', search: 'Acidente', responsibleId: 'user-1' })

    expect(request).toHaveBeenCalledWith(
      DEMANDS_QUERY,
      {
        filter: {
          search: 'Acidente',
          status: undefined,
          lifecycle: 'active',
          journalistId: undefined,
          responsibleId: 'user-1',
          deadlineOn: undefined,
        },
      },
      { accessToken: 'access-token' },
    )
    expect(DEMANDS_QUERY).not.toContain('clientId')
    expect(listed.items[0]?.responsibleId).toBe('user-1')
    expect(listed.items[0]?.origin).toBe('solicited')
    expect(listed.activeCount).toBe(1)
  })

  it('lista responsáveis distintos pelo BFF', async () => {
    request.mockResolvedValueOnce({
      demandResponsibles: [{ id: 'user-1', name: 'Admin Imprensa' }],
    })

    await expect(repository.listResponsibles()).resolves.toEqual([
      { id: 'user-1', name: 'Admin Imprensa' },
    ])
    expect(request).toHaveBeenCalledWith(DEMAND_RESPONSIBLES_QUERY, undefined, { accessToken: 'access-token' })
  })

  it('devolve null quando demand(id) não existe', async () => {
    request.mockResolvedValueOnce({ demand: null })
    await expect(repository.getById('missing')).resolves.toBeNull()
    expect(request).toHaveBeenCalledWith(DEMAND_QUERY, { id: 'missing' }, { accessToken: 'access-token' })
  })

  it('cria demanda known só com journalistId, origem e prazo ISO', async () => {
    request.mockResolvedValueOnce({ createDemand: demandDto })

    const created = await repository.create({
      title: 'Acidente',
      requestSummary: 'Pedido de nota',
      factContext: '',
      journalistId: 'j-1',
      journalistName: 'Ana Paula',
      outletName: 'Valor',
      contactMode: 'known',
      contactName: 'Ana Paula',
      contactOutlet: 'Valor',
      responsibleId: 'user-1',
      responsibleName: 'Admin Imprensa',
      deadlineAt: new Date('2026-09-29T17:00:00.000Z'),
      channel: '',
      origin: 'proactive',
      priority: 'high',
      enrichment: { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
    })

    expect(request).toHaveBeenCalledWith(
      CREATE_DEMAND_MUTATION,
      {
        input: expect.objectContaining({
          title: 'Acidente',
          contactMode: 'known',
          journalistId: 'j-1',
          contactName: undefined,
          deadlineAt: '2026-09-29T17:00:00.000Z',
          origin: 'proactive',
          priority: 'high',
        }),
      },
      { accessToken: 'access-token' },
    )
    expect(created.code).toBe('IMP-001')
  })

  it('exclui demanda com deleteDemand', async () => {
    request.mockResolvedValueOnce({ deleteDemand: { id: 'd-1' } })
    await repository.remove('d-1')
    expect(request).toHaveBeenCalledWith(DELETE_DEMAND_MUTATION, { id: 'd-1' }, { accessToken: 'access-token' })
  })

  it('pede URL assinada para anexo', async () => {
    request.mockResolvedValueOnce({
      createAttachmentUpload: {
        objectKey: 'imprensa/positioning/abc',
        uploadUrl: 'https://r2.example/upload',
        headers: [{ name: 'Content-Type', value: 'application/pdf' }],
      },
    })

    const upload = await repository.createAttachmentUpload({
      filename: 'nota.pdf',
      contentType: 'application/pdf',
      sizeBytes: 12,
    })

    expect(request).toHaveBeenCalledWith(
      CREATE_ATTACHMENT_UPLOAD_MUTATION,
      { filename: 'nota.pdf', contentType: 'application/pdf', sizeBytes: 12 },
      { accessToken: 'access-token' },
    )
    expect(upload.objectKey).toBe('imprensa/positioning/abc')
  })

  it('não inventa URL de upload quando o BFF devolve STORAGE_UNAVAILABLE', async () => {
    request.mockRejectedValueOnce({
      message: 'Armazenamento indisponível',
      errors: [{ extensions: { code: 'STORAGE_UNAVAILABLE' } }],
    })

    await expect(
      repository.createAttachmentUpload({
        filename: 'nota.pdf',
        contentType: 'application/pdf',
        sizeBytes: 12,
      }),
    ).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' })
  })
})
