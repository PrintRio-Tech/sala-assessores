import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type {
  NewJournalist,
  NewRelationshipEvaluation,
  UpdateJournalistInput,
} from '@/domain/Journalist/journalist.repository'
import type { GraphQLJournalistDto } from '../DTOs/graphql-journalist.dto'

export function toDomain(dto: GraphQLJournalistDto): Journalist {
  return {
    id: dto.id,
    name: dto.name,
    roleTitle: dto.roleTitle,
    outletName: dto.outletName,
    desk: dto.desk,
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    preferredChannel: dto.preferredChannel,
    bestContactWindow: dto.bestContactWindow,
    topics: [...dto.topics],
    isActive: dto.isActive,
    objectiveStats: {
      totalDemands: dto.objectiveStats.totalDemands,
      solicitedCount: dto.objectiveStats.solicitedCount,
      proactiveCount: dto.objectiveStats.proactiveCount,
      successRate: dto.objectiveStats.successRate,
      positioningUsageRate: dto.objectiveStats.positioningUsageRate,
    },
    demandHistory: (dto.demandHistory ?? []).map((item) => ({
      demandId: item.demandId,
      title: item.title,
      status: item.status,
      occurredAt: new Date(item.occurredAt),
      kindLabel: item.kindLabel,
      outcomeLabel: item.outcomeLabel,
    })),
    relationshipEvaluations: dto.relationshipEvaluations.map((item) => ({
      id: item.id,
      authorName: item.authorName,
      recordedAt: new Date(item.recordedAt),
      score: item.score,
      traits: [...item.traits],
      editorialToneLabel: item.editorialToneLabel,
      notes: item.notes,
    })),
  }
}

function emptyToUndefined(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function toCreateJournalistInput(input: NewJournalist) {
  const initial = input.relationshipEvaluations[0]
  return {
    name: input.name,
    roleTitle: emptyToUndefined(input.roleTitle),
    outletName: input.outletName,
    desk: emptyToUndefined(input.desk),
    email: emptyToUndefined(input.email),
    phone: emptyToUndefined(input.phone),
    preferredChannel: input.preferredChannel,
    bestContactWindow: emptyToUndefined(input.bestContactWindow),
    topics: input.topics,
    isActive: input.isActive,
    initialScore: initial?.score,
    initialScoreAuthorName: emptyToUndefined(initial?.authorName),
  }
}

export function toUpdateJournalistInput(input: UpdateJournalistInput): Record<string, unknown> {
  return {
    name: input.name,
    roleTitle: emptyToUndefined(input.roleTitle),
    outletName: input.outletName,
    desk: emptyToUndefined(input.desk),
    email: emptyToUndefined(input.email),
    phone: emptyToUndefined(input.phone),
    preferredChannel: input.preferredChannel,
    bestContactWindow: emptyToUndefined(input.bestContactWindow),
    topics: input.topics,
    isActive: input.isActive,
  }
}

export function toAddRelationshipEvaluationInput(
  journalistId: string,
  input: NewRelationshipEvaluation,
) {
  return {
    journalistId,
    score: input.score,
    traits: input.traits,
    editorialToneLabel: input.editorialToneLabel,
    notes: emptyToUndefined(input.notes),
  }
}
