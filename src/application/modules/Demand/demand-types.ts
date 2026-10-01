export type {
  DemandCaptureRevision as NewDemandCapture,
  DemandCaptureRevision,
} from '@/domain/Demand/demand.repository'
export type {
  DemandOrigin,
  DemandOutcomePublished,
  DemandPriority,
  DemandStatus,
  PositioningAttachment,
} from '@/domain/Demand/demand.entity'
export {
  DEFAULT_DEMAND_ORIGIN,
  DEMAND_ORIGINS,
  DEMAND_OUTCOME_PUBLISHED,
  DEMAND_OUTCOME_PUBLISHED_LABELS,
  DEMAND_OUTCOME_SCORE_MAX,
  DEMAND_OUTCOME_SCORE_MIN,
  POSITIONING_ATTACHMENT_MAX_BYTES,
  assertPositioningAttachmentSize,
  demandOutcomeRequiresUsage,
} from '@/domain/Demand/demand.entity'
export { AttachmentStorageUnavailableError, PositioningAttachmentTooLargeError } from '@/domain/Demand/errors/demand.errors'
