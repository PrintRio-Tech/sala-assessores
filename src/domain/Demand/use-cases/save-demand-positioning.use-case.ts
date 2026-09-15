import { savePositioningVersion, type Demand, type PositioningAttachment } from '../demand.entity'
import type { DemandRepository } from '../demand.repository'
import { DemandNotFoundError } from '../errors/demand.errors'

export class SaveDemandPositioning {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(demandId: string, input: { body: string; author: string; savedAt?: Date; attachment?: PositioningAttachment | null }): Promise<Demand> {
    const demand = await this.repo.savePositioning(demandId, {
      body: input.body,
      author: input.author,
      savedAt: input.savedAt ?? new Date(),
      attachment: input.attachment ?? null,
    })
    if (!demand) throw new DemandNotFoundError()
    return demand
  }
}

export { savePositioningVersion, DemandNotFoundError }
