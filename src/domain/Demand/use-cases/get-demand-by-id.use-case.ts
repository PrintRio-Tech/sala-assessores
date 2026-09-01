import { DemandNotFoundError } from '../errors/demand.errors'
import type { Demand } from '../demand.entity'
import type { DemandRepository } from '../demand.repository'

export class GetDemandById {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(id: string): Promise<Demand> {
    const demand = await this.repo.getById(id)
    if (!demand) {
      throw new DemandNotFoundError()
    }
    return demand
  }
}
