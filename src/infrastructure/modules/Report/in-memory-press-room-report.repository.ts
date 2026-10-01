import type { DemandRepository } from '@/domain/Demand/demand.repository'
import type { PressRoomReport, PressRoomReportFilter, PressRoomReportRepository } from '@/domain/Report/press-room-report'
import { GetPressRoomReport } from '@/domain/Report/use-cases/get-press-room-report.use-case'

export class InMemoryPressRoomReportRepository implements PressRoomReportRepository {
  private readonly getPressRoomReport: GetPressRoomReport

  constructor(demandRepo: DemandRepository) {
    this.getPressRoomReport = new GetPressRoomReport(demandRepo)
  }

  get(filter?: PressRoomReportFilter): Promise<PressRoomReport> {
    return this.getPressRoomReport.execute(filter)
  }
}
