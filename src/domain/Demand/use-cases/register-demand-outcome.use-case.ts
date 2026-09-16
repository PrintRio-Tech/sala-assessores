import { registerDemandOutcome, type Demand, type NewDemandOutcome } from '../demand.entity'
import type { DemandRepository } from '../demand.repository'
import { DemandNotFoundError } from '../errors/demand.errors'

export class RegisterDemandOutcome {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(demandId: string, input: NewDemandOutcome): Promise<Demand> {
    const current = await this.repo.getById(demandId)
    if (!current) throw new DemandNotFoundError()
    // Validate before persist so invalid payloads never hit the adapter.
    registerDemandOutcome(current, input)
    const demand = await this.repo.registerOutcome(demandId, {
      ...input,
      resultSummary: input.resultSummary.trim(),
      recordedBy: input.recordedBy.trim(),
    })
    if (!demand) throw new DemandNotFoundError()
    return demand
  }
}

export { DemandNotFoundError }
