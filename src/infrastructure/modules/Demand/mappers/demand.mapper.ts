import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandDto } from '../DTOs/demand.dto'

export function toDomain(dto: DemandDto): Demand {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    requestSummary: dto.request_summary,
    journalistId: dto.journalist_id,
    journalistName: dto.journalist_name,
    outletName: dto.outlet_name,
    responsibleId: dto.responsible_id,
    responsibleName: dto.responsible_name,
    deadlineAt: new Date(dto.deadline_at),
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
      origin: item.origin,
    })),
    decisions: dto.decisions.map((item) => ({
      id: item.id,
      decidedAt: new Date(item.decided_at),
      consultedParty: item.consulted_party,
      decision: item.decision,
      rationale: item.rationale,
    })),
    finalPositioning: dto.final_positioning
      ? {
          versionLabel: dto.final_positioning.version_label,
          channel: dto.final_positioning.channel,
          sentAt: new Date(dto.final_positioning.sent_at),
          recipient: dto.final_positioning.recipient,
          body: dto.final_positioning.body,
        }
      : null,
    enrichment: dto.enrichment ? {
      tags: dto.enrichment.tags, topics: dto.enrichment.topics, relatedAreas: dto.enrichment.related_areas,
      confirmedFacts: dto.enrichment.confirmed_facts, pendingFacts: dto.enrichment.pending_facts, nextStep: dto.enrichment.next_step,
    } : undefined,
    reviewRequests: dto.review_requests?.map((item) => ({
      id: item.id, requestedAt: new Date(item.requested_at), requestedBy: item.requested_by, reviewer: item.reviewer, versionLabel: item.version_label,
    })),
    versions: dto.versions?.map((item) => ({ id: item.id, versionLabel: item.version_label, body: item.body, createdAt: new Date(item.created_at), createdBy: item.created_by })),
    stateTransitions: dto.state_transitions?.map((item) => ({ id: item.id, from: item.from, to: item.to, occurredAt: new Date(item.occurred_at), recordedBy: item.recorded_by, trigger: item.trigger })),
    closure: dto.closure ? { closedAt: new Date(dto.closure.closed_at), closedBy: dto.closure.closed_by, reason: dto.closure.reason } : null,
  }
}
