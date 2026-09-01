import { describe, expect, it } from 'vitest'

import { DemandService } from '@/application/modules/Demand/service/demand.service'
import { MockDemandRepository } from '@/infrastructure/modules/Demand/demand.repository'

describe('MockDemandRepository integration', () => {
  it('lista demandas ativas a partir do seed', async () => {
    const service = new DemandService(new MockDemandRepository())
    const result = await service.list({ lifecycle: 'active' })

    expect(result.items.some((item) => item.title.includes('CEO TechCorp'))).toBe(
      true,
    )
  })

  it('registra várias interações na mesma demanda e devolve o estado atualizado', async () => {
    const repository = new MockDemandRepository()
    const service = new DemandService(repository)

    const resolved = await service.registerInteraction('d-regulacao', {
      occurredAt: new Date('2026-10-20T15:00:00.000Z'),
      result: 'resolved',
    })
    const updated = await service.registerInteraction('d-regulacao', {
      occurredAt: new Date('2026-10-22T12:00:00.000Z'),
      type: 'email',
      result: 'waiting_response',
      participants: 'Carolina Montenegro',
      summary: 'Prazo de retorno foi renegociado.',
      nextStep: 'Enviar o posicionamento até 18h.',
    })

    expect(updated.interactions).toHaveLength(4)
    expect(resolved.interactions.find((item) => item.result === 'resolved' && item.id.startsWith('interaction-local'))).toEqual(expect.objectContaining({
      type: null,
      participants: null,
      summary: null,
      nextStep: null,
      origin: 'off_platform',
    }))
    expect(updated.interactions.at(-1)).toEqual(expect.objectContaining({
      type: 'email',
      result: 'waiting_response',
      origin: 'off_platform',
      nextStep: 'Enviar o posicionamento até 18h.',
    }))
    expect((await service.getById('d-regulacao')).interactions).toHaveLength(4)
  })
})
