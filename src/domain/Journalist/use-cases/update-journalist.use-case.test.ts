import { describe, expect, it, vi } from 'vitest'

import { InvalidJournalistError, JournalistNotFoundError } from '../errors/journalist.errors'
import type { Journalist } from '../journalist.entity'
import type { JournalistRepository, UpdateJournalistInput } from '../journalist.repository'
import { UpdateJournalist } from './update-journalist.use-case'

const journalist: Journalist = {
  id: 'j-1',
  name: 'Maria Clara',
  roleTitle: 'Repórter',
  outletName: 'TechNews',
  desk: 'Tecnologia',
  email: 'maria@tech.test',
  phone: '',
  preferredChannel: 'email',
  bestContactWindow: 'Tarde',
  topics: ['Startups'],
  isActive: true,
  objectiveStats: { totalDemands: 8, solicitedCount: 6, proactiveCount: 2, successRate: 0.75, positioningUsageRate: 0.5 },
  demandHistory: [],
  relationshipEvaluations: [],
}

function repository(updateProfile: JournalistRepository['updateProfile']): JournalistRepository {
  return {
    list: async () => ({ items: [journalist], total: 1 }),
    getById: async () => journalist,
    create: async (input) => ({ id: 'j-created', ...input }),
    updateProfile,
    addRelationshipEvaluation: async () => journalist,
  }
}

const input: UpdateJournalistInput = {
  name: '  Maria Clara  ',
  roleTitle: ' Repórter Especial ',
  outletName: ' TechNews Brasil ',
  desk: ' Tecnologia ',
  email: ' maria@tech.test ',
  phone: ' ',
  preferredChannel: 'email',
  bestContactWindow: ' Das 9h às 11h ',
  topics: [' Startups ', 'startups', ' IA '],
  isActive: true,
}

describe('UpdateJournalist', () => {
  it('normaliza o perfil objetivo e delega a persistência sem tocar em histórico ou avaliações', async () => {
    const updateProfile = vi.fn(async (_id: string, normalized: UpdateJournalistInput) => ({ ...journalist, ...normalized }))
    const useCase = new UpdateJournalist(repository(updateProfile))

    const updated = await useCase.execute('j-1', input)

    expect(updateProfile).toHaveBeenCalledWith('j-1', {
      ...input,
      name: 'Maria Clara',
      roleTitle: 'Repórter Especial',
      outletName: 'TechNews Brasil',
      desk: 'Tecnologia',
      email: 'maria@tech.test',
      phone: '',
      bestContactWindow: 'Das 9h às 11h',
      topics: ['Startups', 'IA'],
    })
    expect(updated.objectiveStats).toEqual(journalist.objectiveStats)
    expect(updated.relationshipEvaluations).toEqual(journalist.relationshipEvaluations)
  })

  it('reutiliza as invariantes objetivas de criação', () => {
    const useCase = new UpdateJournalist(repository(async () => journalist))

    expect(() => useCase.execute('j-1', { ...input, name: ' ' })).toThrow(InvalidJournalistError)
    expect(() => useCase.execute('j-1', { ...input, email: '', phone: '' })).toThrow('Informe pelo menos um e-mail ou telefone.')
  })

  it('traduz retorno nulo da porta para JournalistNotFoundError', async () => {
    const useCase = new UpdateJournalist(repository(async () => null))

    await expect(useCase.execute('inexistente', input)).rejects.toThrow(JournalistNotFoundError)
  })
})
