import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlClient } from '@/infrastructure/graphql/graphql-client'
import { persistSessionTokens } from '@/infrastructure/http/auth-token-storage'
import {
  GraphQLPressRoomReportRepository,
  PRESS_ROOM_REPORT_QUERY,
} from './graphql-press-room-report.repository'

vi.mock('@/infrastructure/graphql/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/infrastructure/graphql/graphql-client')>()
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn(),
    },
  }
})

const sampleReport = {
  demandCount: 1,
  inProgressCount: 1,
  sentCount: 0,
  closedWithoutSendCount: 0,
  journalistCount: 1,
  outcomeCount: 0,
  publishedCount: 0,
  averageToneScore: null,
  demandsByMonth: [{ yearMonth: '2026-08', count: 1 }],
  publishedByMonth: [{ yearMonth: '2026-08', count: 0 }],
  byPriority: [{ key: 'high', label: 'Alta', count: 1 }],
  byOrigin: [{ key: 'solicited', label: 'Solicitada', count: 1 }],
  byPublished: [{ key: 'yes', label: 'Publicado', count: 0 }],
  heatmap: [{ priority: 'high', yearMonth: '2026-08', count: 1 }],
  toneDistribution: [{ score: 5, count: 0 }],
  topOutlets: [{ name: 'Valor', count: 1 }],
  topJournalists: [{ name: 'Ana Silva', outletName: 'Valor', count: 1 }],
  highlight: null,
}

describe('GraphQLPressRoomReportRepository', () => {
  const request = vi.mocked(graphqlClient.request)
  const repository = new GraphQLPressRoomReportRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    persistSessionTokens({ token: 'access-token', refreshToken: 'refresh-token' })
  })

  it('consome pressRoomReport com Bearer e filtro', async () => {
    request.mockResolvedValueOnce({ pressRoomReport: sampleReport })

    const filter = { responsibleId: 'r-ana', dateFrom: '2026-08-01', dateTo: '2026-08-31' }
    const report = await repository.get(filter)

    expect(PRESS_ROOM_REPORT_QUERY).toContain('$filter: PressRoomReportFilter')
    expect(request).toHaveBeenCalledWith(
      PRESS_ROOM_REPORT_QUERY,
      { filter },
      { accessToken: 'access-token' },
    )
    expect(report.demandCount).toBe(1)
    expect(report.demandsByMonth).toEqual([{ yearMonth: '2026-08', count: 1 }])
    expect(report.highlight).toBeNull()
  })
})
