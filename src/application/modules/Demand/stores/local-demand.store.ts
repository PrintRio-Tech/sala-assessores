import { create } from 'zustand'

import { transitionDemand, type Demand, type DemandClosure, type DemandDecision, type DemandEnrichment, type DemandPriority, type DemandStateTransition, type DemandStatus, type DemandVersion, type ExternalInteraction, type FinalPositioning, type ReviewRequest } from '@/domain/Demand/demand.entity'
import { currentUser } from '@/application/current-user'
import type { RegisterExternalInteractionInput } from '@/domain/Demand/demand.repository'
import { prepareExternalInteraction } from '@/domain/Demand/use-cases/register-external-interaction.use-case'

export type LocalDemandCapture = {
  id: string
  code: string
  subject: string
  factContext: string
  pressRequest: string
  requestedDeadline: string
  channel: string
  contactMode: 'known' | 'local'
  contactName: string
  contactOutlet: string
  journalistId: string
  journalistName: string
  outletName: string
  createdAt: Date
  updatedAt: Date
  interactions: ExternalInteraction[]
  status: DemandStatus
  responsibleId: string
  responsibleName: string
  priority: DemandPriority | null
  enrichment: DemandEnrichment
  reviewRequests: ReviewRequest[]
  decisions: DemandDecision[]
  finalPositioning: FinalPositioning | null
  closure: DemandClosure | null
  versions: DemandVersion[]
  stateTransitions: DemandStateTransition[]
}

export type NewLocalDemandCapture = Omit<LocalDemandCapture,
  | 'id' | 'code' | 'createdAt' | 'updatedAt' | 'interactions' | 'status'
  | 'responsibleId' | 'responsibleName' | 'priority' | 'enrichment'
  | 'reviewRequests' | 'decisions' | 'finalPositioning' | 'closure'
  | 'versions' | 'stateTransitions'
>

type LocalDemandState = {
  records: LocalDemandCapture[]
  add: (capture: NewLocalDemandCapture) => LocalDemandCapture
  adopt: (demand: Demand) => LocalDemandCapture
  registerInteraction: (id: string, input: RegisterExternalInteractionInput) => LocalDemandCapture | null
  enrich: (id: string, input: Partial<DemandEnrichment> & { responsibleId?: string; responsibleName?: string; priority?: DemandPriority }) => LocalDemandCapture | null
  requestReview: (id: string, input: Pick<ReviewRequest, 'reviewer' | 'versionLabel' | 'requestedBy'>) => LocalDemandCapture | null
  recordDecision: (id: string, input: { outcome: DemandDecision['decision']; rationale: string; decidedBy: string; decidedAt: Date }) => LocalDemandCapture | null
  recordVersion: (id: string, input: Omit<DemandVersion, 'id'>) => LocalDemandCapture | null
  recordPositioning: (id: string, input: FinalPositioning) => LocalDemandCapture | null
  closeWithoutSend: (id: string, input: { reason: string; closedBy: string }) => LocalDemandCapture | null
  linkJournalist: (id: string, input: { journalistId: string; journalistName: string; outletName: string }) => LocalDemandCapture | null
  reset: () => void
}

let sequence = 0

