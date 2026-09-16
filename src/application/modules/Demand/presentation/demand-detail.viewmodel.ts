import {
  DEMAND_OUTCOME_PUBLISHED_LABELS,
  EXTERNAL_INTERACTION_RESULT_RULES,
  POSITIONING_STATE_LABELS,
  canRegisterDemandOutcome,
  currentPositioningAttachment,
  currentPositioningBody,
  emptyPositioning,
  getDemandNextActions,
  hasPositioningContent,
  type Demand,
  type DemandOutcome,
  type DemandPositioning,
  type DemandStatus,
  type ExternalInteractionType,
  type PositioningAttachment,
} from '@/domain/Demand/demand.entity'
import type { LocalDemandCapture } from '../stores/local-demand.store'
import { DEMAND_PRIORITY_LABELS } from './demand-priority'

const statusLabels: Record<DemandStatus, string> = {
  in_progress: 'Em andamento',
  sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}

const interactionLabels: Record<ExternalInteractionType, string> = {
  phone: 'Telefonema', email: 'E-mail', meeting: 'Reunião', legal_consult: 'Consulta jurídica', other: 'Outro contato',
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value)
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value)
}

function formatCompactDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(value)
}

function dateTime(value: Date) {
  return { iso: value.toISOString(), dateLabel: formatDate(value), timeLabel: formatTime(value), shortDate: formatCompactDate(value) }
}

type DemandEnrichmentView = {
  tags: string[]
  topics: string[]
  relatedAreas: string[]
  confirmedFacts: string[]
  pendingFacts: string[]
  nextStep: string | null
}

function enrichmentTimelineEvent(
  id: string,
  enrichment: DemandEnrichmentView,
  occurredAt: Date,
  actor: string,
): DemandDetailTimelineEvent | null {
  const confirmed = enrichment.confirmedFacts.filter(Boolean)
  const pending = enrichment.pendingFacts.filter(Boolean)
  if (!confirmed.length && !pending.length && !enrichment.nextStep) return null
  return {
    id: `${id}-enrichment`,
    kind: 'enrichment',
    title: 'Apuração registrada',
    actor,
    attribution: 'Registro da assessoria',
    description: [
      confirmed.length ? `Fatos confirmados: ${confirmed.join(' · ')}` : null,
      pending.length ? `Pendências: ${pending.join(' · ')}` : null,
    ].filter(Boolean).join(' ') || null,
    nextStep: enrichment.nextStep,
    isAttention: false,
    isCurrent: false,
    ...dateTime(occurredAt),
  }
}

function compareTimeline(left: DemandDetailTimelineEvent, right: DemandDetailTimelineEvent) {
  if (left.isCurrent !== right.isCurrent) return Number(right.isCurrent) - Number(left.isCurrent)
  return right.iso.localeCompare(left.iso)
}

export const POSITIONING_EXCERPT_LIMIT = 180
export const POSITIONING_CARD_PREVIEW_LIMIT = 280

export function excerptText(body: string, limit: number): { excerpt: string; isTruncated: boolean } {
  const trimmed = body.trim()
  if (!trimmed) return { excerpt: '', isTruncated: false }
  if (trimmed.length <= limit) return { excerpt: trimmed, isTruncated: false }
  return { excerpt: `${trimmed.slice(0, limit).trimEnd()}…`, isTruncated: true }
}

export type DemandDetailTimelineEvent = {
  id: string
  kind: 'request' | 'interaction' | 'state_change' | 'current' | 'enrichment' | 'positioning_version'
  title: string
  actor: string | null
  participants?: string | null
  attribution: string
  description: string | null
  nextStep?: string | null
  isAttention: boolean
  isCurrent: boolean
  iso: string
  dateLabel: string
  timeLabel: string
  hasBody?: boolean
  isTruncated?: boolean
  attachment?: PositioningAttachment | null
}

function outcomeView(outcome: DemandOutcome | null | undefined) {
  if (!outcome) return null
  return {
    toneScore: outcome.toneScore,
    published: outcome.published,
    publishedLabel: DEMAND_OUTCOME_PUBLISHED_LABELS[outcome.published],
    usageScore: outcome.usageScore,
    resultSummary: outcome.resultSummary,
    recordedBy: outcome.recordedBy,
    recordedAt: dateTime(outcome.recordedAt),
  }
}

