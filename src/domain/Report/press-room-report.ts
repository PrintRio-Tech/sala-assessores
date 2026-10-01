export interface PressRoomReport {
  demandCount: number
  inProgressCount: number
  sentCount: number
  closedWithoutSendCount: number
  journalistCount: number
  outcomeCount: number
  publishedCount: number
  averageToneScore: number | null
}

export interface PressRoomReportRepository {
  get(): Promise<PressRoomReport>
}
