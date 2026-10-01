import type {
  DemandCaptureRevision,
  DemandListParams,
  DemandListResult,
  DemandRepository,
  NewDemand,
  NewExternalInteraction,
} from '@/domain/Demand/demand.repository'
import {
  assertPositioningAttachmentSize,
  type Demand,
  type NewDemandOutcome,
  type PositioningAttachment,
} from '@/domain/Demand/demand.entity'
import { requestGraphql } from '@/infrastructure/graphql/authorized-request'
import { mapOperationalGraphqlError } from '@/infrastructure/graphql/operational-error'
import {
  graphqlAttachmentUploadDtoSchema,
  graphqlDemandDtoSchema,
  graphqlDemandListDtoSchema,
  graphqlDemandResponsibleDtoSchema,
  type GraphQLDemandDto,
} from './DTOs/graphql-demand.dto'
import {
  CREATE_ATTACHMENT_UPLOAD_MUTATION,
  CREATE_DEMAND_MUTATION,
  DELETE_DEMAND_MUTATION,
  DEMAND_QUERY,
  DEMAND_RESPONSIBLES_QUERY,
  DEMANDS_QUERY,
  REGISTER_DEMAND_OUTCOME_MUTATION,
  REGISTER_EXTERNAL_INTERACTION_MUTATION,
  REVISE_DEMAND_CAPTURE_MUTATION,
  SAVE_POSITIONING_MUTATION,
} from './graphql/demand.queries'
import {
  toCreateDemandInput,
  toDemandsFilter,
  toDomain,
  toRegisterDemandOutcomeInput,
  toRegisterExternalInteractionInput,
  toReviseDemandCaptureInput,
  toSavePositioningInput,
} from './mappers/graphql-demand.mapper'

type AttachmentUpload = {
  objectKey: string
  uploadUrl: string
  headers: Array<{ name: string; value: string }>
}

function parseDemand(dto: GraphQLDemandDto) {
  return toDomain(graphqlDemandDtoSchema.parse(dto))
}

function needsUpload(attachment: PositioningAttachment) {
  return !attachment.objectKey || attachment.objectKey.startsWith('local/')
}

export class GraphQLDemandRepository implements DemandRepository {
  async list(params: DemandListParams = {}): Promise<DemandListResult> {
    try {
      const data = await requestGraphql<{ demands: unknown }>(DEMANDS_QUERY, {
        filter: toDemandsFilter(params),
      })
      const listed = graphqlDemandListDtoSchema.parse(data.demands)
      return {
        items: listed.items.map(parseDemand),
        total: listed.total,
        activeCount: listed.activeCount,
        historyCount: listed.historyCount,
      }
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async listResponsibles() {
    try {
      const data = await requestGraphql<{ demandResponsibles: unknown }>(DEMAND_RESPONSIBLES_QUERY)
      return graphqlDemandResponsibleDtoSchema.array().parse(data.demandResponsibles)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async getById(id: string): Promise<Demand | null> {
    try {
      const data = await requestGraphql<{ demand: GraphQLDemandDto | null }>(DEMAND_QUERY, { id })
      if (!data.demand) return null
      return parseDemand(data.demand)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async create(input: NewDemand): Promise<Demand> {
    try {
      const data = await requestGraphql<{ createDemand: GraphQLDemandDto }>(
        CREATE_DEMAND_MUTATION,
        { input: toCreateDemandInput(input) },
      )
      return parseDemand(data.createDemand)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async reviseCapture(id: string, revision: DemandCaptureRevision): Promise<Demand | null> {
    try {
      const data = await requestGraphql<{ reviseDemandCapture: GraphQLDemandDto }>(
        REVISE_DEMAND_CAPTURE_MUTATION,
        { id, input: toReviseDemandCaptureInput(revision) },
      )
      return parseDemand(data.reviseDemandCapture)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await requestGraphql(DELETE_DEMAND_MUTATION, { id })
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async registerInteraction(id: string, input: NewExternalInteraction): Promise<Demand | null> {
    try {
      const data = await requestGraphql<{ registerExternalInteraction: GraphQLDemandDto }>(
        REGISTER_EXTERNAL_INTERACTION_MUTATION,
        { input: toRegisterExternalInteractionInput(id, input) },
      )
      return parseDemand(data.registerExternalInteraction)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async createAttachmentUpload(input: {
    filename: string
    contentType: string
    sizeBytes: number
  }): Promise<AttachmentUpload> {
    assertPositioningAttachmentSize(input.sizeBytes)
    try {
      const data = await requestGraphql<{ createAttachmentUpload: unknown }>(
        CREATE_ATTACHMENT_UPLOAD_MUTATION,
        input,
      )
      return graphqlAttachmentUploadDtoSchema.parse(data.createAttachmentUpload)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async putAttachment(upload: AttachmentUpload, body: Blob): Promise<void> {
    const headers = Object.fromEntries(upload.headers.map((item) => [item.name, item.value]))
    const response = await fetch(upload.uploadUrl, { method: 'PUT', body, headers })
    if (!response.ok) {
      throw new Error('Não foi possível enviar o anexo.')
    }
  }

  async savePositioning(
    id: string,
    input: { body: string; author: string; savedAt: Date; attachment?: PositioningAttachment | null },
  ): Promise<Demand | null> {
    try {
      const attachment = input.attachment
        ? await this.persistAttachment(input.attachment)
        : input.attachment
      const data = await requestGraphql<{ savePositioning: GraphQLDemandDto }>(
        SAVE_POSITIONING_MUTATION,
        { input: toSavePositioningInput(id, { ...input, attachment }) },
      )
      return parseDemand(data.savePositioning)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  async registerOutcome(id: string, input: NewDemandOutcome): Promise<Demand | null> {
    try {
      const data = await requestGraphql<{ registerDemandOutcome: GraphQLDemandDto }>(
        REGISTER_DEMAND_OUTCOME_MUTATION,
        { input: toRegisterDemandOutcomeInput(id, input) },
      )
      return parseDemand(data.registerDemandOutcome)
    } catch (error) {
      mapOperationalGraphqlError(error, 'demand')
    }
  }

  private async persistAttachment(attachment: PositioningAttachment): Promise<PositioningAttachment> {
    if (!needsUpload(attachment)) return attachment
    assertPositioningAttachmentSize(attachment.sizeBytes)
    const upload = await this.createAttachmentUpload({
      filename: attachment.filename,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
    })
    const body = await fetch(attachment.objectUrl).then((response) => response.blob())
    await this.putAttachment(upload, body)
    return { ...attachment, objectKey: upload.objectKey }
  }
}
