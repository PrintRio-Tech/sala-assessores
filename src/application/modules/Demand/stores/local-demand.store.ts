import { create } from 'zustand'

import { applyInteractionToPositioning, emptyPositioning, savePositioningVersion, transitionDemand, type Demand, type DemandEnrichment, type DemandPositioning, type DemandPriority, type DemandStateTransition, type DemandStatus, type ExternalInteraction, type PositioningAttachment } from '@/domain/Demand/demand.entity'
import { currentUser } from '@/application/current-user'
import type { RegisterExternalInteractionInput } from '@/domain/Demand/demand.repository'
import { prepareExternalInteraction } from '@/domain/Demand/use-cases/register-external-interaction.use-case'
import { applyDemandCaptureRevision, type DemandCaptureRevision, type DemandCreatedBy } from '@/domain/Demand/use-cases/revise-demand-capture.use-case'

export type { DemandCreatedBy, DemandPriority, DemandStatus }

export const EMPTY_DEMAND_ENRICHMENT: DemandEnrichment = {
  tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null,
}

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
  createdBy: DemandCreatedBy
  createdAt: Date
  updatedAt: Date
  interactions: ExternalInteraction[]
  status: DemandStatus
  responsibleId: string
  responsibleName: string
  priority: DemandPriority | null
  enrichment: DemandEnrichment
  stateTransitions: DemandStateTransition[]
  positioning: DemandPositioning
}

export type NewLocalDemandCapture = Omit<LocalDemandCapture,
  | 'id' | 'code' | 'createdAt' | 'updatedAt' | 'interactions' | 'status'
  | 'responsibleId' | 'responsibleName' | 'createdBy' | 'priority' | 'enrichment'
  | 'stateTransitions' | 'positioning'
> & {
  priority?: DemandPriority | null
  enrichment?: DemandEnrichment
}

type LocalDemandState = {
  records: LocalDemandCapture[]
  hiddenIds: string[]
  add: (capture: NewLocalDemandCapture) => LocalDemandCapture
  adopt: (demand: Demand) => LocalDemandCapture
  updateCapture: (id: string, revision: DemandCaptureRevision) => LocalDemandCapture | null
  remove: (id: string) => void
  isHidden: (id: string) => boolean
  registerInteraction: (id: string, input: RegisterExternalInteractionInput) => LocalDemandCapture | null
  savePositioning: (id: string, input: { body: string; attachment?: PositioningAttachment | null }) => LocalDemandCapture | null
  updateEnrichment: (id: string, input: Partial<DemandEnrichment> & { responsibleId?: string; responsibleName?: string; priority?: DemandPriority }) => LocalDemandCapture | null
  linkJournalist: (id: string, input: { journalistId: string; journalistName: string; outletName: string }) => LocalDemandCapture | null
  reset: () => void
}

function mergeEnrichment(current: DemandEnrichment, input: Partial<DemandEnrichment>): DemandEnrichment {
  return {
    tags: input.tags ?? current.tags,
    topics: input.topics ?? current.topics,
    relatedAreas: input.relatedAreas ?? current.relatedAreas,
    confirmedFacts: input.confirmedFacts ?? current.confirmedFacts,
    pendingFacts: input.pendingFacts ?? current.pendingFacts,
    nextStep: input.nextStep !== undefined ? input.nextStep : current.nextStep,
  }
}

let sequence = 0

