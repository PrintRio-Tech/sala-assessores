import { describe, expect, it } from 'vitest'

import { DemandService } from '@/application/modules/Demand/service/demand.service'
import { InMemoryDemandRepository } from '@/infrastructure/modules/Demand/demand.repository'

describe('InMemoryDemandRepository', () => {
  it('lista demandas ativas a partir do seed', async () => {
    const service = new DemandService(new InMemoryDemandRepository())
    const result = await service.list({ lifecycle: 'active' })

    expect(result.items.some((item) => item.title.includes('CEO TechCorp'))).toBe(
      true,
    )
  })

  it('registra várias interações na mesma demanda e devolve o estado atualizado', async () => {
    const repository = new InMemoryDemandRepository()
    const service = new DemandService(repository)

    const first = await service.registerInteraction('d-regulacao', {
      occurredAt: new Date('2026-10-20T15:00:00.000Z'),
      result: 'waiting_response',
    })
    const updated = await service.registerInteraction('d-regulacao', {
      occurredAt: new Date('2026-10-22T12:00:00.000Z'),
      type: 'email',
      result: 'waiting_response',
      participants: 'Carolina Montenegro',
      summary: 'Prazo de retorno foi renegociado.',
      nextStep: 'Enviar o posicionamento até 18h.',
    })

    expect(updated.interactions).toHaveLength(5)
    expect(first.interactions.find((item) => item.id.startsWith('interaction-local'))).toEqual(expect.objectContaining({
      result: 'waiting_response',
      origin: 'off_platform',
    }))
    expect(updated.interactions.at(-1)).toEqual(expect.objectContaining({
      type: 'email',
      result: 'waiting_response',
      origin: 'off_platform',
      nextStep: 'Enviar o posicionamento até 18h.',
    }))
    expect((await service.getById('d-regulacao')).interactions).toHaveLength(5)
  })

  it('persiste captura no mesmo adapter usado pela listagem', async () => {
    const repository = new InMemoryDemandRepository()
    const created = await repository.create({
      title: 'Pedido da sessão',
      requestSummary: 'Pedido',
      factContext: 'Contexto',
      journalistId: '',
      journalistName: 'Maria Clara',
      outletName: 'Redação',
      contactMode: 'local',
      contactName: 'Maria Clara',
      contactOutlet: 'Redação',
      responsibleId: 'r-noel',
      responsibleName: 'Noel Ferreira',
      deadlineAt: new Date('2026-08-28T00:00:00.000Z'),
      channel: 'Telefone',
      origin: 'solicited',
      priority: 'high',
      enrichment: { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
    })

    const listed = await repository.list()
    expect(listed.items[0]?.id).toBe(created.id)
    expect(await repository.getById(created.id)).toEqual(created)

    await repository.remove(created.id)
    expect(await repository.getById(created.id)).toBeNull()
    expect((await repository.list()).items.some((item) => item.id === created.id)).toBe(false)
  })
})
