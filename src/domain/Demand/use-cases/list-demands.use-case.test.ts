import { describe, expect, it } from 'vitest'

import { ListDemands } from './list-demands.use-case'
import type { Demand } from '../demand.entity'
import type { DemandRepository } from '../demand.repository'

function demand(partial: Partial<Demand> & Pick<Demand, 'id' | 'status' | 'title'>): Demand {
  return {
    code: 'DEM-1',
    requestSummary: 'Resumo',
    journalistId: 'j1',
    journalistName: 'Maria Clara',
    outletName: 'Valor',
    responsibleId: 'r1',
    responsibleName: 'Ana Paula',
    deadlineAt: new Date('2026-08-12T12:00:00.000Z'),
    priority: 'high',
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
    interactions: [],
    decisions: [],
    finalPositioning: null,
    ...partial,
  }
}

function createRepo(items: Demand[]): DemandRepository {
  return {
    async list() {
      return { items, total: items.length }
    },
    async getById(id) {
      return items.find((item) => item.id === id) ?? null
    },
    async registerInteraction() {
      return null
    },
  }
}

describe('ListDemands', () => {
  const items = [
    demand({
      id: '1',
      status: 'in_progress',
      title: 'Entrevista exclusiva: CEO TechCorp',
      journalistName: 'Maria Clara',
      responsibleName: 'Ana Paula',
    }),
    demand({
      id: '2',
      status: 'sent',
      title: 'Resultados do Q1 2024',
      journalistName: 'João Silva',
      responsibleName: 'Ricardo M.',
    }),
    demand({
      id: '3',
      status: 'pending_review',
      title: 'Relatório ESG: Setor de Energia',
      journalistName: 'Fernanda Rocha',
      responsibleName: 'Bruno Costa',
    }),
  ]

  it('filtra por busca em título ou jornalista', async () => {
    const useCase = new ListDemands(createRepo(items))

    const result = await useCase.execute({ search: 'ESG', lifecycle: 'all' })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.id).toBe('3')
  })

  it('filtra por status e responsável', async () => {
    const useCase = new ListDemands(createRepo(items))

    const result = await useCase.execute({
      status: 'in_progress',
      responsibleId: 'r1',
      lifecycle: 'active',
    })

    expect(result.items.map((d) => d.id)).toEqual(['1'])
  })

  it('retorna apenas histórico quando lifecycle=history', async () => {
    const useCase = new ListDemands(createRepo(items))

    const result = await useCase.execute({ lifecycle: 'history' })

    expect(result.items.map((d) => d.id)).toEqual(['2'])
    expect(result.activeCount).toBe(2)
    expect(result.historyCount).toBe(1)
  })
})
