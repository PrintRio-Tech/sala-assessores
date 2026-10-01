import type {
  DemandCaptureRevision,
  DemandListParams,
  DemandRepository,
  RegisterExternalInteractionInput,
} from '@/domain/Demand/demand.repository'
import { CreateDemand, type DemandAuthor } from '@/domain/Demand/use-cases/create-demand.use-case'
import { GetDemandById } from '@/domain/Demand/use-cases/get-demand-by-id.use-case'
import { ListDemands } from '@/domain/Demand/use-cases/list-demands.use-case'
import { RegisterExternalInteraction } from '@/domain/Demand/use-cases/register-external-interaction.use-case'
import { RegisterDemandOutcome } from '@/domain/Demand/use-cases/register-demand-outcome.use-case'
import { ReviseDemandCapture } from '@/domain/Demand/use-cases/revise-demand-capture.use-case'
import { SaveDemandPositioning } from '@/domain/Demand/use-cases/save-demand-positioning.use-case'
import type { NewDemandOutcome, PositioningAttachment } from '@/domain/Demand/demand.entity'

export class DemandService {
  private readonly listDemands: ListDemands
  private readonly getDemandById: GetDemandById
  private readonly createDemand: CreateDemand
  private readonly reviseDemandCapture: ReviseDemandCapture
  private readonly registerExternalInteraction: RegisterExternalInteraction
  private readonly saveDemandPositioning: SaveDemandPositioning
  private readonly registerDemandOutcome: RegisterDemandOutcome
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
    this.listDemands = new ListDemands(repo)
    this.getDemandById = new GetDemandById(repo)
    this.createDemand = new CreateDemand(repo)
    this.reviseDemandCapture = new ReviseDemandCapture(repo)
    this.registerExternalInteraction = new RegisterExternalInteraction(repo)
    this.saveDemandPositioning = new SaveDemandPositioning(repo)
    this.registerDemandOutcome = new RegisterDemandOutcome(repo)
  }

  list(params: DemandListParams = {}) {
    return this.listDemands.execute(params)
  }

  listResponsibles() {
    return this.repo.listResponsibles()
  }

  getById(id: string) {
    return this.getDemandById.execute(id)
  }

  create(input: DemandCaptureRevision, author: DemandAuthor) {
    return this.createDemand.execute(input, author)
  }

  reviseCapture(id: string, revision: DemandCaptureRevision) {
    return this.reviseDemandCapture.execute(id, revision)
  }

  remove(id: string) {
    return this.repo.remove(id)
  }

  registerInteraction(id: string, input: RegisterExternalInteractionInput) {
    return this.registerExternalInteraction.execute(id, input)
  }

  savePositioning(id: string, input: { body: string; author: string; savedAt?: Date; attachment?: PositioningAttachment | null }) {
    return this.saveDemandPositioning.execute(id, input)
  }

  registerOutcome(id: string, input: NewDemandOutcome) {
    return this.registerDemandOutcome.execute(id, input)
  }
}
