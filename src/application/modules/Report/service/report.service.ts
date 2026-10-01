import type { PressRoomReportRepository } from '@/domain/Report/press-room-report'

export class ReportService {
  private readonly repo: PressRoomReportRepository

  constructor(repo: PressRoomReportRepository) {
    this.repo = repo
  }

  get() {
    return this.repo.get()
  }
}
