import { DemandInteractionNotAllowedError, PositioningNotEditableError, PositioningTextRequiredError } from './errors/demand.errors'

export const DEMAND_STATUSES = [
  'in_progress',
  'sent',
  'closed_without_send',
] as const

export type DemandStatus = (typeof DEMAND_STATUSES)[number]

export const DEMAND_ACTIVE_STATUSES = [
  'in_progress',
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
  'forwarded',
  'information_missing',
  'declined',
  'approved',
  'other',
  'response_sent',
  'closed_without_send',
] as const

export type ExternalInteractionResult = (typeof EXTERNAL_INTERACTION_RESULTS)[number]

export type ExternalInteractionConditionalField = 'type' | 'participants' | 'summary' | 'nextStep' | 'channel' | 'recipient' | 'body'
export type ExternalInteractionFieldRule = {
  visible: boolean
  required: boolean
  label: string
  requiredMessage: string
}

const optionalField = (label: string): ExternalInteractionFieldRule => ({ visible: true, required: false, label, requiredMessage: '' })
const requiredField = (label: string, requiredMessage: string): ExternalInteractionFieldRule => ({ visible: true, required: true, label, requiredMessage })
const hiddenField = (label: string): ExternalInteractionFieldRule => ({ visible: false, required: false, label, requiredMessage: '' })

const hiddenStandardFields = {
  type: hiddenField('Tipo de interação'),
  participants: hiddenField('Participantes ou área'),
  summary: hiddenField('Observação'),
  nextStep: hiddenField('Próximo passo'),
  channel: hiddenField('Canal'),
  recipient: hiddenField('Destinatário'),
  body: hiddenField('Texto enviado'),
}

