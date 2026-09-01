import { normalizeAndValidateJournalistProfile } from '../journalist-profile'
import type {
  CreateJournalistInput,
  JournalistRepository,
  NewJournalist,
} from '../journalist.repository'

export class CreateJournalist {
  private readonly repo: JournalistRepository

  constructor(repo: JournalistRepository) {
    this.repo = repo
  }

  execute(input: CreateJournalistInput) {
    const normalized = normalizeAndValidateJournalistProfile(input)

    const journalist: NewJournalist = {
      ...normalized,
      objectiveStats: {
        totalDemands: 0,
        solicitedCount: 0,
        proactiveCount: 0,
        successRate: 0,
        positioningUsageRate: 0,
      },
      demandHistory: [],
      relationshipEvaluations: [],
    }

    return this.repo.create(journalist)
  }
}