function positioningView(positioning: DemandPositioning | undefined, status: DemandStatus) {
  const artifact = positioning ?? emptyPositioning()
  const body = currentPositioningBody(artifact)
  const attachment = currentPositioningAttachment(artifact)
  const hasContent = hasPositioningContent(artifact)
  const preview = excerptText(body, POSITIONING_CARD_PREVIEW_LIMIT)
  return {
    state: artifact.state,
    stateLabel: POSITIONING_STATE_LABELS[artifact.state],
    body,
    attachment,
    hasBody: Boolean(body),
    isTruncated: preview.isTruncated,
    excerpt: preview.excerpt,
    isEmpty: artifact.state === 'empty' || !hasContent,
    canEdit: status === 'in_progress',
    writeLabel: hasContent ? 'Atualizar posicionamento' : 'Escrever posicionamento',
    primaryAction: (!hasContent ? 'write_positioning' : 'register_interaction') as 'write_positioning' | 'register_interaction',
    approval: artifact.approval,
    versions: artifact.versions,
  }
}

function positioningTimelineEvents(positioning: DemandPositioning | undefined): DemandDetailTimelineEvent[] {
  return (positioning ?? emptyPositioning()).versions.map((item) => {
    const preview = excerptText(item.body, POSITIONING_EXCERPT_LIMIT)
    return {
      id: item.id,
      kind: 'positioning_version' as const,
      title: 'Versão salva',
      actor: item.author,
      attribution: 'Posicionamento',
      description: preview.excerpt || null,
      hasBody: Boolean(item.body.trim()),
      isTruncated: preview.isTruncated,
      attachment: item.attachment,
      isAttention: false,
      isCurrent: false,
      ...dateTime(item.savedAt),
    }
  })
}

function mapInteractions(
  items: Demand['interactions'] | LocalDemandCapture['interactions'],
  positioning?: DemandPositioning,
) {
  return [...items]
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
    .map((item) => {
      const mapped = {
        id: item.id,
        typeLabel: item.type ? interactionLabels[item.type] : null,
        resultLabel: EXTERNAL_INTERACTION_RESULT_RULES[item.result].label,
        recordedBy: item.recordedBy ?? 'Autoria não informada',
        participants: item.participants,
        summary: item.summary ?? item.body,
        nextStep: item.nextStep,
        channel: item.channel,
        recipient: item.recipient,
        body: item.body,
        originLabel: 'Fora da plataforma' as const,
        closesCase: item.result === 'response_sent' || item.result === 'closed_without_send',
        positioningVersionId: item.positioningVersionId ?? null,
        ...dateTime(item.occurredAt),
      }
      return { ...mapped, description: describeInteraction(mapped, positioning) }
    })
}

function interactionTitle(item: ReturnType<typeof mapInteractions>[number]) {
  if (item.resultLabel === 'Resposta enviada' && item.channel) return `Resposta enviada · ${item.channel}`
  return [item.typeLabel, item.resultLabel].filter(Boolean).join(' · ')
}

function describeInteraction(
  item: {
    resultLabel: string
    channel: string | null
    recipient: string | null
    body: string | null
    summary: string | null
    positioningVersionId: string | null
  },
  positioning?: DemandPositioning,
): string | null {
  if (item.resultLabel === 'Resposta enviada') {
    return [item.recipient ? `Destinatário: ${item.recipient}` : null, item.body].filter(Boolean).join('\n') || item.summary
  }
  if (item.resultLabel === 'Aprovado') {
    const tied = positioning?.versions.find((version) => version.id === item.positioningVersionId)?.body
      ?? currentPositioningBody(positioning ?? emptyPositioning())
    return [item.summary, tied].filter(Boolean).join('\n') || null
  }
  return item.summary
}