export const useLocalDemandStore = create<LocalDemandState>((set, get) => ({
  records: [],
  hiddenIds: [],
  add: (capture) => {
    sequence += 1
    const now = new Date()
    const record: LocalDemandCapture = {
      ...capture,
      id: `local-${now.getTime()}-${sequence}`,
      code: `LOCAL-${String(sequence).padStart(3, '0')}`,
      createdBy: { id: currentUser.id, name: currentUser.name },
      createdAt: now,
      updatedAt: now,
      interactions: [],
      status: 'in_progress',
      responsibleId: currentUser.id,
      responsibleName: currentUser.name,
      priority: capture.priority ?? null,
      enrichment: capture.enrichment ?? EMPTY_DEMAND_ENRICHMENT,
      stateTransitions: [],
      positioning: emptyPositioning(),
    }
    set((state) => ({ records: [record, ...state.records] }))
    return record
  },
  adopt: (demand) => {
    const existing = get().records.find((record) => record.id === demand.id)
    if (existing) return existing
    const record: LocalDemandCapture = {
      id: demand.id, code: demand.code, subject: demand.title, factContext: demand.factContext?.trim() ?? '',
      pressRequest: demand.requestSummary, requestedDeadline: demand.deadlineAt.toISOString().slice(0, 10), channel: demand.channel?.trim() ?? '',
      contactMode: demand.journalistId ? 'known' : 'local', contactName: demand.journalistName, contactOutlet: demand.outletName,
      journalistId: demand.journalistId, journalistName: demand.journalistName, outletName: demand.outletName,
      createdBy: null,
      createdAt: demand.createdAt, updatedAt: demand.updatedAt, interactions: demand.interactions, status: demand.status,
      responsibleId: demand.responsibleId, responsibleName: demand.responsibleName, priority: demand.priority,
      enrichment: demand.enrichment ?? EMPTY_DEMAND_ENRICHMENT,
      stateTransitions: demand.stateTransitions ?? [],
      positioning: demand.positioning ?? emptyPositioning(),
    }
    set((state) => ({ records: [record, ...state.records] }))
    return record
  },
  updateCapture: (id, revision) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({
      records: state.records.map((record) => {
        if (record.id !== id) return record
        updated = { ...applyDemandCaptureRevision(record, revision), updatedAt: new Date() }
        return updated
      }),
    }))
    return updated
  },
  remove: (id) => {
    set((state) => ({
      records: state.records.filter((record) => record.id !== id),
      hiddenIds: state.hiddenIds.includes(id) ? state.hiddenIds : [...state.hiddenIds, id],
    }))
  },
  isHidden: (id) => get().hiddenIds.includes(id),
  registerInteraction: (id, input) => {
    const current = get().records.find((record) => record.id === id)
    if (!current) return null
    const interaction = prepareExternalInteraction({
      ...input,
      recordedBy: input.recordedBy ?? currentUser.name,
    })
    const nextStatus = transitionDemand(current.status, { type: 'register_interaction', result: interaction.result })
    const nextPositioning = applyInteractionToPositioning(current.positioning, {
      result: interaction.result,
      approvedBy: interaction.participants ?? undefined,
      opinion: interaction.summary ?? undefined,
      occurredAt: interaction.occurredAt,
    })
    let updated: LocalDemandCapture | null = null
    set((state) => ({
      records: state.records.map((record) => {
        if (record.id !== id) return record
        sequence += 1
        const now = new Date()
        const stateTransitions = nextStatus === record.status
          ? record.stateTransitions
          : [...record.stateTransitions, {
              id: `state-${sequence}`,
              from: record.status,
              to: nextStatus,
              occurredAt: interaction.occurredAt,
              recordedBy: interaction.recordedBy ?? currentUser.name,
              trigger: nextStatus === 'sent' ? 'response_sent' as const : 'closed_without_send' as const,
            }]
        updated = {
          ...record,
          status: nextStatus,
          updatedAt: now,
          stateTransitions,
          positioning: nextPositioning,
          interactions: [
            ...record.interactions,
            {
              ...interaction,
              id: `interaction-${record.id}-${Date.now()}-${sequence}`,
              positioningVersionId: interaction.result === 'approved' ? nextPositioning.approval?.versionId ?? null : null,
            },
          ].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
        }
        return updated
      }),
    }))
    return updated
  },
  savePositioning: (id, input) => {
    const current = get().records.find((record) => record.id === id)
    if (!current) return null
    sequence += 1
    const savedAt = new Date()
    const nextPositioning = savePositioningVersion(current.positioning, {
      id: `pos-${current.id}-${sequence}`,
      body: input.body,
      author: currentUser.name,
      savedAt,
      attachment: input.attachment ?? null,
    }, current.status)
    let updated: LocalDemandCapture | null = null
    set((state) => ({
      records: state.records.map((record) => {
        if (record.id !== id) return record
        updated = { ...record, positioning: nextPositioning, updatedAt: savedAt }
        return updated
      }),
    }))
    return updated
  },
  updateEnrichment: (id, input) => {
    let updated: LocalDemandCapture | null = null
    set((state) => ({ records: state.records.map((record) => {
      if (record.id !== id) return record
      updated = {
        ...record,
        priority: input.priority ?? record.priority,
        enrichment: mergeEnrichment(record.enrichment, input),
        updatedAt: new Date(),
      }
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
  reset: () => set({ records: [], hiddenIds: [] }),
}))
