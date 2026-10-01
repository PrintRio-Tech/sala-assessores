import { describe, expect, it } from 'vitest'

import type { Demand } from '@/domain/Demand/demand.entity'
import { computePressRoomReport } from './get-press-room-report.use-case'

function demand(partial: Partial<Demand> & Pick<Demand, 'id' | 'status' | 'journalistName'>): Demand {
  return {
    code: 'DEM-1',
    title: 'Título',
    requestSummary: 'Resumo',
    journalistId: 'j1',
    outletName: 'Valor',
    contactMode: 'known',
    contactName: partial.journalistName,
    contactOutlet: 'Valor',
    responsibleId: 'r1',
    responsibleName: 'Ana',
    deadlineAt: new Date('2026-08-12T12:00:00.000Z'),
    origin: 'solicited',
    priority: 'medium',
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
    interactions: [],
    ...partial,
  }
}

const now = new Date('2026-09-30T12:00:00.000Z')

describe('computePressRoomReport', () => {
  it('agrega totais, status e tom a partir das demandas', () => {
    const report = computePressRoomReport([
      demand({ id: '1', status: 'in_progress', journalistName: 'Ana Silva', journalistId: 'j-ana', outletName: 'O Globo', priority: 'high' }),
      demand({ id: '2', status: 'sent', journalistName: 'Ana Silva', journalistId: 'j-ana', outletName: 'O Globo', origin: 'proactive', interactions: [{
        id: 'i1', occurredAt: new Date('2026-08-01T14:18:00.000Z'), type: null, result: 'response_sent',
        participants: null, summary: null, nextStep: null, channel: 'E-mail', recipient: 'ana', body: 'ok', origin: 'off_platform',
      }] }),
      demand({
        id: '3',
        status: 'closed_without_send',
        journalistName: 'Carlos Mendes',
        journalistId: 'j-carlos',
        outletName: 'Folha',
        createdAt: new Date('2026-07-18T12:00:00.000Z'),
        outcome: {
          toneScore: 5, published: 'yes', usageScore: 5, resultSummary: 'Publicou', recordedBy: 'Ana', recordedAt: new Date(),
        },
      }),
    ], { now })

    expect(report.demandCount).toBe(3)
    expect(report.inProgressCount).toBe(1)
    expect(report.sentCount).toBe(1)
    expect(report.closedWithoutSendCount).toBe(1)
    expect(report.journalistCount).toBe(2)
    expect(report.outcomeCount).toBe(1)
    expect(report.publishedCount).toBe(1)
    expect(report.averageToneScore).toBe(5)
    expect(report.demandsByMonth).toHaveLength(12)
    expect(report.demandsByMonth.find((item) => item.yearMonth === '2026-08')?.count).toBe(2)
    expect(report.publishedByMonth.find((item) => item.yearMonth === '2026-07')?.count).toBe(1)
    expect(report.byOrigin.find((item) => item.key === 'proactive')?.count).toBe(1)
    expect(report.highlight).toEqual({ name: 'Carlos Mendes', outletName: 'Folha', publishedCount: 1 })
  })

  it('filtra por responsável e período sem alterar a contagem da base de jornalistas', () => {
    const report = computePressRoomReport([
      demand({ id: '1', status: 'in_progress', journalistName: 'Ana Silva', journalistId: 'j-ana', responsibleId: 'r-ana' }),
      demand({ id: '2', status: 'sent', journalistName: 'Bruno Costa', journalistId: 'j-bruno', responsibleId: 'r-bruno', outletName: 'Estadão' }),
      demand({
        id: '3',
        status: 'sent',
        journalistName: 'Ana Silva',
        journalistId: 'j-ana',
        responsibleId: 'r-ana',
        createdAt: new Date('2026-07-01T12:00:00.000Z'),
      }),
    ], {
      now,
      filter: { responsibleId: 'r-ana', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
    })

    expect(report.demandCount).toBe(1)
    expect(report.journalistCount).toBe(2)
    expect(report.demandsByMonth).toEqual([{ yearMonth: '2026-08', count: 1 }])
    expect(report.highlight).toBeNull()
  })
})
