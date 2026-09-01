import type {
  DemandListParams,
  DemandRepository,
} from '@/domain/Demand/demand.repository'
import { GetDemandById } from '@/domain/Demand/use-cases/get-demand-by-id.use-case'
import { ListDemands } from '@/domain/Demand/use-cases/list-demands.use-case'
import { RegisterExternalInteraction } from '@/domain/Demand/use-cases/register-external-interaction.use-case'
import type { RegisterExternalInteractionInput } from '@/domain/Demand/demand.repository'

export class DemandService {
  private readonly listDemands: ListDemands
  private readonly getDemandById: GetDemandById
  private readonly registerExternalInteraction: RegisterExternalInteraction

  constructor(repo: DemandRepository) {
    this.listDemands = new ListDemands(repo)
    this.getDemandById = new GetDemandById(repo)
    this.registerExternalInteraction = new RegisterExternalInteraction(repo)
  }

  list(params: DemandListParams = {}) {
    return this.listDemands.execute(params)
  }

  getById(id: string) {
    return this.getDemandById.execute(id)
  }

  registerInteraction(id: string, input: RegisterExternalInteractionInput) {
    return this.registerExternalInteraction.execute(id, input)
  }
}