export const EXTERNAL_INTERACTION_RESULT_RULES = {
  waiting_response: {
    label: 'Aguardando retorno',
    fields: {
      ...hiddenStandardFields,
      type: optionalField('Tipo de interação'),
      participants: optionalField('Participantes ou área'),
      summary: optionalField('Observação'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  forwarded: {
    label: 'Encaminhado',
    fields: {
      ...hiddenStandardFields,
      type: optionalField('Tipo de interação'),
      participants: requiredField('Para quem/qual área?', 'Informe para quem ou qual área.'),
      summary: requiredField('O que foi encaminhado?', 'Informe o que foi encaminhado.'),
      nextStep: requiredField('Próximo passo', 'Informe o próximo passo ou encaminhamento.'),
    },
  },
  information_missing: {
    label: 'Faltou informação ou ajustes',
    fields: {
      ...hiddenStandardFields,
      type: optionalField('Tipo de interação'),
      participants: requiredField('Com quem/qual área?', 'Informe com quem ou qual área.'),
      summary: requiredField('O que faltou ou o que pediram?', 'Informe o que faltou ou o que pediram.'),
      nextStep: requiredField('Próximo passo', 'Informe o próximo passo ou encaminhamento.'),
    },
  },
  declined: {
    label: 'Recusado',
    fields: {
      ...hiddenStandardFields,
      type: optionalField('Tipo de interação'),
      participants: requiredField('Participantes ou área', 'Informe os participantes ou a área envolvida.'),
      summary: requiredField('Motivo da recusa', 'Informe o motivo da recusa.'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  approved: {
    label: 'Aprovado',
    fields: {
      ...hiddenStandardFields,
      type: optionalField('Tipo de interação'),
      participants: requiredField('Quem aprovou / área', 'Informe quem aprovou ou a área.'),
      summary: requiredField('Parecer', 'Informe o parecer.'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  other: {
    label: 'Outro',
    fields: {
      ...hiddenStandardFields,
      type: requiredField('Tipo de interação', 'Informe o tipo de interação.'),
      participants: requiredField('Participantes ou área', 'Informe os participantes ou a área envolvida.'),
      summary: requiredField('Resumo factual', 'Registre um resumo factual da interação.'),
      nextStep: optionalField('Próximo passo'),
    },
  },
  response_sent: {
    label: 'Resposta enviada',
    fields: {
      ...hiddenStandardFields,
      channel: requiredField('Canal', 'Informe o canal.'),
      recipient: requiredField('Destinatário', 'Informe o destinatário.'),
      body: requiredField('Texto enviado', 'Informe o texto enviado.'),
    },
  },
  closed_without_send: {
    label: 'Encerrado sem resposta',
    fields: {
      ...hiddenStandardFields,
      summary: requiredField('Motivo do encerramento', 'Informe o motivo do encerramento.'),
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
  channel: string | null
  recipient: string | null
  body: string | null
  origin: 'off_platform'
  positioningVersionId?: string | null
}

export function isExternalInteractionResult(value: unknown): value is ExternalInteractionResult {
  return typeof value === 'string' && (EXTERNAL_INTERACTION_RESULTS as readonly string[]).includes(value)
}

export function isExternalInteractionType(value: unknown): value is ExternalInteractionType {
  return typeof value === 'string' && (EXTERNAL_INTERACTION_TYPES as readonly string[]).includes(value)
}

export interface DemandStateTransition {
  id: string
  from: DemandStatus
  to: DemandStatus
  occurredAt: Date
  recordedBy: string
  trigger: 'response_sent' | 'closed_without_send'
}

export const POSITIONING_STATES = ['empty', 'draft', 'approved', 'sent'] as const
export type PositioningState = (typeof POSITIONING_STATES)[number]

export const POSITIONING_STATE_LABELS: Record<PositioningState, string> = {
  empty: 'Vazio',
  draft: 'Rascunho',
  approved: 'Aprovado',
  sent: 'Enviado',
}

export interface PositioningVersion {
  id: string
  body: string
  author: string
  savedAt: Date
}

export interface PositioningApproval {
  approvedBy: string
  opinion: string
  approvedAt: Date
  versionId: string
}

export interface DemandPositioning {
  state: PositioningState
  versions: PositioningVersion[]
  approval: PositioningApproval | null
}

export function emptyPositioning(): DemandPositioning {
  return { state: 'empty', versions: [], approval: null }
}

export function currentPositioningBody(positioning: DemandPositioning): string {
  return positioning.versions.at(-1)?.body ?? ''
}

export function canEditPositioning(status: DemandStatus): boolean {
  return status === 'in_progress'
}

export function savePositioningVersion(
  positioning: DemandPositioning,
  input: { id: string; body: string; author: string; savedAt: Date },
  demandStatus: DemandStatus,
): DemandPositioning {
  if (!canEditPositioning(demandStatus)) throw new PositioningNotEditableError()
  const body = input.body.trim()
  if (!body) throw new PositioningTextRequiredError('Informe o texto do posicionamento.')
  return {
    state: 'draft',
    versions: [...positioning.versions, { id: input.id, body, author: input.author.trim() || 'Autoria não informada', savedAt: input.savedAt }],
    approval: null,
  }
}

export function applyInteractionToPositioning(
  positioning: DemandPositioning,
  input: {
    result: ExternalInteractionResult
    approvedBy?: string
    opinion?: string
    occurredAt?: Date
  },
): DemandPositioning {
  if (input.result === 'approved') {
    const version = positioning.versions.at(-1)
    const body = currentPositioningBody(positioning)
    if (!version || !body) throw new PositioningTextRequiredError('Salve o texto do posicionamento antes de registrar a aprovação.')
    return {
      ...positioning,
      state: 'approved',
      approval: {
        approvedBy: input.approvedBy?.trim() || 'Autoria não informada',
        opinion: input.opinion?.trim() || '',
        approvedAt: input.occurredAt ?? new Date(),
        versionId: version.id,
      },
    }
  }
  if (input.result === 'response_sent') {
    return { ...positioning, state: 'sent' }
  }
  return positioning
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
  factContext?: string
  journalistId: string
  journalistName: string
  outletName: string
  responsibleId: string
  responsibleName: string
  deadlineAt: Date
  channel?: string
  priority: DemandPriority
  status: DemandStatus
  createdAt: Date
  updatedAt: Date
  interactions: ExternalInteraction[]
  positioning?: DemandPositioning
  enrichment?: DemandEnrichment
  stateTransitions?: DemandStateTransition[]
}

export type DemandAction = 'write_positioning' | 'register_interaction'

const nextActionsByStatus: Record<DemandStatus, DemandAction[]> = {
  in_progress: ['write_positioning', 'register_interaction'],
  sent: [],
  closed_without_send: [],
}

export function getDemandNextActions(status: DemandStatus): DemandAction[] {
  return [...nextActionsByStatus[status]]
}

export type DemandTransition = { type: 'register_interaction'; result: ExternalInteractionResult }

export function transitionDemand(status: DemandStatus, action: DemandTransition): DemandStatus {
  if (!nextActionsByStatus[status].includes(action.type)) {
    throw new DemandInteractionNotAllowedError()
  }
  if (action.result === 'response_sent') return 'sent'
  if (action.result === 'closed_without_send') return 'closed_without_send'
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

export type DemandListLifecycle = 'active' | 'history'
export type DemandListStatusFilter = DemandStatus | 'all'

export function getDemandStatusFilterValues(lifecycle: DemandListLifecycle): DemandListStatusFilter[] {
  if (lifecycle === 'history') return ['all', ...DEMAND_HISTORY_STATUSES]
  return ['all', ...DEMAND_ACTIVE_STATUSES]
}

export function sanitizeDemandListStatus(
  status: DemandListStatusFilter,
  lifecycle: DemandListLifecycle,
): DemandListStatusFilter {
  return getDemandStatusFilterValues(lifecycle).includes(status) ? status : 'all'
}
