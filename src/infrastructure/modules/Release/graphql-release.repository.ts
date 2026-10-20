import type {
  NewRelease,
  RecipientImportPreview,
  ReleaseListParams,
  ReleaseRecipientTemplate,
  ReleaseRepository,
  ReleaseUpdate,
} from '@/domain/Release/release.repository'
import type { Release } from '@/domain/Release/release.entity'
import { requestGraphql } from '@/infrastructure/graphql/authorized-request'
import { mapOperationalGraphqlError } from '@/infrastructure/graphql/operational-error'
import {
  graphqlRecipientImportPreviewDtoSchema,
  graphqlReleaseDtoSchema,
  graphqlReleaseListDtoSchema,
  graphqlReleaseTemplateDtoSchema,
  type GraphQLReleaseDto,
} from './DTOs/graphql-release.dto'
import {
  COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION,
  CREATE_RELEASE_MUTATION,
  DELETE_RELEASE_MUTATION,
  PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION,
  RELEASE_QUERY,
  RELEASE_RECIPIENT_IMPORT_TEMPLATE_QUERY,
  RELEASES_QUERY,
  SET_RELEASE_RECIPIENTS_MUTATION,
  UPDATE_RELEASE_MUTATION,
} from './graphql/release.queries'
import { selectReleaseList } from '@/domain/Release/use-cases/list-releases.use-case'
import { toCreateReleaseInput, toDomain, toReleasesFilter, toUpdateReleaseInput } from './mappers/graphql-release.mapper'

function parseRelease(dto: GraphQLReleaseDto) {
  return toDomain(graphqlReleaseDtoSchema.parse(dto))
}

export class GraphQLReleaseRepository implements ReleaseRepository {
  async list(params: ReleaseListParams = {}) {
    try {
      const data = await requestGraphql<{ releases: unknown }>(RELEASES_QUERY, {
        filter: toReleasesFilter(params),
      })
      const listed = graphqlReleaseListDtoSchema.parse(data.releases)
      return selectReleaseList(listed.items.map(parseRelease), {
        tags: params.tags,
        sort: params.sort,
        page: params.page,
        pageSize: params.pageSize,
      })
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async getById(id: string): Promise<Release | null> {
    try {
      const data = await requestGraphql<{ release: GraphQLReleaseDto | null }>(RELEASE_QUERY, { id })
      if (!data.release) return null
      return parseRelease(data.release)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async create(input: NewRelease): Promise<Release> {
    try {
      const data = await requestGraphql<{ createRelease: GraphQLReleaseDto }>(
        CREATE_RELEASE_MUTATION,
        { input: toCreateReleaseInput(input) },
      )
      return parseRelease(data.createRelease)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async update(id: string, input: ReleaseUpdate): Promise<Release | null> {
    try {
      const data = await requestGraphql<{ updateRelease: GraphQLReleaseDto }>(
        UPDATE_RELEASE_MUTATION,
        { id, input: toUpdateReleaseInput(input) },
      )
      return parseRelease(data.updateRelease)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await requestGraphql(DELETE_RELEASE_MUTATION, { id })
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async setRecipients(id: string, journalistIds: string[]): Promise<Release | null> {
    try {
      const data = await requestGraphql<{ setReleaseRecipients: GraphQLReleaseDto }>(
        SET_RELEASE_RECIPIENTS_MUTATION,
        { id, journalistIds },
      )
      return parseRelease(data.setReleaseRecipients)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async getRecipientImportTemplate(): Promise<ReleaseRecipientTemplate> {
    try {
      const data = await requestGraphql<{ releaseRecipientImportTemplate: unknown }>(
        RELEASE_RECIPIENT_IMPORT_TEMPLATE_QUERY,
      )
      return graphqlReleaseTemplateDtoSchema.parse(data.releaseRecipientImportTemplate)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async previewRecipientImport(input: { releaseId: string; filename: string; contentBase64: string }): Promise<RecipientImportPreview> {
    try {
      const data = await requestGraphql<{ previewReleaseRecipientImport: unknown }>(
        PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION,
        input,
      )
      return graphqlRecipientImportPreviewDtoSchema.parse(data.previewReleaseRecipientImport)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }

  async commitRecipientImport(releaseId: string, input: { filename: string; contentBase64: string }): Promise<Release | null> {
    try {
      const data = await requestGraphql<{ commitReleaseRecipientImport: GraphQLReleaseDto }>(
        COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION,
        { releaseId, ...input },
      )
      return parseRelease(data.commitReleaseRecipientImport)
    } catch (error) {
      mapOperationalGraphqlError(error, 'release')
    }
  }
}
