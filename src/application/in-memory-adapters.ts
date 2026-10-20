import { DemandService } from '@/application/modules/Demand/service/demand.service'
import { JournalistService } from '@/application/modules/Journalist/service/journalist.service'
import { ReleaseService } from '@/application/modules/Release/service/release.service'
import { ReportService } from '@/application/modules/Report/service/report.service'
import type { DemandRepository } from '@/domain/Demand/demand.repository'
import type { JournalistRepository } from '@/domain/Journalist/journalist.repository'
import type { ReleaseRepository } from '@/domain/Release/release.repository'
import type { PressRoomReportRepository } from '@/domain/Report/press-room-report'
import { InMemoryDemandRepository } from '@/infrastructure/modules/Demand/demand.repository'
import { InMemoryJournalistRepository } from '@/infrastructure/modules/Journalist/journalist.repository'
import { InMemoryReleaseRepository } from '@/infrastructure/modules/Release/release.repository'
import { InMemoryPressRoomReportRepository } from '@/infrastructure/modules/Report/in-memory-press-room-report.repository'

const demandState = { service: null as unknown as DemandService }
const journalistState = { service: null as unknown as JournalistService }
const releaseState = { service: null as unknown as ReleaseService }
const reportState = { service: null as unknown as ReportService }

function wireInMemoryAdapters() {
  const demandRepo = new InMemoryDemandRepository()
  const journalistRepo = new InMemoryJournalistRepository()
  demandState.service = new DemandService(demandRepo)
  journalistState.service = new JournalistService(journalistRepo)
  releaseState.service = new ReleaseService(new InMemoryReleaseRepository(async () => (await journalistRepo.list()).items))
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

export const releaseService = {
  list: (...args: Parameters<ReleaseService['list']>) => releaseState.service.list(...args),
  getById: (...args: Parameters<ReleaseService['getById']>) => releaseState.service.getById(...args),
  create: (...args: Parameters<ReleaseService['create']>) => releaseState.service.create(...args),
  update: (...args: Parameters<ReleaseService['update']>) => releaseState.service.update(...args),
  remove: (...args: Parameters<ReleaseService['remove']>) => releaseState.service.remove(...args),
  setRecipients: (...args: Parameters<ReleaseService['setRecipients']>) => releaseState.service.setRecipients(...args),
  getRecipientImportTemplate: (...args: Parameters<ReleaseService['getRecipientImportTemplate']>) => releaseState.service.getRecipientImportTemplate(...args),
  previewRecipientImport: (...args: Parameters<ReleaseService['previewRecipientImport']>) => releaseState.service.previewRecipientImport(...args),
  commitRecipientImport: (...args: Parameters<ReleaseService['commitRecipientImport']>) => releaseState.service.commitRecipientImport(...args),
  listTags: (...args: Parameters<ReleaseService['listTags']>) => releaseState.service.listTags(...args),
  use(repo: ReleaseRepository) {
    releaseState.service = new ReleaseService(repo)
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