export function buildDemandDetailViewModel(demand: Demand) {
  const interactions = mapInteractions(demand.interactions, demand.positioning)
  const latestInteraction = interactions.at(-1)
  const enrichment = demand.enrichment ?? { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null }
  const recordedNextStep = [...interactions].reverse().find((item) => item.nextStep)?.nextStep ?? enrichment.nextStep
  const validNextActions = getDemandNextActions(demand.status)
  const positioning = positioningView(demand.positioning, demand.status)
  const stateEvents: DemandDetailTimelineEvent[] = (demand.stateTransitions ?? []).map((item) => ({
    id: item.id, kind: 'state_change', title: statusLabels[item.to], actor: item.recordedBy,
    attribution: `Mudança de estado · ${statusLabels[item.from]} → ${statusLabels[item.to]}`, description: null,
    isAttention: item.to === 'closed_without_send', isCurrent: false, ...dateTime(item.occurredAt),
  }))

  const timeline: DemandDetailTimelineEvent[] = [
    {
      id: 'request', kind: 'request' as const, title: 'Demanda registrada', actor: demand.journalistName,
      attribution: `${demand.outletName} · solicitação registrada`, description: null,
      isAttention: false, isCurrent: false, ...dateTime(demand.createdAt),
    },
    ...interactions.map((item) => ({
      id: item.id, kind: 'interaction' as const, title: interactionTitle(item), actor: item.recordedBy,
      participants: item.participants,
      attribution: interactionAttribution(item.originLabel, item.participants),
      description: item.description,
      nextStep: item.nextStep,
      isAttention: item.closesCase && item.resultLabel === 'Encerrado sem resposta',
      isCurrent: false, iso: item.iso, dateLabel: item.dateLabel, timeLabel: item.timeLabel,
    })),
    ...stateEvents,
    ...positioningTimelineEvents(demand.positioning),
    ...[enrichmentTimelineEvent(demand.id, enrichment, demand.updatedAt, demand.responsibleName)].filter(
      (event): event is DemandDetailTimelineEvent => event !== null,
    ),
    {
      id: 'current', kind: 'current' as const, title: statusLabels[demand.status], actor: demand.responsibleName,
      attribution: 'Estado atual · última atualização do registro · responsável atribuído', description: `Estado atual registrado: ${statusLabels[demand.status]}.`,
      isAttention: false, isCurrent: true, ...dateTime(demand.updatedAt),
    },
  ].sort(compareTimeline)

  return {
    id: demand.id,
    identity: {
      code: demand.code,
      title: demand.title,
      journalistId: demand.journalistId,
      journalistName: demand.journalistName,
      outletName: demand.outletName,
      responsibleName: demand.responsibleName,
      priorityLabel: DEMAND_PRIORITY_LABELS[demand.priority],
      statusLabel: statusLabels[demand.status],
      deadline: dateTime(demand.deadlineAt),
    },
    requestSummary: demand.requestSummary,
    factContext: demand.factContext ?? '',
    sourceChannel: demand.channel?.trim() ?? '',
    createdByName: null,
    enrichment,
    validNextActions,
    canWritePositioning: validNextActions.includes('write_positioning') && positioning.canEdit,
    canRegisterInteraction: validNextActions.includes('register_interaction'),
    canRegisterOutcome: canRegisterDemandOutcome(demand.status),
    outcome: outcomeView(demand.outcome),
    positioning,
    interactions,
    currentState: {
      statusLabel: statusLabels[demand.status],
      responsibleName: demand.responsibleName,
      latestRecordedNextStep: recordedNextStep,
      latestInteractionResult: latestInteraction?.resultLabel ?? null,
      updatedAt: dateTime(demand.updatedAt),
    },
    lifecycle: {
      createdAt: dateTime(demand.createdAt),
      updatedAt: dateTime(demand.updatedAt),
    },
    timeline,
  }
}

