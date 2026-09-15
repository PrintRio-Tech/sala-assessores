import type {
  DemandListParams,
  DemandRepository,
  NewExternalInteraction,
  Paginated,
} from '@/domain/Demand/demand.repository'
import type { Demand } from '@/domain/Demand/demand.entity'
import {
  applyInteractionToPositioning,
  emptyPositioning,
  savePositioningVersion,
  transitionDemand,
} from '@/domain/Demand/demand.entity'
import { demandDtoSchema, type DemandDto } from './DTOs/demand.dto'
import { toDomain } from './mappers/demand.mapper'
import { mockDemandDtos } from '@/infrastructure/mock/seed'

function fromPositioning(positioning: ReturnType<typeof emptyPositioning>): NonNullable<DemandDto['positioning']> {
  return {
    state: positioning.state,
    versions: positioning.versions.map((item) => ({
      id: item.id,
      body: item.body,
      author: item.author,
      saved_at: item.savedAt.toISOString(),
    })),
    approval: positioning.approval ? {
      approved_by: positioning.approval.approvedBy,
      opinion: positioning.approval.opinion,
      approved_at: positioning.approval.approvedAt.toISOString(),
      version_id: positioning.approval.versionId,
    } : null,
  }
}

export class MockDemandRepository implements DemandRepository {
  private readonly records: DemandDto[]
  private interactionSequence = 0

  constructor() {
    this.records = demandDtoSchema.array().parse(mockDemandDtos)
  }

  async list(_params: DemandListParams = {}): Promise<Paginated<Demand>> {
    const items = this.records.map((item) => toDomain(demandDtoSchema.parse(item)))
    return { items, total: items.length }
  }

  async getById(id: string): Promise<Demand | null> {
    const dto = this.records.find((item) => item.id === id)
    if (!dto) return null
    return toDomain(demandDtoSchema.parse(dto))
  }

  async registerInteraction(id: string, input: NewExternalInteraction): Promise<Demand | null> {
    const dto = this.records.find((item) => item.id === id)
    if (!dto) return null

    const current = toDomain(demandDtoSchema.parse(dto))
    const nextStatus = transitionDemand(current.status, { type: 'register_interaction', result: input.result })
    const nextPositioning = applyInteractionToPositioning(current.positioning ?? emptyPositioning(), {
      result: input.result,
      approvedBy: input.participants ?? undefined,
      opinion: input.summary ?? undefined,
      occurredAt: input.occurredAt,
    })
    this.interactionSequence += 1
    dto.interactions.push({
      id: `interaction-local-${Date.now()}-${this.interactionSequence}`,
      occurred_at: input.occurredAt.toISOString(),
      recorded_by: input.recordedBy,
      type: input.type,
      result: input.result,
      participants: input.participants,
      summary: input.summary,
      next_step: input.nextStep,
      channel: input.channel,
      recipient: input.recipient,
      body: input.body,
      origin: input.origin,
      positioning_version_id: input.result === 'approved' ? nextPositioning.approval?.versionId ?? null : null,
    })
    dto.interactions.sort((left, right) => left.occurred_at.localeCompare(right.occurred_at))
    dto.updated_at = new Date().toISOString()
    dto.positioning = fromPositioning(nextPositioning)
    if (nextStatus !== dto.status) {
      dto.state_transitions = [
        ...(dto.state_transitions ?? []),
        {
          id: `state-local-${this.interactionSequence}`,
          from: dto.status,
          to: nextStatus,
          occurred_at: input.occurredAt.toISOString(),
          recorded_by: input.recordedBy ?? 'Noel Ferreira',
          trigger: nextStatus === 'sent' ? 'response_sent' : 'closed_without_send',
        },
      ]
      dto.status = nextStatus
    }

    return toDomain(demandDtoSchema.parse(dto))
  }

  async savePositioning(id: string, input: { body: string; author: string; savedAt: Date }): Promise<Demand | null> {
    const dto = this.records.find((item) => item.id === id)
    if (!dto) return null
    const current = toDomain(demandDtoSchema.parse(dto))
    this.interactionSequence += 1
    const next = savePositioningVersion(current.positioning ?? emptyPositioning(), {
      id: `pos-${id}-${this.interactionSequence}`,
      body: input.body,
      author: input.author,
      savedAt: input.savedAt,
    }, current.status)
    dto.positioning = fromPositioning(next)
    dto.updated_at = input.savedAt.toISOString()
    return toDomain(demandDtoSchema.parse(dto))
  }
}
