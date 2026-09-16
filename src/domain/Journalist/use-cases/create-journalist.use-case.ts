import { assertRelationshipEvaluation } from '../journalist.entity'
import { InvalidRelationshipEvaluationError } from '../errors/journalist.errors'
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
    const { initialScore, initialScoreAuthorName, ...profileInput } = input
    const normalized = normalizeAndValidateJournalistProfile(profileInput)
    const relationshipEvaluations: NewJournalist['relationshipEvaluations'] = []

    if (initialScore != null) {
      if (!Number.isFinite(initialScore) || initialScore < 1 || initialScore > 5) {
        throw new InvalidRelationshipEvaluationError('Informe uma nota entre 1 e 5.')
      }
      const evaluation = {
        id: globalThis.crypto.randomUUID(),
        authorName: (initialScoreAuthorName ?? '').trim() || 'Cadastro',
        recordedAt: new Date(),
        score: initialScore,
        traits: [],
        editorialToneLabel: 'Nota inicial do cadastro',
        notes: '',
      }
      assertRelationshipEvaluation(evaluation)
      relationshipEvaluations.push(evaluation)
    }

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
      relationshipEvaluations,
    }

    return this.repo.create(journalist)
  }
}