export const useLocalDemandStore = create<LocalDemandState>((set, get) => ({
  records: [],
  add: (capture) => {
    sequence += 1
    const now = new Date()
    const record: LocalDemandCapture = {
      ...capture,
      id: `local-${now.getTime()}-${sequence}`,
      code: `LOCAL-${String(sequence).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
      interactions: [],
      status: 'draft',
      responsibleId: '',
      responsibleName: 'Ainda não atribuído',
      priority: null,
      enrichment: { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
      reviewRequests: [],
      decisions: [],
      finalPositioning: null,
      closure: null,
      versions: [],
      stateTransitions: [],
    }
    set((state) => ({ records: [record, ...state.records] }))
    return record
  },
  adopt: (demand) => {
    const existing = get().records.find((record) => record.id === demand.id)
    if (existing) return existing
    const record: LocalDemandCapture = {
      id: demand.id, code: demand.code, subject: demand.title, factContext: demand.enrichment?.confirmedFacts.join(' ') || 'Contexto disponível no pedido original.',
      pressRequest: demand.requestSummary, requestedDeadline: demand.deadlineAt.toISOString().slice(0, 10), channel: 'Registro mock',
      contactMode: demand.journalistId ? 'known' : 'local', contactName: demand.journalistName, contactOutlet: demand.outletName,
      journalistId: demand.journalistId, journalistName: demand.journalistName, outletName: demand.outletName,
      createdAt: demand.createdAt, updatedAt: demand.updatedAt, interactions: demand.interactions, status: demand.status,
      responsibleId: demand.responsibleId, responsibleName: demand.responsibleName, priority: demand.priority,
      enrichment: demand.enrichment ?? { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
      reviewRequests: demand.reviewRequests ?? [], decisions: demand.decisions, finalPositioning: demand.finalPositioning, closure: demand.closure ?? null,
      versions: demand.versions ?? [], stateTransitions: demand.stateTransitions ?? [],
    }
    set((state) => ({ records: [record, ...state.records] }))
    return record
  },
  registerInteraction: (id, input) => {
    const interaction = prepareExternalInteraction(input)
    let updated: LocalDemandCapture | null = null
    set((state) => ({
      records: state.records.map((record) => {
        if (record.id !== id) return record
        sequence += 1
        updated = {
          ...record,
          updatedAt: new Date(),
          interactions: [
            ...record.interactions,
            { ...interaction, id: `interaction-${record.id}-${Date.now()}-${sequence}` },
          ].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
        }
        return updated
      }),
    }))
    return updated
  },
  enrich: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      const now = new Date()
      const nextStatus = transitionDemand(record.status, { type: 'enrich' })
      sequence += 1
      updated = {
        ...record,
        status: nextStatus,
        responsibleId: input.responsibleId ?? record.responsibleId,
        responsibleName: input.responsibleName ?? record.responsibleName,
        priority: input.priority ?? record.priority,
        enrichment: { ...record.enrichment, ...input },
        updatedAt: now,
        stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: now, recordedBy: currentUser.name, trigger: 'enrichment' }],
      }
      return updated
    }) }))
    return updated
  },
  requestReview: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      const now = new Date()
      sequence += 1
      const nextStatus = transitionDemand(record.status, { type: 'request_review' })
      updated = { ...record, status: nextStatus, updatedAt: now, reviewRequests: [...record.reviewRequests, { ...input, id: `review-${sequence}`, requestedAt: now }], stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: now, recordedBy: input.requestedBy, trigger: 'review_requested' }] }
      return updated
    }) }))
    return updated
  },
  recordDecision: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      sequence += 1
      const nextStatus = transitionDemand(record.status, { type: 'record_decision', outcome: input.outcome })
      updated = { ...record, status: nextStatus, updatedAt: input.decidedAt, decisions: [...record.decisions, { id: `decision-${sequence}`, decidedAt: input.decidedAt, consultedParty: input.decidedBy, decidedBy: input.decidedBy, decision: input.outcome, rationale: input.rationale }], stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: input.decidedAt, recordedBy: input.decidedBy, trigger: 'decision' }] }
      return updated
    }) }))
    return updated
  },
  recordVersion: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      sequence += 1
      const nextStatus = transitionDemand(record.status, { type: 'record_version' })
      updated = { ...record, status: nextStatus, updatedAt: input.createdAt, versions: [...record.versions, { ...input, id: `version-${sequence}` }], stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: input.createdAt, recordedBy: input.createdBy, trigger: 'new_version' }] }
      return updated
    }) }))
    return updated
  },
  recordPositioning: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      sequence += 1
      const nextStatus = transitionDemand(record.status, { type: 'record_positioning' })
      updated = { ...record, status: nextStatus, updatedAt: input.sentAt, finalPositioning: input, stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: input.sentAt, recordedBy: input.recordedBy ?? currentUser.name, trigger: 'positioning_sent' }] }
      return updated
    }) }))
    return updated
  },
  closeWithoutSend: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      const now = new Date()
      sequence += 1
      const nextStatus = transitionDemand(record.status, { type: 'close_without_send' })
      updated = { ...record, status: nextStatus, updatedAt: now, closure: { ...input, closedAt: now }, stateTransitions: [...record.stateTransitions, { id: `state-${sequence}`, from: record.status, to: nextStatus, occurredAt: now, recordedBy: input.closedBy, trigger: 'closed_without_send' }] }
      return updated
    }) }))
    return updated
  },
  linkJournalist: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      updated = { ...record, ...input, contactMode: 'known', contactName: input.journalistName, contactOutlet: input.outletName, updatedAt: new Date() }
      return updated
    }) }))
    return updated
  },
  reset: () => set({ records: [] }),
}))
