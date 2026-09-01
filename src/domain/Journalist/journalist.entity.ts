import { InvalidRelationshipEvaluationError } from './errors/journalist.errors'

export interface JournalistObjectiveStats {
  totalDemands: number
  solicitedCount: number
  proactiveCount: number
  successRate: number
  positioningUsageRate: number
}

export interface JournalistDemandHistoryItem {
  demandId: string
  title: string
  status: string
  occurredAt: Date
  kindLabel: string
}

export interface RelationshipEvaluation {
  id: string
  authorName: string
  recordedAt: Date
  score: number
  traits: string[]
  editorialToneLabel: string
  notes: string
}

export interface Journalist {
  id: string
  name: string
  roleTitle: string
  outletName: string
  desk: string
  email: string
  phone: string
  preferredChannel: 'email' | 'whatsapp' | 'phone'
  bestContactWindow: string
  topics: string[]
  isActive: boolean
  objectiveStats: JournalistObjectiveStats
  demandHistory: JournalistDemandHistoryItem[]
  relationshipEvaluations: RelationshipEvaluation[]
}

export type JournalistFactKind = 'outlet' | 'contact' | 'topic' | 'stat' | 'evaluation'

export interface JournalistFact {
  kind: JournalistFactKind
  label: string
  value: string
}

export function assertRelationshipEvaluation(
  evaluation: Omit<RelationshipEvaluation, 'id'> & { id?: string },
): void {
  if (!evaluation.authorName.trim()) {
    throw new InvalidRelationshipEvaluationError(
      'Avaliação de relacionamento exige autor identificado.',
    )
  }
  if (
    !(evaluation.recordedAt instanceof Date) ||
    Number.isNaN(evaluation.recordedAt.getTime())
  ) {
    throw new InvalidRelationshipEvaluationError(
      'Avaliação de relacionamento exige data de registro.',
    )
  }
  if (!Number.isFinite(evaluation.score) || evaluation.score < 1 || evaluation.score > 5) {
    throw new InvalidRelationshipEvaluationError(
      'Informe uma nota entre 1 e 5.',
    )
  }
  if (!evaluation.editorialToneLabel.trim()) {
    throw new InvalidRelationshipEvaluationError(
      'Informe o tom editorial observado.',
    )
  }
}

export function isObjectiveJournalistFact(fact: JournalistFact): boolean {
  return fact.kind !== 'evaluation'
}
