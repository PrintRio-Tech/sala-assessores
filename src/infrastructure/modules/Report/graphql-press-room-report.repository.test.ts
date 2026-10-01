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

describe('GraphQLPressRoomReportRepository', () => {
  const request = vi.mocked(graphqlClient.request)
  const repository = new GraphQLPressRoomReportRepository()

  beforeEach(() => {
    vi.clearAllMocks()
    persistSessionTokens({ token: 'access-token', refreshToken: 'refresh-token' })
  })

  it('consome pressRoomReport com Bearer', async () => {
    request.mockResolvedValueOnce({
      pressRoomReport: {
        demandCount: 1,
        inProgressCount: 1,
        sentCount: 0,
        closedWithoutSendCount: 0,
        journalistCount: 1,
        outcomeCount: 0,
        publishedCount: 0,
        averageToneScore: null,
      },
    })

    const report = await repository.get()

    expect(request).toHaveBeenCalledWith(
      PRESS_ROOM_REPORT_QUERY,
      undefined,
      { accessToken: 'access-token' },
    )
    expect(report.demandCount).toBe(1)
    expect(report.journalistCount).toBe(1)
    expect(report.averageToneScore).toBeNull()
  })
})
