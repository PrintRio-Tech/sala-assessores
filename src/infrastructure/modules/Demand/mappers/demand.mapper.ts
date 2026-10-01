import type { Demand } from '@/domain/Demand/demand.entity'
import { emptyPositioning } from '@/domain/Demand/demand.entity'
import type { DemandDto } from '../DTOs/demand.dto'

function resolveContactMode(dto: DemandDto): Demand['contactMode'] {
  if (dto.contact_mode) return dto.contact_mode
  return dto.journalist_id ? 'known' : 'local'
}

export function toDomain(dto: DemandDto): Demand {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    requestSummary: dto.request_summary,
    factContext: dto.fact_context,
    journalistId: dto.journalist_id,
    journalistName: dto.journalist_name,
    outletName: dto.outlet_name,
    contactMode: resolveContactMode(dto),
    contactName: dto.contact_name ?? dto.journalist_name,
    contactOutlet: dto.contact_outlet ?? dto.outlet_name,
    responsibleId: dto.responsible_id,
    responsibleName: dto.responsible_name,
    deadlineAt: new Date(dto.deadline_at),
    channel: dto.channel,
    origin: dto.origin ?? 'solicited',
    priority: dto.priority ?? 'medium',
    status: dto.status,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    interactions: dto.interactions.map((item) => ({
      id: item.id,
      occurredAt: new Date(item.occurred_at),
      recordedBy: item.recorded_by ?? 'Noel Ferreira',
      type: item.type ?? null,
      result: item.result,
      participants: item.participants ?? null,
      summary: item.summary ?? null,
      nextStep: item.next_step ?? null,
      channel: item.channel ?? null,
      recipient: item.recipient ?? null,
      body: item.body ?? null,
      origin: item.origin,
      positioningVersionId: item.positioning_version_id ?? null,
    })),
    enrichment: dto.enrichment ? {
      tags: dto.enrichment.tags, topics: dto.enrichment.topics, relatedAreas: dto.enrichment.related_areas,
      confirmedFacts: dto.enrichment.confirmed_facts, pendingFacts: dto.enrichment.pending_facts, nextStep: dto.enrichment.next_step,
    } : undefined,
    stateTransitions: dto.state_transitions?.map((item) => ({
      id: item.id, from: item.from, to: item.to, occurredAt: new Date(item.occurred_at), recordedBy: item.recorded_by, trigger: item.trigger,
    })),
    positioning: dto.positioning ? {
      state: dto.positioning.state,
      versions: dto.positioning.versions.map((item) => ({
        id: item.id,
        body: item.body,
        author: item.author,
        savedAt: new Date(item.saved_at),
        attachment: item.attachment ? {
          filename: item.attachment.filename,
          contentType: item.attachment.content_type,
          sizeBytes: item.attachment.size_bytes,
          objectUrl: item.attachment.object_url,
          objectKey: item.attachment.object_key,
        } : null,
      })),
      approval: dto.positioning.approval ? {
        approvedBy: dto.positioning.approval.approved_by,
        opinion: dto.positioning.approval.opinion,
        approvedAt: new Date(dto.positioning.approval.approved_at),
        versionId: dto.positioning.approval.version_id,
      } : null,
    } : emptyPositioning(),
    outcome: dto.outcome ? {
      toneScore: dto.outcome.tone_score,
      published: dto.outcome.published,
      usageScore: dto.outcome.usage_score,
      resultSummary: dto.outcome.result_summary,
      recordedBy: dto.outcome.recorded_by,
      recordedAt: new Date(dto.outcome.recorded_at),
    } : null,
  }
}

function fromPositioning(positioning: Demand['positioning']): NonNullable<DemandDto['positioning']> | undefined {
  if (!positioning) return undefined
  return {
    state: positioning.state,
    versions: positioning.versions.map((item) => ({
      id: item.id,
      body: item.body,
      author: item.author,
      saved_at: item.savedAt.toISOString(),
      attachment: item.attachment ? {
        filename: item.attachment.filename,
        content_type: item.attachment.contentType,
        size_bytes: item.attachment.sizeBytes,
        object_url: item.attachment.objectUrl,
        object_key: item.attachment.objectKey,
      } : null,
    })),
    approval: positioning.approval ? {
      approved_by: positioning.approval.approvedBy,
      opinion: positioning.approval.opinion,
      approved_at: positioning.approval.approvedAt.toISOString(),
      version_id: positioning.approval.versionId,
    } : null,
  }
}

function fromOutcome(outcome: NonNullable<Demand['outcome']>): NonNullable<DemandDto['outcome']> {
  return {
    tone_score: outcome.toneScore,
    published: outcome.published,
    usage_score: outcome.usageScore,
    result_summary: outcome.resultSummary,
    recorded_by: outcome.recordedBy,
    recorded_at: outcome.recordedAt.toISOString(),
  }
}

export function fromDomain(demand: Demand): DemandDto {
  return {
    id: demand.id,
    code: demand.code,
    title: demand.title,
    request_summary: demand.requestSummary,
    fact_context: demand.factContext,
    journalist_id: demand.journalistId,
    journalist_name: demand.journalistName,
    outlet_name: demand.outletName,
    contact_mode: demand.contactMode,
    contact_name: demand.contactName,
    contact_outlet: demand.contactOutlet,
    responsible_id: demand.responsibleId,
    responsible_name: demand.responsibleName,
    deadline_at: demand.deadlineAt.toISOString(),
    channel: demand.channel,
    origin: demand.origin ?? 'solicited',
    priority: demand.priority ?? 'medium',
    status: demand.status,
    created_at: demand.createdAt.toISOString(),
    updated_at: demand.updatedAt.toISOString(),
    interactions: demand.interactions.map((item) => ({
      id: item.id,
      occurred_at: item.occurredAt.toISOString(),
      recorded_by: item.recordedBy,
      type: item.type,
      result: item.result,
      participants: item.participants,
      summary: item.summary,
      next_step: item.nextStep,
      channel: item.channel,
      recipient: item.recipient,
      body: item.body,
      origin: item.origin,
      positioning_version_id: item.positioningVersionId,
    })),
    enrichment: demand.enrichment ? {
      tags: demand.enrichment.tags,
      topics: demand.enrichment.topics,
      related_areas: demand.enrichment.relatedAreas,
      confirmed_facts: demand.enrichment.confirmedFacts,
      pending_facts: demand.enrichment.pendingFacts,
      next_step: demand.enrichment.nextStep,
    } : undefined,
    state_transitions: demand.stateTransitions?.map((item) => ({
      id: item.id,
      from: item.from,
      to: item.to,
      occurred_at: item.occurredAt.toISOString(),
      recorded_by: item.recordedBy,
      trigger: item.trigger,
    })),
    positioning: fromPositioning(demand.positioning),
    outcome: demand.outcome ? fromOutcome(demand.outcome) : null,
  }
}
