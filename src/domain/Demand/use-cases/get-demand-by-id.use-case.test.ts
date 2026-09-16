import { describe, expect, it } from 'vitest'

import { GetDemandById } from './get-demand-by-id.use-case'
import { DemandNotFoundError } from '../errors/demand.errors'
import type { Demand } from '../demand.entity'

describe('GetDemandById', () => {
  const demand: Demand = {
    id: 'd1',
    code: 'DEM-992-B',
    title: 'Urgent Contract Review Needed',
    requestSummary: 'Resumo da solicitação',
    journalistId: 'j1',
    journalistName: 'Carolina Montenegro',
    outletName: 'Valor Econômico',
    responsibleId: 'r1',
    responsibleName: 'Ana Paula',
    deadlineAt: new Date('2026-10-24T12:00:00.000Z'),
    priority: 'high',
    status: 'in_progress',
    createdAt: new Date('2026-10-20T14:32:05.000Z'),
    updatedAt: new Date('2026-10-21T10:15:22.000Z'),
    interactions: [
      {
        id: 'i1',
        occurredAt: new Date('2026-10-20T14:32:05.000Z'),
        type: 'email',
        result: 'waiting_response',
        participants: 'J. Doe (Cliente)',
        summary: 'Solicitação inicial registrada fora da plataforma.',
        nextStep: 'Preparar posicionamento',
        channel: null,
        recipient: null,
        body: null,
        origin: 'off_platform',
      },
    ],
  }

  it('retorna a demanda com interações registradas', async () => {
    const useCase = new GetDemandById({
      async list() {
        return { items: [], total: 0 }
      },
      async getById(id) {
        return id === 'd1' ? demand : null
      },
      async registerInteraction() {
        return null
      },
      async savePositioning() {
        return null
      },
      async registerOutcome() {
        return null
      },
    })

    const result = await useCase.execute('d1')

    expect(result.code).toBe('DEM-992-B')
    expect(result.interactions).toHaveLength(1)
    expect(result.interactions[0]?.origin).toBe('off_platform')
    expect(result.status).toBe('in_progress')
  })

  it('lança erro tipado quando a demanda não existe', async () => {
    const useCase = new GetDemandById({
      async list() {
        return { items: [], total: 0 }
      },
      async getById() {
        return null
      },
      async registerInteraction() {
        return null
      },
      async savePositioning() {
        return null
      },
      async registerOutcome() {
        return null
      },
    })

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      DemandNotFoundError,
    )
  })
})
