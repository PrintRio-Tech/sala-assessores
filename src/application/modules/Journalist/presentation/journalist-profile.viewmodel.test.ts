import { describe, expect, it } from 'vitest'

import type { Demand } from '@/domain/Demand/demand.entity'
import { emptyPositioning } from '@/domain/Demand/demand.entity'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import { buildJournalistProfileViewModel } from './journalist-profile.viewmodel'

const journalist: Journalist = {
  id: 'j-1',
  name: 'Joana Ribeiro',
  roleTitle: 'Repórter',
  outletName: 'Jornal Teste',
  desk: 'Cidades',
  email: 'joana@example.test',
  phone: '',
  preferredChannel: 'email',
  bestContactWindow: '',
  topics: ['Cidades'],
  isActive: true,
  objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
  demandHistory: [],
  relationshipEvaluations: [],
}

const demand: Demand = {
  id: 'd-shared',
  code: 'DEM-001',
  title: 'Título atualizado',
  requestSummary: 'Pedido original',
  journalistId: journalist.id,
  journalistName: journalist.name,
  outletName: journalist.outletName,
  contactMode: 'known',
  contactName: journalist.name,
  contactOutlet: journalist.outletName,
  responsibleId: 'r-noel',
  responsibleName: 'Noel Ferreira',
  deadlineAt: new Date('2026-08-30T12:00:00.000Z'),
  origin: 'solicited',
  priority: 'critical',
  status: 'sent',
  createdAt: new Date('2026-08-20T12:00:00.000Z'),
  updatedAt: new Date('2026-08-25T12:00:00.000Z'),
  interactions: [{
    id: 'int-sent',
    occurredAt: new Date('2026-08-25T12:00:00.000Z'),
    type: null,
    result: 'response_sent',
    participants: null,
    summary: null,
    nextStep: null,
    channel: 'E-mail',
    recipient: journalist.name,
    body: 'Posicionamento',
    origin: 'off_platform',
  }],
  positioning: emptyPositioning(),
  enrichment: { tags: [], topics: ['Tema atual'], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
  outcome: {
    toneScore: 5,
    published: 'yes',
    usageScore: 5,
    resultSummary: 'Matéria alinhada ao posicionamento.',
    recordedBy: 'Noel Ferreira',
    recordedAt: new Date('2026-08-26T12:00:00.000Z'),
  },
}

describe('buildJournalistProfileViewModel', () => {
  it('projeta histórico e resultado a partir das demandas do repositório', () => {
    const profile = buildJournalistProfileViewModel(journalist, [demand])

    expect(profile.objectiveStats.totalDemands).toBe(1)
    expect(profile.objectiveStats.successRate).toBe(1)
    expect(profile.objectiveStats.positioningUsageRate).toBe(1)
    expect(profile.demandHistory).toEqual([
      expect.objectContaining({
        demandId: 'd-shared',
        title: 'Título atualizado',
        status: 'sent',
        kindLabel: 'Demanda registrada',
        outcomeLabel: 'Publicado · Tom 5/5 · Uso 5/5',
      }),
    ])
    expect(profile.caseOutcomes).toEqual([
      expect.objectContaining({
        demandId: 'd-shared',
        demandTitle: 'Título atualizado',
        toneScore: 5,
        publishedLabel: 'Sim',
        usageScore: 5,
        caseScoreLabel: '5.0',
        resultSummary: 'Matéria alinhada ao posicionamento.',
      }),
    ])
    expect(profile.relationshipScore).toBe(5)
    expect(profile.relationshipScoreLabel).toBe('5.0')
    expect(profile.topics).toContain('Tema atual')
  })

  it('mostra solicitedCount e proactiveCount que o BFF devolveu', () => {
    const fromBff: Journalist = {
      ...journalist,
      objectiveStats: {
        totalDemands: 8,
        solicitedCount: 6,
        proactiveCount: 2,
        successRate: 0.75,
        positioningUsageRate: 0.5,
      },
    }

    const profile = buildJournalistProfileViewModel(fromBff, [demand])

    expect(profile.objectiveStats.solicitedCount).toBe(6)
    expect(profile.objectiveStats.proactiveCount).toBe(2)
  })

  it('média mistura nota inicial do cadastro com notas das pautas', () => {
    const withInitial: Journalist = {
      ...journalist,
      relationshipEvaluations: [{
        id: 'ev-1',
        authorName: 'Noel Ferreira',
        recordedAt: new Date('2026-08-01T12:00:00.000Z'),
        score: 3,
        traits: [],
        editorialToneLabel: 'Nota inicial do cadastro',
        notes: '',
      }],
    }

    const profile = buildJournalistProfileViewModel(withInitial, [demand])
    expect(profile.relationshipScore).toBe(4)
    expect(profile.relationshipScoreLabel).toBe('4.0')
  })
})
