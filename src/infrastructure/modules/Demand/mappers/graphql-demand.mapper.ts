import { parseDemandDeadline, type Demand, type NewDemandOutcome, type PositioningAttachment } from '@/domain/Demand/demand.entity'
import type {
  DemandCaptureRevision,
  DemandListParams,
  NewDemand,
  NewExternalInteraction,
} from '@/domain/Demand/demand.repository'
import type { GraphQLDemandDto } from '../DTOs/graphql-demand.dto'

export function toDomain(dto: GraphQLDemandDto): Demand {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    requestSummary: dto.requestSummary,
    factContext: dto.factContext ?? undefined,
    journalistId: dto.journalistId ?? '',
    journalistName: dto.journalistName,
    outletName: dto.outletName,
    contactMode: dto.contactMode,
    contactName: dto.contactName ?? dto.journalistName,
    contactOutlet: dto.contactOutlet ?? dto.outletName,
    responsibleId: dto.responsibleUserId,
    responsibleName: dto.responsibleName,
    deadlineAt: new Date(dto.deadlineAt),
    channel: dto.channel ?? undefined,
    origin: dto.origin,
    priority: dto.priority,
    status: dto.status,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    interactions: (dto.interactions ?? []).map((item) => ({
      id: item.id,
      occurredAt: new Date(item.occurredAt),
      recordedBy: item.recordedBy,
      type: item.type,
      result: item.result,
      participants: item.participants,
      summary: item.summary,
      nextStep: item.nextStep,
      channel: item.channel,
      recipient: item.recipient,
      body: item.body,
      origin: 'off_platform',
      positioningVersionId: item.positioningVersionId,
    })),
    enrichment: {
      tags: dto.tags,
      topics: dto.topics,
      relatedAreas: dto.relatedAreas,
      confirmedFacts: dto.confirmedFacts,
      pendingFacts: dto.pendingFacts,
      nextStep: dto.enrichmentNextStep,
    },
    stateTransitions: (dto.stateTransitions ?? []).map((item) => ({
      id: item.id,
      from: item.fromStatus,
      to: item.toStatus,
      occurredAt: new Date(item.occurredAt),
      recordedBy: item.recordedBy,
      trigger: item.trigger === 'closed_without_send' ? 'closed_without_send' : 'response_sent',
    })),
    positioning: {
      state: dto.positioning?.state ?? dto.positioningState,
      versions: (dto.positioning?.versions ?? []).map((item) => ({
        id: item.id,
        body: item.body,
        author: item.author,
        savedAt: new Date(item.savedAt),
        attachment: item.attachment ? {
          filename: item.attachment.filename,
          contentType: item.attachment.contentType,
          sizeBytes: item.attachment.sizeBytes,
          objectKey: item.attachment.objectKey,
          objectUrl: item.attachment.downloadUrl ?? '',
        } : null,
      })),
      approval: dto.positioning?.approval ? {
        approvedBy: dto.positioning.approval.approvedBy,
        opinion: dto.positioning.approval.opinion,
        approvedAt: new Date(dto.positioning.approval.approvedAt),
        versionId: dto.positioning.approval.versionId,
      } : null,
    },
    outcome: dto.outcome ? {
      toneScore: dto.outcome.toneScore,
      published: dto.outcome.published,
      usageScore: dto.outcome.usageScore,
      resultSummary: dto.outcome.resultSummary,
      recordedBy: dto.outcome.recordedBy,
      recordedAt: new Date(dto.outcome.recordedAt),
    } : null,
  }
}

