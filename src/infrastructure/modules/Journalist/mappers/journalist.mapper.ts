import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { JournalistDto } from '../DTOs/journalist.dto'

export function toDomain(dto: JournalistDto): Journalist {
  return {
    id: dto.id,
    name: dto.name,
    roleTitle: dto.role_title,
    outletName: dto.outlet_name,
    desk: dto.desk,
    email: dto.email,
    phone: dto.phone,
    preferredChannel: dto.preferred_channel,
    bestContactWindow: dto.best_contact_window,
    topics: [...dto.topics],
    isActive: dto.is_active,
    objectiveStats: {
      totalDemands: dto.objective_stats.total_demands,
      solicitedCount: dto.objective_stats.solicited_count,
      proactiveCount: dto.objective_stats.proactive_count,
      successRate: dto.objective_stats.success_rate,
      positioningUsageRate: dto.objective_stats.positioning_usage_rate,
    },
    demandHistory: dto.demand_history.map((item) => ({
      demandId: item.demand_id,
      title: item.title,
      status: item.status,
      occurredAt: new Date(item.occurred_at),
      kindLabel: item.kind_label,
    })),
    relationshipEvaluations: dto.relationship_evaluations.map((item) => ({
      id: item.id,
      authorName: item.author_name,
      recordedAt: new Date(item.recorded_at),
      score: item.score,
      traits: [...item.traits],
      editorialToneLabel: item.editorial_tone_label,
      notes: item.notes,
    })),
  }
}
