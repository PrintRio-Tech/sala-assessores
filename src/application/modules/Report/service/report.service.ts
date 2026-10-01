import type { PressRoomReportFilter, PressRoomReportRepository } from '@/domain/Report/press-room-report'

export class ReportService {
  private readonly repo: PressRoomReportRepository

  constructor(repo: PressRoomReportRepository) {
    this.repo = repo
  }

  get(filter?: PressRoomReportFilter) {
    return this.repo.get(filter)
  }
}
