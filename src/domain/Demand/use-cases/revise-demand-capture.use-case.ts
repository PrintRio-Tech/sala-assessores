import type {
  DemandEnrichment,
  DemandPriority,
  DemandStateTransition,
  DemandStatus,
  ExternalInteraction,
} from '../demand.entity'

export type DemandCreatedBy = { id: string; name: string } | null

export type DemandCaptureRevision = {
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
  priority?: DemandPriority | null
  enrichment?: DemandEnrichment
}

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
