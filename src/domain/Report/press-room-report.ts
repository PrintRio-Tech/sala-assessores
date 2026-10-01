export type PressRoomReportFilter = {
  responsibleId?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export type MonthCount = { yearMonth: string; count: number }
export type RankCount = { key: string; label: string; count: number }
export type HeatmapCell = { priority: string; yearMonth: string; count: number }
export type ToneBucket = { score: number; count: number }
export type OutletRank = { name: string; count: number }
export type JournalistRank = { name: string; outletName: string; count: number }
export type PressRoomHighlight = { name: string; outletName: string; publishedCount: number }

export interface PressRoomReport {
  demandCount: number
  inProgressCount: number
  sentCount: number
  closedWithoutSendCount: number
  journalistCount: number
  outcomeCount: number
  publishedCount: number
  averageToneScore: number | null
  demandsByMonth: MonthCount[]
  publishedByMonth: MonthCount[]
  byPriority: RankCount[]
  byOrigin: RankCount[]
  byPublished: RankCount[]
  heatmap: HeatmapCell[]
  toneDistribution: ToneBucket[]
  topOutlets: OutletRank[]
  topJournalists: JournalistRank[]
  highlight: PressRoomHighlight | null
}

export interface PressRoomReportRepository {
  get(filter?: PressRoomReportFilter): Promise<PressRoomReport>
}
