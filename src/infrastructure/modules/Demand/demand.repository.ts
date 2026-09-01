import type {
  DemandListParams,
  DemandRepository,
  NewExternalInteraction,
  Paginated,
} from '@/domain/Demand/demand.repository'
import type { Demand } from '@/domain/Demand/demand.entity'
import { demandDtoSchema, type DemandDto } from './DTOs/demand.dto'
import { toDomain } from './mappers/demand.mapper'
import { mockDemandDtos } from '@/infrastructure/mock/seed'

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
      origin: input.origin,
    })
    dto.interactions.sort((left, right) => left.occurred_at.localeCompare(right.occurred_at))
    dto.updated_at = new Date().toISOString()

    return toDomain(demandDtoSchema.parse(dto))
  }
}
