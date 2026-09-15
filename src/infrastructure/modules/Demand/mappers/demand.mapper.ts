import type { Demand } from '@/domain/Demand/demand.entity'
import { emptyPositioning } from '@/domain/Demand/demand.entity'
import type { DemandDto } from '../DTOs/demand.dto'

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
    responsibleId: dto.responsible_id,
    responsibleName: dto.responsible_name,
    deadlineAt: new Date(dto.deadline_at),
    channel: dto.channel,
    priority: dto.priority,
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
        } : null,
      })),
      approval: dto.positioning.approval ? {
        approvedBy: dto.positioning.approval.approved_by,
        opinion: dto.positioning.approval.opinion,
        approvedAt: new Date(dto.positioning.approval.approved_at),
        versionId: dto.positioning.approval.version_id,
      } : null,
    } : emptyPositioning(),
  }
}
