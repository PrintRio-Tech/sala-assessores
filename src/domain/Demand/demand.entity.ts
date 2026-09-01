export const DEMAND_STATUSES = [
  'draft',
  'in_progress',
  'pending_review',
  'changes_requested',
  'approved',
  'sent',
  'closed_without_send',
] as const

export type DemandStatus = (typeof DEMAND_STATUSES)[number]

export const DEMAND_ACTIVE_STATUSES = [
  'draft',
  'in_progress',
  'pending_review',
  'changes_requested',
  'approved',
] as const satisfies readonly DemandStatus[]

export const DEMAND_HISTORY_STATUSES = ['sent', 'closed_without_send'] as const satisfies readonly DemandStatus[]

export type DemandPriority = 'low' | 'medium' | 'high' | 'critical'

export type ExternalInteractionType =
  | 'phone'
  | 'email'
  | 'meeting'
  | 'legal_consult'
  | 'other'

export const EXTERNAL_INTERACTION_TYPES = ['phone', 'email', 'meeting', 'legal_consult', 'other'] as const satisfies readonly ExternalInteractionType[]

export const EXTERNAL_INTERACTION_RESULTS = [
  'waiting_response',
  'information_missing',
  'declined',
  'resolved',
  'forwarded',
  'other',
] as const

export type ExternalInteractionResult = (typeof EXTERNAL_INTERACTION_RESULTS)[number]

export type ExternalInteractionConditionalField = 'type' | 'participants' | 'summary' | 'nextStep'
export type ExternalInteractionFieldRule = {
  visible: boolean
  required: boolean
  label: string
  requiredMessage: string
}

const optionalField = (label: string): ExternalInteractionFieldRule => ({ visible: true, required: false, label, requiredMessage: '' })
const requiredField = (label: string, requiredMessage: string): ExternalInteractionFieldRule => ({ visible: true, required: true, label, requiredMessage })
const hiddenField = (label: string): ExternalInteractionFieldRule => ({ visible: false, required: false, label, requiredMessage: '' })