function emptyToUndefined(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function captureInput(input: {
  title: string
  requestSummary: string
  factContext?: string | null
  contactMode: 'known' | 'local'
  journalistId?: string
  contactName?: string
  contactOutlet?: string
  deadlineAt: string
  channel?: string
  origin?: NewDemand['origin']
  priority?: NewDemand['priority']
  enrichment?: NewDemand['enrichment']
}) {
  return {
    title: input.title,
    requestSummary: input.requestSummary,
    factContext: emptyToUndefined(input.factContext ?? undefined),
    contactMode: input.contactMode,
    journalistId: input.contactMode === 'known' ? emptyToUndefined(input.journalistId) : undefined,
    contactName: input.contactMode === 'local' ? emptyToUndefined(input.contactName) : undefined,
    contactOutlet: input.contactMode === 'local' ? emptyToUndefined(input.contactOutlet) : undefined,
    deadlineAt: input.deadlineAt,
    channel: emptyToUndefined(input.channel),
    origin: input.origin,
    priority: input.priority ?? undefined,
    tags: input.enrichment?.tags,
    topics: input.enrichment?.topics,
    relatedAreas: input.enrichment?.relatedAreas,
    confirmedFacts: input.enrichment?.confirmedFacts,
    pendingFacts: input.enrichment?.pendingFacts,
    enrichmentNextStep: input.enrichment?.nextStep ?? undefined,
  }
}

export function toCreateDemandInput(input: NewDemand) {
  return captureInput({
    title: input.title,
    requestSummary: input.requestSummary,
    factContext: input.factContext,
    contactMode: input.contactMode,
    journalistId: input.journalistId,
    contactName: input.contactName,
    contactOutlet: input.contactOutlet,
    deadlineAt: input.deadlineAt.toISOString(),
    channel: input.channel,
    origin: input.origin,
    priority: input.priority ?? 'medium',
    enrichment: input.enrichment,
  })
}

export function toReviseDemandCaptureInput(revision: DemandCaptureRevision) {
  return captureInput({
    title: revision.subject.trim(),
    requestSummary: revision.pressRequest.trim(),
    factContext: revision.factContext,
    contactMode: revision.contactMode,
    journalistId: revision.journalistId,
    contactName: revision.contactName,
    contactOutlet: revision.contactOutlet,
    deadlineAt: parseDemandDeadline(revision.requestedDeadline).toISOString(),
    channel: revision.channel,
    origin: revision.origin,
    priority: revision.priority ?? undefined,
    enrichment: revision.enrichment,
  })
}

export function toDemandsFilter(params: DemandListParams = {}) {
  return {
    search: emptyToUndefined(params.search),
    status: params.status && params.status !== 'all' ? params.status : undefined,
    lifecycle: params.lifecycle ?? 'active',
    journalistId: emptyToUndefined(params.journalistId),
    responsibleId: params.responsibleId && params.responsibleId !== 'all' ? params.responsibleId : undefined,
    deadlineOn: emptyToUndefined(params.deadlineOn),
  }
}

export function toRegisterExternalInteractionInput(demandId: string, input: NewExternalInteraction) {
  return {
    demandId,
    occurredAt: input.occurredAt.toISOString(),
    result: input.result,
    type: input.type ?? undefined,
    participants: input.participants ?? undefined,
    summary: input.summary ?? undefined,
    nextStep: input.nextStep ?? undefined,
    channel: input.channel ?? undefined,
    recipient: input.recipient ?? undefined,
    body: input.body ?? undefined,
  }
}

export function toSavePositioningInput(
  demandId: string,
  input: { body: string; author: string; attachment?: PositioningAttachment | null },
) {
  return {
    demandId,
    body: emptyToUndefined(input.body) ?? '',
    author: emptyToUndefined(input.author),
    attachment: input.attachment ? {
      filename: input.attachment.filename,
      contentType: input.attachment.contentType,
      sizeBytes: input.attachment.sizeBytes,
      objectKey: input.attachment.objectKey ?? input.attachment.filename,
    } : undefined,
  }
}

export function toRegisterDemandOutcomeInput(demandId: string, input: NewDemandOutcome) {
  return {
    demandId,
    toneScore: input.toneScore,
    published: input.published,
    usageScore: input.usageScore ?? undefined,
    resultSummary: input.resultSummary,
  }
}
