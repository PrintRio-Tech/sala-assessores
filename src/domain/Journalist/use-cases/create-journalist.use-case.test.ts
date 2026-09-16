import { describe, expect, it, vi } from 'vitest'

import { InvalidJournalistError } from '../errors/journalist.errors'
import type { Journalist, JournalistObjectiveStats } from '../journalist.entity'
import type { JournalistRepository, NewJournalist } from '../journalist.repository'
import { CreateJournalist } from './create-journalist.use-case'

const zeroStats: JournalistObjectiveStats = {
  totalDemands: 0,
  solicitedCount: 0,
  proactiveCount: 0,
  successRate: 0,
  positioningUsageRate: 0,
}

function repository(create = vi.fn(async (input: NewJournalist): Promise<Journalist> => ({ id: 'j-local-safe', ...input }))): JournalistRepository {
  return {
    list: async () => ({ items: [], total: 0 }),
    getById: async () => null,
    create,
    updateProfile: async () => null,
    addRelationshipEvaluation: async () => null,
  }
}

describe('CreateJournalist', () => {
  it('normaliza os dados e inicia fatos objetivos sem inventar histórico ou avaliação', async () => {
    const create = vi.fn(async (input: NewJournalist): Promise<Journalist> => ({ id: 'j-local-safe', ...input }))
    const useCase = new CreateJournalist(repository(create))

    const journalist = await useCase.execute({
      name: '  Joana Ribeiro  ',
      outletName: '  Jornal da Cidade ',
      roleTitle: ' Repórter ',
      desk: ' Cotidiano ',
      email: ' joana@jornal.test ',
      phone: '',
      preferredChannel: 'email',
      bestContactWindow: ' Das 9h às 11h ',
      topics: [' Mobilidade ', '', 'mobilidade', 'Cidades'],
      isActive: true,
    })

    expect(journalist).toMatchObject({
      id: 'j-local-safe',
      name: 'Joana Ribeiro',
      outletName: 'Jornal da Cidade',
      roleTitle: 'Repórter',
      desk: 'Cotidiano',
      email: 'joana@jornal.test',
      bestContactWindow: 'Das 9h às 11h',
      topics: ['Mobilidade', 'Cidades'],
      isActive: true,
      objectiveStats: zeroStats,
      demandHistory: [],
      relationshipEvaluations: [],
    })
    expect(create).toHaveBeenCalledOnce()
  })

  it('persiste nota inicial opcional como primeira avaliação de relacionamento', async () => {
    const create = vi.fn(async (input: NewJournalist): Promise<Journalist> => ({ id: 'j-local-scored', ...input }))
    const useCase = new CreateJournalist(repository(create))

    const journalist = await useCase.execute({
      name: 'Joana Ribeiro',
      outletName: 'Jornal da Cidade',
      roleTitle: 'Repórter',
      desk: 'Cotidiano',
      email: 'joana@jornal.test',
      phone: '',
      preferredChannel: 'email',
      bestContactWindow: '',
      topics: ['Cidades'],
      isActive: true,
      initialScore: 4,
      initialScoreAuthorName: 'Noel Ferreira',
    })

    expect(journalist.relationshipEvaluations).toHaveLength(1)
    expect(journalist.relationshipEvaluations[0]).toEqual(expect.objectContaining({
      score: 4,
      authorName: 'Noel Ferreira',
      editorialToneLabel: 'Nota inicial do cadastro',
    }))
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty('initialScore')
  })

  it.each([
    [{ name: '', outletName: 'Veículo', email: 'a@b.test', phone: '' }, 'Informe o nome completo.'],
    [{ name: 'Joana', outletName: '', email: 'a@b.test', phone: '' }, 'Informe o veículo ou redação.'],
    [{ name: 'Joana', outletName: 'Veículo', email: '', phone: '' }, 'Informe pelo menos um e-mail ou telefone.'],
  ])('protege as invariantes obrigatórias: %o', async (overrides, message) => {
    const useCase = new CreateJournalist(repository())
    const baseInput = {
      name: 'Joana', outletName: 'Veículo', roleTitle: '', desk: '', email: '', phone: '',
      preferredChannel: 'email' as const, topics: [], isActive: true,
      bestContactWindow: '',
    }
    const input = { ...baseInput, ...overrides }

    expect(() => useCase.execute(input)).toThrow(InvalidJournalistError)
    expect(() => useCase.execute(input)).toThrow(message)
  })
})