export const EXTERNAL_INTERACTION_RESULT_RULES = {
  waiting_response: {
    label: 'Aguardando retorno',
    fields: {
      type: optionalField('Tipo de interação'),
      participants: optionalField('Participantes ou área'),
      summary: optionalField('Observação'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  information_missing: {
    label: 'Faltou informação',
    fields: {
      type: optionalField('Tipo de interação'),
      participants: requiredField('Com quem/qual área?', 'Informe com quem ou qual área.'),
      summary: requiredField('O que faltou?', 'Informe o que faltou.'),
      nextStep: requiredField('Próximo passo', 'Informe o próximo passo ou encaminhamento.'),
    },
  },
  declined: {
    label: 'Recusado',
    fields: {
      type: optionalField('Tipo de interação'),
      participants: requiredField('Participantes ou área', 'Informe os participantes ou a área envolvida.'),
      summary: requiredField('Motivo da recusa', 'Informe o motivo da recusa.'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  resolved: {
    label: 'Resolvido',
    fields: {
      type: hiddenField('Tipo de interação'),
      participants: hiddenField('Participantes ou área'),
      summary: optionalField('Observação'),
      nextStep: hiddenField('Próximo passo'),
    },
  },
  forwarded: {
    label: 'Encaminhado',
    fields: {
      type: optionalField('Tipo de interação'),
      participants: requiredField('Para quem/qual área?', 'Informe para quem ou qual área.'),
      summary: requiredField('O que foi encaminhado?', 'Informe o que foi encaminhado.'),
      nextStep: requiredField('Próximo passo', 'Informe o próximo passo ou encaminhamento.'),
    },
  },
  other: {
    label: 'Outro',
    fields: {
      type: requiredField('Tipo de interação', 'Informe o tipo de interação.'),
      participants: requiredField('Participantes ou área', 'Informe os participantes ou a área envolvida.'),
      summary: requiredField('Resumo factual', 'Registre um resumo factual da interação.'),
      nextStep: optionalField('Próximo passo'),
    },
  },
} as const satisfies Record<ExternalInteractionResult, {
  label: string
  fields: Record<ExternalInteractionConditionalField, ExternalInteractionFieldRule>
}>

export function getExternalInteractionFieldErrors(
  result: ExternalInteractionResult,
  values: Partial<Record<ExternalInteractionConditionalField, string | null | undefined>>,
): Partial<Record<ExternalInteractionConditionalField, string>> {
  const errors: Partial<Record<ExternalInteractionConditionalField, string>> = {}
  const rules = EXTERNAL_INTERACTION_RESULT_RULES[result].fields
  for (const field of Object.keys(rules) as ExternalInteractionConditionalField[]) {
    if (rules[field].required && !values[field]?.trim()) errors[field] = rules[field].requiredMessage
  }
  return errors
}

export interface ExternalInteraction {
  id: string
  occurredAt: Date
  recordedBy?: string
  type: ExternalInteractionType | null
  result: ExternalInteractionResult
  participants: string | null
  summary: string | null
  nextStep: string | null
  origin: 'off_platform'
}

export function isExternalInteractionResult(value: unknown): value is ExternalInteractionResult {
  return typeof value === 'string' && (EXTERNAL_INTERACTION_RESULTS as readonly string[]).includes(value)
}

export function isExternalInteractionType(value: unknown): value is ExternalInteractionType {
  return typeof value === 'string' && (EXTERNAL_INTERACTION_TYPES as readonly string[]).includes(value)
}

export type DecisionOutcome = 'approved' | 'changes_requested' | 'rejected'

export interface DemandDecision {
  id: string
  decidedAt: Date
  consultedParty: string
  decision: DecisionOutcome
  rationale: string
  decidedBy?: string
}

export interface ReviewRequest {
  id: string
  requestedAt: Date
  requestedBy: string
  reviewer: string
  versionLabel: string
}

export interface DemandVersion {
  id: string
  versionLabel: string
  body: string
  createdAt: Date
  createdBy: string
}

export interface DemandStateTransition {
  id: string
  from: DemandStatus
  to: DemandStatus
  occurredAt: Date
  recordedBy: string
  trigger: 'enrichment' | 'review_requested' | 'decision' | 'new_version' | 'positioning_sent' | 'closed_without_send'
}

export interface FinalPositioning {
  versionLabel: string
  channel: string
  sentAt: Date
  recipient: string
  body: string
  recordedBy?: string
}

export interface DemandClosure {
  closedAt: Date
  closedBy: string
  reason: string
}

export interface DemandEnrichment {
  tags: string[]
  topics: string[]
  relatedAreas: string[]
  confirmedFacts: string[]
  pendingFacts: string[]
  nextStep: string | null
}

export interface Demand {
  id: string
  code: string
  title: string
  requestSummary: string
  journalistId: string
  journalistName: string
  outletName: string
  responsibleId: string
  responsibleName: string
  deadlineAt: Date
  priority: DemandPriority
  status: DemandStatus
  createdAt: Date
  updatedAt: Date
  interactions: ExternalInteraction[]
  decisions: DemandDecision[]
  finalPositioning: FinalPositioning | null
  reviewRequests?: ReviewRequest[]
  enrichment?: DemandEnrichment
  closure?: DemandClosure | null
  versions?: DemandVersion[]
  stateTransitions?: DemandStateTransition[]
}

export type DemandAction =
  | 'enrich'
  | 'register_interaction'
  | 'request_review'
  | 'record_decision'
  | 'record_version'
  | 'record_positioning'
  | 'close_without_send'

const nextActionsByStatus: Record<DemandStatus, DemandAction[]> = {
  draft: ['enrich'],
  in_progress: ['register_interaction', 'request_review', 'close_without_send'],
  pending_review: ['register_interaction', 'record_decision'],
  changes_requested: ['register_interaction', 'record_version', 'close_without_send'],
  approved: ['register_interaction', 'record_positioning', 'close_without_send'],
  sent: [],
  closed_without_send: [],
}

export function getDemandNextActions(status: DemandStatus): DemandAction[] {
  return [...nextActionsByStatus[status]]
}

export type DemandTransition =
  | { type: Exclude<DemandAction, 'record_decision'> }
  | { type: 'record_decision'; outcome: DecisionOutcome }

export function transitionDemand(status: DemandStatus, action: DemandTransition): DemandStatus {
  if (!nextActionsByStatus[status].includes(action.type)) {
    throw new Error(`A ação ${action.type} não está disponível no estado ${status}.`)
  }
  if (action.type === 'enrich') return 'in_progress'
  if (action.type === 'request_review') return 'pending_review'
  if (action.type === 'record_version') return 'in_progress'
  if (action.type === 'record_decision') return action.outcome === 'approved' ? 'approved' : 'changes_requested'
  if (action.type === 'record_positioning') return 'sent'
  if (action.type === 'close_without_send') return 'closed_without_send'
  return status
}

export function isDemandStatus(value: string): value is DemandStatus {
  return (DEMAND_STATUSES as readonly string[]).includes(value)
}

export function isActiveDemandStatus(status: DemandStatus): boolean {
  return (DEMAND_ACTIVE_STATUSES as readonly DemandStatus[]).includes(status)
}

export function partitionDemandsByLifecycle(items: Demand[]): {
  active: Demand[]
  history: Demand[]
} {
  const active: Demand[] = []
  const history: Demand[] = []

  for (const item of items) {
    if (isActiveDemandStatus(item.status)) {
      active.push(item)
    } else {
      history.push(item)
    }
  }

  return { active, history }
}
