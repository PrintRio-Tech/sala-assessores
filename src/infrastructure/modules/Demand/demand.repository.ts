import type {
  DemandCaptureRevision,
  DemandListParams,
  DemandListResult,
  DemandRepository,
  NewDemand,
  NewExternalInteraction,
} from '@/domain/Demand/demand.repository'
import type { Demand, NewDemandOutcome, PositioningAttachment } from '@/domain/Demand/demand.entity'
import {
  applyInteractionToPositioning,
  assertPositioningAttachmentSize,
  emptyPositioning,
  registerDemandOutcome,
  savePositioningVersion,
  transitionDemand,
} from '@/domain/Demand/demand.entity'
import { applyRevisionToDemand } from '@/domain/Demand/use-cases/revise-demand-capture.use-case'
import { selectDemandList } from '@/domain/Demand/use-cases/list-demands.use-case'
import { demandDtoSchema, type DemandDto } from './DTOs/demand.dto'
import { fromDomain, toDomain } from './mappers/demand.mapper'
import { mockDemandDtos } from '@/infrastructure/mock/seed'

function fromPositioning(positioning: ReturnType<typeof emptyPositioning>): NonNullable<DemandDto['positioning']> {
  return {
    state: positioning.state,
    versions: positioning.versions.map((item) => ({
      id: item.id,
      body: item.body,
      author: item.author,
      saved_at: item.savedAt.toISOString(),
      attachment: item.attachment ? {
        filename: item.attachment.filename,
        content_type: item.attachment.contentType,
        size_bytes: item.attachment.sizeBytes,
        object_url: item.attachment.objectUrl,
        object_key: item.attachment.objectKey,
      } : null,
    })),
    approval: positioning.approval ? {
      approved_by: positioning.approval.approvedBy,
      opinion: positioning.approval.opinion,
      approved_at: positioning.approval.approvedAt.toISOString(),
      version_id: positioning.approval.versionId,
    } : null,
  }
}

function fromOutcome(outcome: NonNullable<Demand['outcome']>): NonNullable<DemandDto['outcome']> {
  return {
    tone_score: outcome.toneScore,
    published: outcome.published,
    usage_score: outcome.usageScore,
    result_summary: outcome.resultSummary,
    recorded_by: outcome.recordedBy,
    recorded_at: outcome.recordedAt.toISOString(),
  }
}

export class InMemoryDemandRepository implements DemandRepository {
  private readonly records: DemandDto[]
  private sequence: number
  private interactionSequence = 0

  constructor() {
    this.records = demandDtoSchema.array().parse(mockDemandDtos)
    this.sequence = this.records.length
  }

  private liveRecords() {
    return this.records
  }

  private findDto(id: string) {
    return this.liveRecords().find((item) => item.id === id)
  }

  private replace(id: string, demand: Demand) {
    const index = this.records.findIndex((item) => item.id === id)
    if (index < 0) return null
    this.records[index] = demandDtoSchema.parse(fromDomain(demand))
    return toDomain(this.records[index]!)
  }

  async list(params: DemandListParams = {}): Promise<DemandListResult> {
    const items = this.liveRecords().map((item) => toDomain(demandDtoSchema.parse(item)))
    return selectDemandList(items, params)
  }

  async listResponsibles() {
    const seen = new Map<string, string>()
    for (const item of this.liveRecords()) {
      seen.set(item.responsible_id, item.responsible_name)
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }

  async getById(id: string): Promise<Demand | null> {
    const dto = this.findDto(id)
    if (!dto) return null
    return toDomain(demandDtoSchema.parse(dto))
  }

  async create(input: NewDemand): Promise<Demand> {
    this.sequence += 1
    const now = new Date()
    const demand: Demand = {
      ...input,
      id: `d-${now.getTime()}-${this.sequence}`,
      code: `IMP-${String(this.sequence).padStart(3, '0')}`,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      interactions: [],
      positioning: emptyPositioning(),
      stateTransitions: [],
      outcome: null,
    }
    this.records.unshift(demandDtoSchema.parse(fromDomain(demand)))
    return toDomain(this.records[0]!)
  }

  async reviseCapture(id: string, revision: DemandCaptureRevision): Promise<Demand | null> {
    const current = await this.getById(id)
    if (!current) return null
    const next = applyRevisionToDemand(current, revision)
    next.updatedAt = new Date()
    return this.replace(id, next)
  }

  async remove(id: string): Promise<void> {
    const index = this.records.findIndex((item) => item.id === id)
    if (index >= 0) this.records.splice(index, 1)
  }

  async createAttachmentUpload(input: {
    filename: string
    contentType: string
    sizeBytes: number
  }) {
    assertPositioningAttachmentSize(input.sizeBytes)
    const objectKey = `imprensa/positioning/${crypto.randomUUID()}`
    return {
      objectKey,
      uploadUrl: `memory://${objectKey}`,
      headers: [] as Array<{ name: string; value: string }>,
    }
  }

  async putAttachment() {}

  async registerInteraction(id: string, input: NewExternalInteraction): Promise<Demand | null> {
    const dto = this.findDto(id)
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

  async savePositioning(id: string, input: { body: string; author: string; savedAt: Date; attachment?: PositioningAttachment | null }): Promise<Demand | null> {
    const dto = this.findDto(id)
    if (!dto) return null
    const current = toDomain(demandDtoSchema.parse(dto))
    this.interactionSequence += 1
    const attachment = input.attachment
      ? {
          ...input.attachment,
          objectKey: input.attachment.objectKey?.startsWith('local/') || !input.attachment.objectKey
            ? `imprensa/positioning/${crypto.randomUUID()}`
            : input.attachment.objectKey,
        }
      : input.attachment
    const next = savePositioningVersion(current.positioning ?? emptyPositioning(), {
      id: `pos-${id}-${this.interactionSequence}`,
      body: input.body,
      author: input.author,
      savedAt: input.savedAt,
      attachment: attachment ?? null,
    }, current.status)
    dto.positioning = fromPositioning(next)
    dto.updated_at = input.savedAt.toISOString()
    return toDomain(demandDtoSchema.parse(dto))
  }

  async registerOutcome(id: string, input: NewDemandOutcome): Promise<Demand | null> {
    const dto = this.findDto(id)
    if (!dto) return null
    const current = toDomain(demandDtoSchema.parse(dto))
    const next = registerDemandOutcome(current, input)
    dto.outcome = next.outcome ? fromOutcome(next.outcome) : null
    dto.updated_at = next.updatedAt.toISOString()
    return toDomain(demandDtoSchema.parse(dto))
  }
}
