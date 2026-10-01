import {
  formatDemandCalendarDay,
  parseDemandDeadline,
  type Demand,
  type DemandEnrichment,
  type DemandOrigin,
  type DemandPriority,
  type DemandStateTransition,
  type DemandStatus,
  type ExternalInteraction,
} from '../demand.entity'
import type { DemandCaptureRevision, DemandRepository } from '../demand.repository'
import { DemandNotFoundError } from '../errors/demand.errors'

export type { DemandCaptureRevision }

export type DemandCreatedBy = { id: string; name: string } | null

type DemandCaptureHost = {
  status: DemandStatus
  subject: string
  factContext: string
  pressRequest: string
  requestedDeadline: string
  channel: string
  contactMode: 'known' | 'local'
  contactName: string
  contactOutlet: string
  journalistId: string
  journalistName: string
  outletName: string
  origin?: DemandOrigin
  createdBy?: DemandCreatedBy
  responsibleId?: string
  responsibleName?: string
  priority?: DemandPriority | null
  enrichment?: DemandEnrichment
  stateTransitions?: DemandStateTransition[]
  interactions: ExternalInteraction[]
}

export function applyDemandCaptureRevision<T extends DemandCaptureHost>(
  current: T,
  revision: DemandCaptureRevision,
): T {
  const { priority, enrichment, ...capture } = revision
  return {
    ...current,
    ...capture,
    status: current.status,
    createdBy: current.createdBy,
    responsibleId: current.responsibleId,
    responsibleName: current.responsibleName,
    priority: priority !== undefined ? priority : current.priority,
    enrichment: enrichment
      ? {
          tags: enrichment.tags,
          topics: enrichment.topics,
          relatedAreas: enrichment.relatedAreas,
          confirmedFacts: current.enrichment?.confirmedFacts ?? enrichment.confirmedFacts,
          pendingFacts: current.enrichment?.pendingFacts ?? enrichment.pendingFacts,
          nextStep: current.enrichment ? current.enrichment.nextStep : enrichment.nextStep,
        }
      : current.enrichment,
    stateTransitions: current.stateTransitions,
    interactions: current.interactions,
  }
}

export function applyRevisionToDemand(
  current: Demand,
  revision: DemandCaptureRevision,
): Demand {
  const host = applyDemandCaptureRevision({
    status: current.status,
    subject: current.title,
    factContext: current.factContext ?? '',
    pressRequest: current.requestSummary,
    requestedDeadline: formatDemandCalendarDay(current.deadlineAt),
    channel: current.channel ?? '',
    contactMode: current.contactMode ?? (current.journalistId ? 'known' : 'local'),
    contactName: current.contactName ?? current.journalistName,
    contactOutlet: current.contactOutlet ?? current.outletName,
    journalistId: current.journalistId,
    journalistName: current.journalistName,
    outletName: current.outletName,
    origin: current.origin,
    responsibleId: current.responsibleId,
    responsibleName: current.responsibleName,
    priority: current.priority,
    enrichment: current.enrichment,
    stateTransitions: current.stateTransitions,
    interactions: current.interactions,
  }, revision)

  return {
    ...current,
    title: host.subject,
    factContext: host.factContext,
    requestSummary: host.pressRequest,
    deadlineAt: parseDemandDeadline(host.requestedDeadline),
    channel: host.channel,
    contactMode: host.contactMode,
    contactName: host.contactName,
    contactOutlet: host.contactOutlet,
    journalistId: host.journalistId,
    journalistName: host.journalistName,
    outletName: host.outletName,
    origin: host.origin ?? current.origin,
    priority: host.priority ?? null,
    enrichment: host.enrichment,
  }
}

export class ReviseDemandCapture {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(id: string, revision: DemandCaptureRevision): Promise<Demand> {
    const demand = await this.repo.reviseCapture(id, revision)
    if (!demand) throw new DemandNotFoundError()
    return demand
  }
}
