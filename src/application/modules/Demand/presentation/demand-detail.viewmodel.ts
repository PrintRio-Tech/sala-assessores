import { EXTERNAL_INTERACTION_RESULT_RULES, getDemandNextActions, type Demand, type DemandStatus, type DemandPriority, type ExternalInteractionType, type DecisionOutcome } from '@/domain/Demand/demand.entity'
import type { LocalDemandCapture } from '../stores/local-demand.store'

const statusLabels: Record<DemandStatus, string> = {
  draft: 'Rascunho',
  in_progress: 'Em andamento',
  pending_review: 'Em review',
  changes_requested: 'Ajustes solicitados',
  approved: 'Aprovada',
  sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}

const priorityLabels: Record<DemandPriority, string> = {
  critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa',
}

const interactionLabels: Record<ExternalInteractionType, string> = {
  phone: 'Telefonema', email: 'E-mail', meeting: 'Reunião', legal_consult: 'Consulta jurídica', other: 'Outro contato',
}

const decisionLabels: Record<DecisionOutcome, string> = {
  approved: 'Aprovado', changes_requested: 'Ajustes solicitados', rejected: 'Reprovado',
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value)
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value)
}

function dateTime(value: Date) {
  return { iso: value.toISOString(), dateLabel: formatDate(value), timeLabel: formatTime(value) }
}

export type DemandDetailTimelineEvent = {
  id: string
  kind: 'request' | 'interaction' | 'review' | 'version' | 'decision' | 'positioning' | 'closure' | 'state_change' | 'current'
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
}

