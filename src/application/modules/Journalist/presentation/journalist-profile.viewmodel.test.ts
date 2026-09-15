import { describe, expect, it } from 'vitest'

import type { LocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
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

const mockDemand: Demand = {
  id: 'd-shared',
  code: 'DEM-001',
  title: 'Título antigo do seed',
  requestSummary: 'Pedido original',
  journalistId: journalist.id,
  journalistName: journalist.name,
  outletName: journalist.outletName,
  responsibleId: 'r-ana',
  responsibleName: 'Ana Paula',
  deadlineAt: new Date('2026-08-30T12:00:00.000Z'),
  priority: 'medium',
  status: 'in_progress',
  createdAt: new Date('2026-08-20T12:00:00.000Z'),
  updatedAt: new Date('2026-08-20T12:00:00.000Z'),
  interactions: [],
  enrichment: { tags: [], topics: ['Tema antigo'], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
}

const adoptedLocalDemand: LocalDemandCapture = {
  id: mockDemand.id,
  code: mockDemand.code,
  subject: 'Título atualizado localmente',
  factContext: 'Contexto',
  pressRequest: mockDemand.requestSummary,
  requestedDeadline: '2026-08-30',
  channel: 'Registro mock',
  contactMode: 'known',
  contactName: journalist.name,
  contactOutlet: journalist.outletName,
  journalistId: journalist.id,
  journalistName: journalist.name,
  outletName: journalist.outletName,
  createdAt: mockDemand.createdAt,
  updatedAt: new Date('2026-08-25T12:00:00.000Z'),
  status: 'sent',
  responsibleId: 'r-noel',
  responsibleName: 'Noel Ferreira',
  createdBy: null,
  priority: 'critical',
  enrichment: { tags: [], topics: ['Tema local'], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
  stateTransitions: [],
  positioning: emptyPositioning(),
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
}

describe('buildJournalistProfileViewModel', () => {
  it('deduplica demandas por ID e usa o registro local adotado como fonte de verdade', () => {
    const profile = buildJournalistProfileViewModel(journalist, [mockDemand], [adoptedLocalDemand])

    expect(profile.objectiveStats.totalDemands).toBe(1)
    expect(profile.objectiveStats.successRate).toBe(1)
    expect(profile.objectiveStats.positioningUsageRate).toBe(1)
    expect(profile.demandHistory).toEqual([
      expect.objectContaining({
        demandId: 'd-shared',
        title: 'Título atualizado localmente',
        status: 'sent',
        kindLabel: 'Demanda local',
      }),
    ])
    expect(profile.topics).toContain('Tema local')
    expect(profile.topics).not.toContain('Tema antigo')
  })
})
