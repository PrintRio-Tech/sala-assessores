import type {
  JournalistRepository,
  Paginated,
} from '@/domain/Journalist/journalist.repository'
import { GetJournalistById } from '@/domain/Journalist/use-cases/get-journalist-by-id.use-case'
import { CreateJournalist } from '@/domain/Journalist/use-cases/create-journalist.use-case'
import { RegisterRelationshipEvaluation } from '@/domain/Journalist/use-cases/register-relationship-evaluation.use-case'
import { UpdateJournalist } from '@/domain/Journalist/use-cases/update-journalist.use-case'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type {
  CreateJournalistInput,
  NewRelationshipEvaluation,
  UpdateJournalistInput,
} from '@/domain/Journalist/journalist.repository'

export class JournalistService {
  private readonly getJournalistById: GetJournalistById
  private readonly createJournalist: CreateJournalist
  private readonly updateJournalist: UpdateJournalist
  private readonly registerRelationshipEvaluation: RegisterRelationshipEvaluation
  private readonly repo: JournalistRepository

  constructor(repo: JournalistRepository) {
    this.repo = repo
    this.getJournalistById = new GetJournalistById(repo)
    this.createJournalist = new CreateJournalist(repo)
    this.updateJournalist = new UpdateJournalist(repo)
    this.registerRelationshipEvaluation = new RegisterRelationshipEvaluation(repo)
  }

  list(): Promise<Paginated<Journalist>> {
    return this.repo.list()
  }

  getById(id: string) {
    return this.getJournalistById.execute(id)
  }

  create(input: CreateJournalistInput) {
    return this.createJournalist.execute(input)
  }

  update(id: string, input: UpdateJournalistInput) {
    return this.updateJournalist.execute(id, input)
  }

  registerEvaluation(id: string, input: NewRelationshipEvaluation) {
    return this.registerRelationshipEvaluation.execute(id, input)
  }
}
