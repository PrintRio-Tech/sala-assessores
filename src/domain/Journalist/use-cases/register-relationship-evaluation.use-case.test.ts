import { describe, expect, it, vi } from 'vitest'

import { InvalidRelationshipEvaluationError, JournalistNotFoundError } from '../errors/journalist.errors'
import type { Journalist } from '../journalist.entity'
import type { JournalistRepository, NewRelationshipEvaluation } from '../journalist.repository'
import { RegisterRelationshipEvaluation } from './register-relationship-evaluation.use-case'

const journalist: Journalist = {
  id: 'j-1', name: 'Maria', roleTitle: '', outletName: 'Jornal', desk: '', email: 'maria@jornal.test', phone: '',
  preferredChannel: 'email', bestContactWindow: '', topics: [], isActive: true,
  objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
  demandHistory: [], relationshipEvaluations: [],
}

function repository(addRelationshipEvaluation: JournalistRepository['addRelationshipEvaluation']): JournalistRepository {
  return {
    list: async () => ({ items: [journalist], total: 1 }),
    getById: async () => journalist,
    create: async (input) => ({ id: 'created', ...input }),
    updateProfile: async () => journalist,
    addRelationshipEvaluation,
  }
}

const input: NewRelationshipEvaluation = {
  authorName: '  Ana Paula ',
  recordedAt: new Date('2026-08-27T10:00:00.000Z'),
  score: 4.5,
  traits: [' Analítica ', 'analítica', ' Direta '],
  editorialToneLabel: ' Imparcial / Analítico ',
  notes: ' Registro após contato direto. ',
}

describe('RegisterRelationshipEvaluation', () => {
  it('normaliza e valida o registro explícito antes de persistir', async () => {
    const addRelationshipEvaluation = vi.fn(async (_id: string, normalized: NewRelationshipEvaluation) => ({
      ...journalist,
      relationshipEvaluations: [{ id: 'evaluation-id', ...normalized }],
    }))
    const useCase = new RegisterRelationshipEvaluation(repository(addRelationshipEvaluation))

    const updated = await useCase.execute('j-1', input)

    expect(addRelationshipEvaluation).toHaveBeenCalledWith('j-1', {
      ...input,
      authorName: 'Ana Paula',
      traits: ['Analítica', 'Direta'],
      editorialToneLabel: 'Imparcial / Analítico',
      notes: 'Registro após contato direto.',
    })
    expect(updated.relationshipEvaluations[0]?.id).toBe('evaluation-id')
  })

  it.each([
    [{ authorName: ' ' }, 'Avaliação de relacionamento exige autor identificado.'],
    [{ recordedAt: new Date('inválida') }, 'Avaliação de relacionamento exige data de registro.'],
  ])('rejeita avaliação inválida antes de chamar o repositório: %o', (overrides, message) => {
    const addRelationshipEvaluation = vi.fn(async () => journalist)
    const useCase = new RegisterRelationshipEvaluation(repository(addRelationshipEvaluation))

    expect(() => useCase.execute('j-1', { ...input, ...overrides })).toThrow(InvalidRelationshipEvaluationError)
    expect(() => useCase.execute('j-1', { ...input, ...overrides })).toThrow(message)
    expect(addRelationshipEvaluation).not.toHaveBeenCalled()
  })

  it('traduz retorno nulo da porta para JournalistNotFoundError', async () => {
    const useCase = new RegisterRelationshipEvaluation(repository(async () => null))

    await expect(useCase.execute('inexistente', input)).rejects.toThrow(JournalistNotFoundError)
  })
})