export function buildLocalDemandDetailViewModel(record: LocalDemandCapture) {
  const capturedAt = dateTime(record.createdAt)
  const updatedAt = dateTime(record.updatedAt)
  const sourceLabel = `${record.contactName || record.journalistName} · ${record.contactOutlet || record.outletName}`
  const localDeadline = /^\d{4}-\d{2}-\d{2}$/.test(record.requestedDeadline)
    ? record.requestedDeadline.split('-').reverse().join('/')
    : record.requestedDeadline
  const brDate = record.requestedDeadline.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const localDeadlineShort = /^\d{4}-\d{2}-\d{2}$/.test(record.requestedDeadline)
    ? `${record.requestedDeadline.slice(8, 10)}/${record.requestedDeadline.slice(5, 7)}/${record.requestedDeadline.slice(2, 4)}`
    : brDate
      ? `${brDate[1]}/${brDate[2]}/${brDate[3].slice(2)}`
      : localDeadline
  const interactions = mapInteractions(record.interactions, record.positioning)
  const validNextActions = getDemandNextActions(record.status)
  const positioning = positioningView(record.positioning, record.status)
  const stateEvents: DemandDetailTimelineEvent[] = record.stateTransitions.map((item) => ({
    id: item.id, kind: 'state_change', title: statusLabels[item.to], actor: item.recordedBy,
    attribution: `Mudança de estado · ${statusLabels[item.from]} → ${statusLabels[item.to]}`, description: null,
    isAttention: item.to === 'closed_without_send', isCurrent: false, ...dateTime(item.occurredAt),
  }))
  const timeline: DemandDetailTimelineEvent[] = [
    {
      id: `${record.id}-received`,
      kind: 'request' as const,
      title: 'Demanda registrada',
      actor: sourceLabel,
      attribution: `${record.channel} · registro local`,
      description: null,
      isAttention: false,
      isCurrent: false,
      ...capturedAt,
    },
    ...interactions.map((item) => ({
      id: item.id,
      kind: 'interaction' as const,
      title: interactionTitle(item),
      actor: item.recordedBy,
      participants: item.participants,
      attribution: interactionAttribution(item.originLabel, item.participants),
      description: item.description,
      nextStep: item.nextStep,
      isAttention: item.closesCase && item.resultLabel === 'Encerrado sem resposta',
      isCurrent: false,
      iso: item.iso,
      dateLabel: item.dateLabel,
      timeLabel: item.timeLabel,
    })),
    ...stateEvents,
    ...positioningTimelineEvents(record.positioning),
    ...[enrichmentTimelineEvent(record.id, record.enrichment, record.updatedAt, record.responsibleName)].filter(
      (event): event is DemandDetailTimelineEvent => event !== null,
    ),
    {
      id: `${record.id}-local`,
      kind: 'current' as const,
      title: statusLabels[record.status],
      actor: record.responsibleName,
      attribution: 'Estado atual · registro local desta sessão',
      description: `Estado atual registrado: ${statusLabels[record.status]}.`,
      isAttention: false,
      isCurrent: true,
      ...updatedAt,
    },
  ].sort(compareTimeline)

  return {
    id: record.id,
    isLocal: true as const,
    identity: {
      code: record.code,
      title: record.subject,
      journalistId: record.journalistId === 'unidentified' ? '' : record.journalistId,
      journalistName: record.journalistName,
      outletName: record.outletName,
      responsibleName: record.responsibleName,
      priorityLabel: record.priority ? DEMAND_PRIORITY_LABELS[record.priority] : null,
      statusLabel: statusLabels[record.status],
      deadline: { dateLabel: 'Prazo solicitado', timeLabel: localDeadline, shortDate: localDeadlineShort, iso: '' },
    },
    requestSummary: record.pressRequest,
    factContext: record.factContext,
    createdByName: record.createdBy && record.createdBy.name !== record.responsibleName ? record.createdBy.name : null,
    enrichment: record.enrichment,
    validNextActions,
    canWritePositioning: validNextActions.includes('write_positioning') && positioning.canEdit,
    canRegisterInteraction: validNextActions.includes('register_interaction'),
    canRegisterOutcome: canRegisterDemandOutcome(record.status),
    outcome: outcomeView(record.outcome),
    positioning,
    sourceChannel: record.channel,
    localCapture: {
      requestedDeadline: localDeadline,
      journalistName: record.contactName || record.journalistName,
      outletName: record.contactOutlet || record.outletName,
      responsibleId: record.responsibleId,
    },
    interactions,
    currentState: {
      statusLabel: statusLabels[record.status],
      responsibleName: record.responsibleName,
      latestRecordedNextStep: record.enrichment.nextStep ?? [...interactions].reverse().find((item) => item.nextStep)?.nextStep ?? null,
      latestInteractionResult: interactions.at(-1)?.resultLabel ?? null,
      updatedAt,
    },
    lifecycle: { createdAt: capturedAt, updatedAt },
    timeline,
  }
}

export type DemandDetailViewModel = ReturnType<typeof buildDemandDetailViewModel> | ReturnType<typeof buildLocalDemandDetailViewModel>

function interactionAttribution(origin: string, participants: string | null): string {
  return participants ? `${origin} · Participantes: ${participants}` : origin
}
