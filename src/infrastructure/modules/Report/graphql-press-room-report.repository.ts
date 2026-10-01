import { z } from 'zod'

import type {
  PressRoomReport,
  PressRoomReportFilter,
  PressRoomReportRepository,
} from '@/domain/Report/press-room-report'
import { requestGraphql } from '@/infrastructure/graphql/authorized-request'
import { mapOperationalGraphqlError } from '@/infrastructure/graphql/operational-error'

export const PRESS_ROOM_REPORT_QUERY = /* GraphQL */ `
  query PressRoomReport($filter: PressRoomReportFilter) {
    pressRoomReport(filter: $filter) {
      demandCount
      inProgressCount
      sentCount
      closedWithoutSendCount
      journalistCount
      outcomeCount
      publishedCount
      averageToneScore
      demandsByMonth { yearMonth count }
      publishedByMonth { yearMonth count }
      byPriority { key label count }
      byOrigin { key label count }
      byPublished { key label count }
      heatmap { priority yearMonth count }
      toneDistribution { score count }
      topOutlets { name count }
      topJournalists { name outletName count }
      highlight { name outletName publishedCount }
    }
  }
`

const monthCountSchema = z.object({
  yearMonth: z.string(),
  count: z.number(),
})
const rankCountSchema = z.object({
  key: z.string(),
  label: z.string(),
  count: z.number(),
})

const graphqlPressRoomReportDtoSchema = z.object({
  demandCount: z.number(),
  inProgressCount: z.number(),
  sentCount: z.number(),
  closedWithoutSendCount: z.number(),
  journalistCount: z.number(),
  outcomeCount: z.number(),
  publishedCount: z.number(),
  averageToneScore: z.number().nullable(),
  demandsByMonth: z.array(monthCountSchema),
  publishedByMonth: z.array(monthCountSchema),
  byPriority: z.array(rankCountSchema),
  byOrigin: z.array(rankCountSchema),
  byPublished: z.array(rankCountSchema),
  heatmap: z.array(z.object({
    priority: z.string(),
    yearMonth: z.string(),
    count: z.number(),
  })),
  toneDistribution: z.array(z.object({
    score: z.number(),
    count: z.number(),
  })),
  topOutlets: z.array(z.object({
    name: z.string(),
    count: z.number(),
  })),
  topJournalists: z.array(z.object({
    name: z.string(),
    outletName: z.string(),
    count: z.number(),
  })),
  highlight: z.object({
    name: z.string(),
    outletName: z.string(),
    publishedCount: z.number(),
  }).nullable(),
})

function toGraphqlFilter(filter?: PressRoomReportFilter) {
  if (!filter) return {}
  return {
    responsibleId: filter.responsibleId || null,
    dateFrom: filter.dateFrom || null,
    dateTo: filter.dateTo || null,
  }
}

export class GraphQLPressRoomReportRepository implements PressRoomReportRepository {
  async get(filter?: PressRoomReportFilter): Promise<PressRoomReport> {
    try {
      const data = await requestGraphql<{ pressRoomReport: unknown }>(
        PRESS_ROOM_REPORT_QUERY,
        { filter: toGraphqlFilter(filter) },
      )
      return graphqlPressRoomReportDtoSchema.parse(data.pressRoomReport)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }
}
