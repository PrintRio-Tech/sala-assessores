import type { LocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
import type { Demand, DemandOutcome, DemandStatus } from '@/domain/Demand/demand.entity'
import {
  DEMAND_OUTCOME_PUBLISHED_LABELS,
  demandOutcomeCaseScore,
  demandOutcomeHistoryLabel,
} from '@/domain/Demand/demand.entity'
import type { Journalist, JournalistDemandHistoryItem, RelationshipEvaluation } from '@/domain/Journalist/journalist.entity'
import { normalizeJournalistTopics } from '@/domain/Journalist/journalist-profile'
import { formatScore } from '@/shared/format'

type LinkedDemand = {
  id: string
  title: string
  journalistId: string
  status: DemandStatus
  updatedAt: Date
  topics: string[]
  hasPositioning: boolean
  kindLabel: string
  outcome: DemandOutcome | null
}

export type JournalistCaseOutcomeView = {
  demandId: string
  demandTitle: string
  toneScore: number
  published: DemandOutcome['published']
  publishedLabel: string
  usageScore: number | null
  caseScore: number
  caseScoreLabel: string
  resultSummary: string
  recordedBy: string
  recordedAt: Date
  historyLabel: string
}

export type JournalistProfileViewModel = Journalist & {
  caseOutcomes: JournalistCaseOutcomeView[]
  relationshipScore: number | null
  relationshipScoreLabel: string | null
}

const demandStatusLabels: Record<DemandStatus, string> = {
  in_progress: 'Em andamento',
  sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}

export function getJournalistDemandStatusLabel(status: string): string {
  return demandStatusLabels[status as DemandStatus] ?? status
}

export function computeJournalistRelationshipScore(
  evaluations: RelationshipEvaluation[],
  outcomes: DemandOutcome[],
): number | null {
  const samples: number[] = [
    ...evaluations.map((item) => item.score),
    ...outcomes.map(demandOutcomeCaseScore),
  ]
  if (samples.length === 0) return null
  return samples.reduce((sum, value) => sum + value, 0) / samples.length
}

function fromMockDemand(demand: Demand): LinkedDemand {
  return {
    id: demand.id,
    title: demand.title,
    journalistId: demand.journalistId,
    status: demand.status,
    updatedAt: demand.updatedAt,
    topics: demand.enrichment?.topics ?? [],
    hasPositioning: demand.interactions.some((item) => item.result === 'response_sent'),
    kindLabel: 'Demanda registrada',
    outcome: demand.outcome ?? null,
  }
}

function fromLocalDemand(demand: LocalDemandCapture): LinkedDemand {
  return {
    id: demand.id,
    title: demand.subject,
    journalistId: demand.journalistId,
    status: demand.status,
    updatedAt: demand.updatedAt,
    topics: demand.enrichment.topics,
    hasPositioning: demand.interactions.some((item) => item.result === 'response_sent'),
    kindLabel: 'Demanda local',
    outcome: demand.outcome ?? null,
  }
}

function toHistoryItem(demand: LinkedDemand): JournalistDemandHistoryItem {
  return {
    demandId: demand.id,
    title: demand.title,
    status: demand.status,
    occurredAt: demand.updatedAt,
    kindLabel: demand.kindLabel,
    outcomeLabel: demand.outcome ? demandOutcomeHistoryLabel(demand.outcome) : null,
  }
}

function toCaseOutcomeView(demand: LinkedDemand): JournalistCaseOutcomeView | null {
  if (!demand.outcome) return null
  const caseScore = demandOutcomeCaseScore(demand.outcome)
  return {
    demandId: demand.id,
    demandTitle: demand.title,
    toneScore: demand.outcome.toneScore,
    published: demand.outcome.published,
    publishedLabel: DEMAND_OUTCOME_PUBLISHED_LABELS[demand.outcome.published],
    usageScore: demand.outcome.usageScore,
    caseScore,
    caseScoreLabel: formatScore(caseScore),
    resultSummary: demand.outcome.resultSummary,
    recordedBy: demand.outcome.recordedBy,
    recordedAt: demand.outcome.recordedAt,
    historyLabel: demandOutcomeHistoryLabel(demand.outcome),
  }
}

export function buildJournalistProfileViewModel(
  journalist: Journalist,
  mockDemands: Demand[],
  localDemands: LocalDemandCapture[],
): JournalistProfileViewModel {
  const demandsById = new Map<string, LinkedDemand>()
  for (const demand of mockDemands) demandsById.set(demand.id, fromMockDemand(demand))
  // Registros locais incluem as mutações feitas nesta sessão e, por isso,
  // substituem o snapshot seed/adotado quando compartilham a mesma identidade.
  for (const demand of localDemands) demandsById.set(demand.id, fromLocalDemand(demand))

  const linkedDemands = [...demandsById.values()]
    .filter((demand) => demand.journalistId === journalist.id)
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())

  const totalDemands = linkedDemands.length
  const sentCount = linkedDemands.filter((demand) => demand.status === 'sent').length
  const positioningCount = linkedDemands.filter((demand) => demand.hasPositioning).length
  const derivedTopics = linkedDemands.flatMap((demand) => demand.topics)
  const caseOutcomes = linkedDemands
    .map(toCaseOutcomeView)
    .filter((item): item is JournalistCaseOutcomeView => item !== null)
    .sort((left, right) => right.recordedAt.getTime() - left.recordedAt.getTime())
  const relationshipScore = computeJournalistRelationshipScore(
    journalist.relationshipEvaluations,
    linkedDemands
      .map((demand) => demand.outcome)
      .filter((outcome): outcome is DemandOutcome => outcome != null),
  )

  return {
    ...journalist,
    topics: normalizeJournalistTopics([...derivedTopics, ...journalist.topics]),
    objectiveStats: {
      totalDemands,
      solicitedCount: totalDemands,
      proactiveCount: 0,
      successRate: totalDemands === 0 ? 0 : sentCount / totalDemands,
      positioningUsageRate: totalDemands === 0 ? 0 : positioningCount / totalDemands,
    },
    demandHistory: linkedDemands.map(toHistoryItem),
    caseOutcomes,
    relationshipScore,
    relationshipScoreLabel: relationshipScore == null ? null : formatScore(relationshipScore),
  }
}
