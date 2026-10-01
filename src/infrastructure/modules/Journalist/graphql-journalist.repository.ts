import type {
  JournalistRepository,
  NewJournalist,
  NewRelationshipEvaluation,
  Paginated,
  UpdateJournalistInput,
} from '@/domain/Journalist/journalist.repository'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import { requestGraphql } from '@/infrastructure/graphql/authorized-request'
import { mapOperationalGraphqlError } from '@/infrastructure/graphql/operational-error'
import {
  graphqlJournalistDtoSchema,
  graphqlJournalistListDtoSchema,
  type GraphQLJournalistDto,
} from './DTOs/graphql-journalist.dto'
import {
  ADD_RELATIONSHIP_EVALUATION_MUTATION,
  CREATE_JOURNALIST_MUTATION,
  JOURNALIST_QUERY,
  JOURNALISTS_QUERY,
  UPDATE_JOURNALIST_MUTATION,
} from './graphql/journalist.queries'
import {
  toAddRelationshipEvaluationInput,
  toCreateJournalistInput,
  toDomain,
  toUpdateJournalistInput,
} from './mappers/graphql-journalist.mapper'

function parseJournalist(dto: GraphQLJournalistDto) {
  return toDomain(graphqlJournalistDtoSchema.parse(dto))
}

export class GraphQLJournalistRepository implements JournalistRepository {
  async list(): Promise<Paginated<Journalist>> {
    try {
      const data = await requestGraphql<{ journalists: unknown }>(JOURNALISTS_QUERY)
      const listed = graphqlJournalistListDtoSchema.parse(data.journalists)
      return {
        items: listed.items.map(parseJournalist),
        total: listed.total,
      }
    } catch (error) {
      mapOperationalGraphqlError(error, 'journalist')
    }
  }

  async getById(id: string): Promise<Journalist | null> {
    try {
      const data = await requestGraphql<{ journalist: GraphQLJournalistDto | null }>(
        JOURNALIST_QUERY,
        { id },
      )
      if (!data.journalist) return null
      return parseJournalist(data.journalist)
    } catch (error) {
      mapOperationalGraphqlError(error, 'journalist')
    }
  }

  async create(input: NewJournalist): Promise<Journalist> {
    try {
      const data = await requestGraphql<{ createJournalist: GraphQLJournalistDto }>(
        CREATE_JOURNALIST_MUTATION,
        { input: toCreateJournalistInput(input) },
      )
      return parseJournalist(data.createJournalist)
    } catch (error) {
      mapOperationalGraphqlError(error, 'journalist')
    }
  }

  async updateProfile(id: string, input: UpdateJournalistInput): Promise<Journalist | null> {
    try {
      const data = await requestGraphql<{ updateJournalist: GraphQLJournalistDto }>(
        UPDATE_JOURNALIST_MUTATION,
        { id, input: toUpdateJournalistInput(input) },
      )
      return parseJournalist(data.updateJournalist)
    } catch (error) {
      mapOperationalGraphqlError(error, 'journalist')
    }
  }

  async addRelationshipEvaluation(
    id: string,
    input: NewRelationshipEvaluation,
  ): Promise<Journalist | null> {
    try {
      const data = await requestGraphql<{ addRelationshipEvaluation: GraphQLJournalistDto }>(
        ADD_RELATIONSHIP_EVALUATION_MUTATION,
        { input: toAddRelationshipEvaluationInput(id, input) },
      )
      return parseJournalist(data.addRelationshipEvaluation)
    } catch (error) {
      mapOperationalGraphqlError(error, 'journalist')
    }
  }
}
