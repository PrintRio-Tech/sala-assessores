import { DemandService } from '@/application/modules/Demand/service/demand.service'
import { JournalistService } from '@/application/modules/Journalist/service/journalist.service'
import { ReportService } from '@/application/modules/Report/service/report.service'
import type { DemandRepository } from '@/domain/Demand/demand.repository'
import type { JournalistRepository } from '@/domain/Journalist/journalist.repository'
import type { PressRoomReportRepository } from '@/domain/Report/press-room-report'
import { InMemoryDemandRepository } from '@/infrastructure/modules/Demand/demand.repository'
import { InMemoryJournalistRepository } from '@/infrastructure/modules/Journalist/journalist.repository'
import { InMemoryPressRoomReportRepository } from '@/infrastructure/modules/Report/in-memory-press-room-report.repository'

const demandState = { service: null as unknown as DemandService }
const journalistState = { service: null as unknown as JournalistService }
const reportState = { service: null as unknown as ReportService }

function wireInMemoryAdapters() {
  const demandRepo = new InMemoryDemandRepository()
  const journalistRepo = new InMemoryJournalistRepository()
  demandState.service = new DemandService(demandRepo)
  journalistState.service = new JournalistService(journalistRepo)
  reportState.service = new ReportService(new InMemoryPressRoomReportRepository(demandRepo))
}

wireInMemoryAdapters()

export const demandService = {
  list: (...args: Parameters<DemandService['list']>) => demandState.service.list(...args),
  listResponsibles: (...args: Parameters<DemandService['listResponsibles']>) => demandState.service.listResponsibles(...args),
  getById: (...args: Parameters<DemandService['getById']>) => demandState.service.getById(...args),
  create: (...args: Parameters<DemandService['create']>) => demandState.service.create(...args),
  reviseCapture: (...args: Parameters<DemandService['reviseCapture']>) => demandState.service.reviseCapture(...args),
  remove: (...args: Parameters<DemandService['remove']>) => demandState.service.remove(...args),
  registerInteraction: (...args: Parameters<DemandService['registerInteraction']>) => demandState.service.registerInteraction(...args),
  savePositioning: (...args: Parameters<DemandService['savePositioning']>) => demandState.service.savePositioning(...args),
  registerOutcome: (...args: Parameters<DemandService['registerOutcome']>) => demandState.service.registerOutcome(...args),
  use(repo: DemandRepository) {
    demandState.service = new DemandService(repo)
    reportState.service = new ReportService(new InMemoryPressRoomReportRepository(repo))
  },
}

export const journalistService = {
  list: (...args: Parameters<JournalistService['list']>) => journalistState.service.list(...args),
  getById: (...args: Parameters<JournalistService['getById']>) => journalistState.service.getById(...args),
  create: (...args: Parameters<JournalistService['create']>) => journalistState.service.create(...args),
  update: (...args: Parameters<JournalistService['update']>) => journalistState.service.update(...args),
  registerEvaluation: (...args: Parameters<JournalistService['registerEvaluation']>) => journalistState.service.registerEvaluation(...args),
  use(repo: JournalistRepository) {
    journalistState.service = new JournalistService(repo)
  },
}

export const reportService = {
  get: (...args: Parameters<ReportService['get']>) => reportState.service.get(...args),
  use(repo: PressRoomReportRepository) {
    reportState.service = new ReportService(repo)
  },
}

export function resetInMemoryAdapters() {
  wireInMemoryAdapters()
}
