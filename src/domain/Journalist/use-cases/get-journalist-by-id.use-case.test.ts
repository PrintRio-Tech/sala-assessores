import { describe, expect, it } from 'vitest'

import { GetJournalistById } from './get-journalist-by-id.use-case'
import { JournalistNotFoundError } from '../errors/journalist.errors'
import type { Journalist } from '../journalist.entity'

const journalist: Journalist = {
  id: 'j1',
  name: 'Carolina Montenegro',
  roleTitle: 'Repórter Especial',
  outletName: 'Valor Econômico',
  desk: 'Economia',
  email: 'c.montenegro@valor.com.br',
  phone: '+55 (11) 98765-4321',
  preferredChannel: 'whatsapp',
  bestContactWindow: 'Manhã (09:00 - 11:30)',
  topics: ['Economia Macro', 'Sustentabilidade ESG'],
  isActive: true,
  objectiveStats: {
    totalDemands: 142,
    solicitedCount: 80,
    proactiveCount: 62,
    successRate: 0.78,
    positioningUsageRate: 0.65,
  },
  demandHistory: [
    {
      demandId: 'd2',
      title: 'Resultados do Q1 2024',
      status: 'sent',
      occurredAt: new Date('2026-03-12T09:00:00.000Z'),
      kindLabel: 'Envio de release',
    },
  ],
  relationshipEvaluations: [
    {
      id: 'e1',
      authorName: 'Ana Paula',
      recordedAt: new Date('2026-07-01T10:00:00.000Z'),
      score: 4.8,
      traits: ['Foco em Dados', 'Questionador'],
      editorialToneLabel: 'Imparcial / Analítico',
      notes: 'Avaliação registrada manualmente pela assessoria.',
    },
  ],
}

describe('GetJournalistById', () => {
  it('retorna perfil com avaliações atribuídas e histórico', async () => {
    const useCase = new GetJournalistById({
      async getById(id) {
        return id === 'j1' ? journalist : null
      },
      async list() {
        return { items: [journalist], total: 1 }
      },
      async create(input) {
        return { id: 'created', ...input }
      },
      async updateProfile() {
        return journalist
      },
      async addRelationshipEvaluation() {
        return journalist
      },
    })

    const result = await useCase.execute('j1')

    expect(result.name).toBe('Carolina Montenegro')
    expect(result.relationshipEvaluations[0]?.authorName).toBe('Ana Paula')
    expect(result.demandHistory[0]?.demandId).toBe('d2')
  })

  it('lança erro tipado quando o jornalista não existe', async () => {
    const useCase = new GetJournalistById({
      async getById() {
        return null
      },
      async list() {
        return { items: [], total: 0 }
      },
      async create(input) {
        return { id: 'created', ...input }
      },
      async updateProfile() {
        return null
      },
      async addRelationshipEvaluation() {
        return null
      },
    })

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      JournalistNotFoundError,
    )
  })
})