export function buildDemandDetailViewModel(demand: Demand) {
  const interactions = [...demand.interactions]
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
    .map((item) => ({
    id: item.id,
    typeLabel: item.type ? interactionLabels[item.type] : null,
    resultLabel: EXTERNAL_INTERACTION_RESULT_RULES[item.result].label,
    recordedBy: item.recordedBy ?? 'Autoria não informada',
    participants: item.participants,
    summary: item.summary,
    nextStep: item.nextStep,
    originLabel: 'Fora da plataforma' as const,
    ...dateTime(item.occurredAt),
    }))
  const decisions = demand.decisions.map((item) => ({
    id: item.id,
    consultedParty: item.consultedParty,
    outcomeLabel: decisionLabels[item.decision],
    rationale: item.rationale,
    ...dateTime(item.decidedAt),
  }))
  const positioning = demand.finalPositioning
    ? {
        state: 'recorded' as const,
        label: `Posicionamento final ${demand.finalPositioning.versionLabel}`,
        channel: demand.finalPositioning.channel,
        recipient: demand.finalPositioning.recipient,
        body: demand.finalPositioning.body,
        ...dateTime(demand.finalPositioning.sentAt),
      }
    : { state: 'missing' as const, label: 'Sem posicionamento final registrado' }
  const latestDecision = decisions.at(-1)
  const latestInteraction = interactions.at(-1)
  const recordedNextStep = [...interactions].reverse().find((item) => item.nextStep)?.nextStep ?? null
  const reviewEvents: DemandDetailTimelineEvent[] = (demand.reviewRequests ?? []).map((item) => ({
    id: item.id, kind: 'review', title: `Review solicitado · ${item.versionLabel}`, actor: item.requestedBy,
    attribution: `Solicitação registrada · revisão por ${item.reviewer}`, description: `Artefato ${item.versionLabel} encaminhado para review.`,
    isAttention: false, isCurrent: false, ...dateTime(item.requestedAt),
  }))
  const versionEvents: DemandDetailTimelineEvent[] = (demand.versions ?? []).map((item) => ({
    id: item.id, kind: 'version', title: `Nova versão · ${item.versionLabel}`, actor: item.createdBy,
    attribution: 'Artefato registrado · conteúdo versionado', description: item.body,
    isAttention: false, isCurrent: false, ...dateTime(item.createdAt),
  }))
  const stateEvents: DemandDetailTimelineEvent[] = (demand.stateTransitions ?? []).map((item) => ({
    id: item.id, kind: 'state_change', title: statusLabels[item.to], actor: item.recordedBy,
    attribution: `Mudança de estado · ${statusLabels[item.from]} → ${statusLabels[item.to]}`, description: null,
    isAttention: item.to === 'changes_requested', isCurrent: false, ...dateTime(item.occurredAt),
  }))

  const timeline: DemandDetailTimelineEvent[] = [
    {
      id: 'request', kind: 'request' as const, title: 'Pedido original', actor: demand.journalistName,
      attribution: `${demand.outletName} · solicitação registrada`, description: demand.requestSummary,
      isAttention: false, isCurrent: false, ...dateTime(demand.createdAt),
    },
    ...interactions.map((item) => ({
      id: item.id, kind: 'interaction' as const, title: [item.typeLabel, item.resultLabel].filter(Boolean).join(' · '), actor: item.recordedBy,
      participants: item.participants,
      attribution: interactionAttribution(item.originLabel, item.participants), description: item.summary, nextStep: item.nextStep,
      isAttention: false, isCurrent: false, iso: item.iso, dateLabel: item.dateLabel, timeLabel: item.timeLabel,
    })),
    ...reviewEvents,
    ...versionEvents,
    ...decisions.map((item) => ({
      id: item.id, kind: 'decision' as const, title: item.outcomeLabel, actor: item.consultedParty,
      attribution: 'Decisão atribuída e registrada', description: item.rationale,
      isAttention: item.outcomeLabel !== 'Aprovado', isCurrent: false,
      iso: item.iso, dateLabel: item.dateLabel, timeLabel: item.timeLabel,
    })),
    ...(positioning.state === 'recorded' ? [{
      id: 'positioning', kind: 'positioning' as const, title: positioning.label, actor: positioning.recipient,
      attribution: `Envio registrado · ${positioning.channel}`, description: positioning.body,
      isAttention: false, isCurrent: false, iso: positioning.iso, dateLabel: positioning.dateLabel, timeLabel: positioning.timeLabel,
    }] : []),
    ...stateEvents,
    {
      id: 'current', kind: 'current' as const, title: statusLabels[demand.status], actor: demand.responsibleName,
      attribution: 'Estado atual · última atualização do registro · responsável atribuído', description: `Estado atual registrado: ${statusLabels[demand.status]}.`,
      isAttention: false, isCurrent: true, ...dateTime(demand.updatedAt),
    },
  ].sort((left, right) => left.iso.localeCompare(right.iso))

  return {
    id: demand.id,
    identity: {
      code: demand.code,
      title: demand.title,
      journalistId: demand.journalistId,
      journalistName: demand.journalistName,
      outletName: demand.outletName,
      responsibleName: demand.responsibleName,
      priorityLabel: priorityLabels[demand.priority],
      statusLabel: statusLabels[demand.status],
      deadline: dateTime(demand.deadlineAt),
    },
    requestSummary: demand.requestSummary,
    enrichment: demand.enrichment ?? { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
    validNextActions: getDemandNextActions(demand.status),
    interactions,
    decisions,
    positioning,
    currentState: {
      statusLabel: statusLabels[demand.status],
      responsibleName: demand.responsibleName,
      latestDecisionSummary: latestDecision ? `${latestDecision.outcomeLabel}: ${latestDecision.rationale}` : 'Sem decisão registrada.',
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
  const interactions = [...record.interactions]
    .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
    .map((item) => ({
      id: item.id,
      typeLabel: item.type ? interactionLabels[item.type] : null,
      resultLabel: EXTERNAL_INTERACTION_RESULT_RULES[item.result].label,
      recordedBy: item.recordedBy ?? 'Autoria não informada',
      participants: item.participants,
      summary: item.summary,
      nextStep: item.nextStep,
      originLabel: 'Fora da plataforma' as const,
      ...dateTime(item.occurredAt),
    }))
  const reviewEvents: DemandDetailTimelineEvent[] = record.reviewRequests.map((item) => ({
    id: item.id, kind: 'review', title: `Review solicitado · ${item.versionLabel}`, actor: item.requestedBy,
    attribution: `Solicitação registrada · revisão por ${item.reviewer}`, description: `Artefato ${item.versionLabel} encaminhado para review.`,
    isAttention: false, isCurrent: false, ...dateTime(item.requestedAt),
  }))
  const versionEvents: DemandDetailTimelineEvent[] = record.versions.map((item) => ({
    id: item.id, kind: 'version', title: `Nova versão · ${item.versionLabel}`, actor: item.createdBy,
    attribution: 'Artefato registrado · conteúdo versionado', description: item.body,
    isAttention: false, isCurrent: false, ...dateTime(item.createdAt),
  }))
  const stateEvents: DemandDetailTimelineEvent[] = record.stateTransitions.map((item) => ({
    id: item.id, kind: 'state_change', title: statusLabels[item.to], actor: item.recordedBy,
    attribution: `Mudança de estado · ${statusLabels[item.from]} → ${statusLabels[item.to]}`, description: null,
    isAttention: item.to === 'changes_requested', isCurrent: false, ...dateTime(item.occurredAt),
  }))
  const decisionEvents: DemandDetailTimelineEvent[] = record.decisions.map((item) => ({
    id: item.id, kind: 'decision', title: decisionLabels[item.decision], actor: item.decidedBy ?? item.consultedParty,
    attribution: 'Decisão atribuída e registrada', description: item.rationale,
    isAttention: item.decision !== 'approved', isCurrent: false, ...dateTime(item.decidedAt),
  }))
  const positioningEvent: DemandDetailTimelineEvent[] = record.finalPositioning ? [{
    id: `${record.id}-positioning`, kind: 'positioning', title: `Posicionamento final ${record.finalPositioning.versionLabel}`,
    actor: record.finalPositioning.recordedBy ?? record.responsibleName, attribution: `Envio registrado · ${record.finalPositioning.channel}`,
    description: record.finalPositioning.body, isAttention: false, isCurrent: false, ...dateTime(record.finalPositioning.sentAt),
  }] : []
  const closureEvent: DemandDetailTimelineEvent[] = record.closure ? [{
    id: `${record.id}-closure`, kind: 'closure', title: 'Encerrada sem envio', actor: record.closure.closedBy,
    attribution: 'Encerramento registrado · sem posicionamento enviado', description: record.closure.reason,
    isAttention: true, isCurrent: false, ...dateTime(record.closure.closedAt),
  }] : []
  const timeline: DemandDetailTimelineEvent[] = [
    {
      id: `${record.id}-received`,
      kind: 'request' as const,
      title: 'Entrada recebida',
      actor: sourceLabel,
      attribution: `${record.channel} · registro local`,
      description: `${record.factContext} Pedido: ${record.pressRequest}`,
      isAttention: false,
      isCurrent: false,
      ...capturedAt,
    },
    ...interactions.map((item) => ({
      id: item.id,
      kind: 'interaction' as const,
      title: [item.typeLabel, item.resultLabel].filter(Boolean).join(' · '),
      actor: item.recordedBy,
      participants: item.participants,
      attribution: interactionAttribution(item.originLabel, item.participants),
      description: item.summary,
      nextStep: item.nextStep,
      isAttention: false,
      isCurrent: false,
      iso: item.iso,
      dateLabel: item.dateLabel,
      timeLabel: item.timeLabel,
    })),
    ...reviewEvents,
    ...versionEvents,
    ...decisionEvents,
    ...positioningEvent,
    ...closureEvent,
    ...stateEvents,
    {
      id: `${record.id}-local`,
      kind: 'current' as const,
      title: statusLabels[record.status],
      actor: record.responsibleName,
      attribution: 'Estado atual · registro local desta sessão',
      description: `Estado atual registrado: ${statusLabels[record.status]}.`,
      isAttention: record.status === 'changes_requested',
      isCurrent: true,
      ...updatedAt,
    },
  ].sort((left, right) => left.iso.localeCompare(right.iso))

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
      priorityLabel: record.priority ? priorityLabels[record.priority] : 'Ainda não definida',
      statusLabel: statusLabels[record.status],
      deadline: { dateLabel: 'Prazo solicitado', timeLabel: localDeadline },
    },
    requestSummary: record.pressRequest,
    enrichment: record.enrichment,
    validNextActions: getDemandNextActions(record.status),
    factContext: record.factContext,
    sourceChannel: record.channel,
    localCapture: {
      requestedDeadline: localDeadline,
      journalistName: record.contactName || record.journalistName,
      outletName: record.contactOutlet || record.outletName,
    },
    interactions,
    decisions: record.decisions.map((item) => ({ id: item.id, consultedParty: item.consultedParty, outcomeLabel: decisionLabels[item.decision], rationale: item.rationale, ...dateTime(item.decidedAt) })),
    positioning: record.finalPositioning ? { state: 'recorded' as const, label: `Posicionamento final ${record.finalPositioning.versionLabel}`, channel: record.finalPositioning.channel, recipient: record.finalPositioning.recipient, body: record.finalPositioning.body, ...dateTime(record.finalPositioning.sentAt) } : { state: 'missing' as const, label: 'Sem posicionamento final registrado' },
    currentState: {
      statusLabel: statusLabels[record.status],
      responsibleName: record.responsibleName,
      latestDecisionSummary: record.decisions.at(-1) ? `${decisionLabels[record.decisions.at(-1)!.decision]}: ${record.decisions.at(-1)!.rationale}` : 'Nenhuma decisão registrada.',
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
