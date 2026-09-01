import type {
  JournalistRepository,
  NewJournalist,
  NewRelationshipEvaluation,
  Paginated,
  UpdateJournalistInput,
} from '@/domain/Journalist/journalist.repository'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import { assertRelationshipEvaluation } from '@/domain/Journalist/journalist.entity'
import { journalistDtoSchema } from './DTOs/journalist.dto'
import { toDomain } from './mappers/journalist.mapper'
import { mockJournalistDtos } from '@/infrastructure/mock/seed'

export class MockJournalistRepository implements JournalistRepository {
  private readonly localJournalists: Journalist[] = []
  private readonly overridesById = new Map<string, Journalist>()
  private readonly idFactory: () => string

  constructor(idFactory: () => string = () => globalThis.crypto.randomUUID()) {
    this.idFactory = idFactory
  }

  async list(): Promise<Paginated<Journalist>> {
    const seedItems = journalistDtoSchema
      .array()
      .parse(mockJournalistDtos)
      .map(toDomain)
    const items = [...this.localJournalists, ...seedItems]
      .map((journalist) => this.overridesById.get(journalist.id) ?? journalist)
    for (const journalist of items) {
      for (const evaluation of journalist.relationshipEvaluations) {
        assertRelationshipEvaluation(evaluation)
      }
    }
    return { items, total: items.length }
  }

  async getById(id: string): Promise<Journalist | null> {
    const override = this.overridesById.get(id)
    if (override) return override
    const localJournalist = this.localJournalists.find((item) => item.id === id)
    if (localJournalist) return localJournalist
    const dto = mockJournalistDtos.find((item) => item.id === id)
    if (!dto) return null
    const journalist = toDomain(journalistDtoSchema.parse(dto))
    for (const evaluation of journalist.relationshipEvaluations) {
      assertRelationshipEvaluation(evaluation)
    }
    return journalist
  }

  /** Registros locais vivem somente nesta instância durante a sessão da SPA. */
  async create(input: NewJournalist): Promise<Journalist> {
    const journalist = { id: `j-local-${this.idFactory()}`, ...input }
    this.localJournalists.unshift(journalist)
    return journalist
  }

  async updateProfile(id: string, input: UpdateJournalistInput): Promise<Journalist | null> {
    const current = await this.getById(id)
    if (!current) return null
    const updated: Journalist = { ...current, ...input }
    this.overridesById.set(id, updated)
    return updated
  }

  async addRelationshipEvaluation(
    id: string,
    input: NewRelationshipEvaluation,
  ): Promise<Journalist | null> {
    assertRelationshipEvaluation(input)
    const current = await this.getById(id)
    if (!current) return null
    const evaluation = { id: this.idFactory(), ...input }
    const relationshipEvaluations = [
      evaluation,
      ...current.relationshipEvaluations,
    ].sort((left, right) => right.recordedAt.getTime() - left.recordedAt.getTime())
    const updated: Journalist = { ...current, relationshipEvaluations }
    this.overridesById.set(id, updated)
    return updated
  }
}
