import type {
  Demand,
  DemandContactMode,
  DemandEnrichment,
  DemandOrigin,
  DemandPriority,
  DemandStatus,
  ExternalInteraction,
  ExternalInteractionResult,
  ExternalInteractionType,
  NewDemandOutcome,
  PositioningAttachment,
} from './demand.entity'

export interface DemandListParams {
  search?: string
  status?: DemandStatus | 'all'
  responsibleId?: string | 'all'
  journalistId?: string
  deadlineOn?: string
  lifecycle?: 'active' | 'history' | 'all'
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export interface DemandListResult extends Paginated<Demand> {
  activeCount: number
  historyCount: number
}

export type DemandCaptureRevision = {
  subject: string
  factContext: string
  pressRequest: string
  requestedDeadline: string
  channel: string
  contactMode: DemandContactMode
  contactName: string
  contactOutlet: string
  journalistId: string
  journalistName: string
  outletName: string
  origin?: DemandOrigin
  priority?: DemandPriority | null
  enrichment?: DemandEnrichment
}

export type NewDemand = {
  title: string
  requestSummary: string
  factContext: string
  journalistId: string
  journalistName: string
  outletName: string
  contactMode: DemandContactMode
  contactName: string
  contactOutlet: string
  responsibleId: string
  responsibleName: string
  deadlineAt: Date
  channel: string
  origin: DemandOrigin
  priority: DemandPriority
  enrichment: DemandEnrichment
}

export type RegisterExternalInteractionInput = {
  occurredAt: Date
  /** Optional only for compatibility with legacy mock callers. UI flows always provide the current author. */
  recordedBy?: string
  result: ExternalInteractionResult
  type?: ExternalInteractionType | null
  participants?: string | null
  summary?: string | null
  nextStep?: string | null
  channel?: string | null
  recipient?: string | null
  body?: string | null
}
export type NewExternalInteraction = Omit<ExternalInteraction, 'id'>

export interface DemandRepository {
  list(params?: DemandListParams): Promise<DemandListResult>
  listResponsibles(): Promise<Array<{ id: string; name: string }>>
  getById(id: string): Promise<Demand | null>
  create(input: NewDemand): Promise<Demand>
  reviseCapture(id: string, revision: DemandCaptureRevision): Promise<Demand | null>
  remove(id: string): Promise<void>
  registerInteraction(id: string, input: NewExternalInteraction): Promise<Demand | null>
  createAttachmentUpload(input: {
    filename: string
    contentType: string
    sizeBytes: number
  }): Promise<{ objectKey: string; uploadUrl: string; headers: Array<{ name: string; value: string }> }>
  putAttachment(
    upload: { objectKey: string; uploadUrl: string; headers: Array<{ name: string; value: string }> },
    body: Blob,
  ): Promise<void>
  savePositioning(id: string, input: { body: string; author: string; savedAt: Date; attachment?: PositioningAttachment | null }): Promise<Demand | null>
  registerOutcome(id: string, input: NewDemandOutcome): Promise<Demand | null>
}
