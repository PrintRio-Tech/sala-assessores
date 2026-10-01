import { z } from 'zod'

import type { PressRoomReport, PressRoomReportRepository } from '@/domain/Report/press-room-report'
import { requestGraphql } from '@/infrastructure/graphql/authorized-request'
import { mapOperationalGraphqlError } from '@/infrastructure/graphql/operational-error'

export const PRESS_ROOM_REPORT_QUERY = /* GraphQL */ `
  query PressRoomReport {
    pressRoomReport {
      demandCount
      inProgressCount
      sentCount
      closedWithoutSendCount
      journalistCount
      outcomeCount
      publishedCount
      averageToneScore
    }
  }
`

const graphqlPressRoomReportDtoSchema = z.object({
  demandCount: z.number(),
  inProgressCount: z.number(),
  sentCount: z.number(),
  closedWithoutSendCount: z.number(),
  journalistCount: z.number(),
  outcomeCount: z.number(),
  publishedCount: z.number(),
  averageToneScore: z.number().nullable(),
})

export class GraphQLPressRoomReportRepository implements PressRoomReportRepository {
  async get(): Promise<PressRoomReport> {
    try {
      const data = await requestGraphql<{ pressRoomReport: unknown }>(PRESS_ROOM_REPORT_QUERY)
      return graphqlPressRoomReportDtoSchema.parse(data.pressRoomReport)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }
}
