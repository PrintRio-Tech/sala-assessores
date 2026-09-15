import type { Demand, DemandStatus, ExternalInteraction, ExternalInteractionResult, ExternalInteractionType } from './demand.entity'

export interface DemandListParams {
  search?: string
  status?: DemandStatus | 'all'
  responsibleId?: string | 'all'
  deadlineOn?: string
  lifecycle?: 'active' | 'history' | 'all'
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export interface DemandListResult extends Paginated<Demand> {
  activeCount: number
  historyCount: number
}

export type RegisterExternalInteractionInput = {
  occurredAt: Date
  /** Optional only for compatibility with legacy mock callers. UI flows always provide the current author. */
  recordedBy?: string
  result: ExternalInteractionResult
  type?: ExternalInteractionType | null
  participants?: string | null
  summary?: string | null
  nextStep?: string | null
  channel?: string | null
  recipient?: string | null
  body?: string | null
}
export type NewExternalInteraction = Omit<ExternalInteraction, 'id'>

export interface DemandRepository {
  list(params?: DemandListParams): Promise<Paginated<Demand>>
  getById(id: string): Promise<Demand | null>
  registerInteraction(id: string, input: NewExternalInteraction): Promise<Demand | null>
  savePositioning(id: string, input: { body: string; author: string; savedAt: Date }): Promise<Demand | null>
}
