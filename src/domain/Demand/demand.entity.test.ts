import { describe, expect, it } from 'vitest'

import {
  DEMAND_ACTIVE_STATUSES,
  DEMAND_HISTORY_STATUSES,
  getDemandNextActions,
  transitionDemand,
  isActiveDemandStatus,
  isDemandStatus,
  partitionDemandsByLifecycle,
} from './demand.entity'
import type { Demand } from './demand.entity'

function demand(partial: Partial<Demand> & Pick<Demand, 'id' | 'status'>): Demand {
  return {
    code: 'DEM-1',
    title: 'Título',
    requestSummary: 'Resumo',
    journalistId: 'j1',
    journalistName: 'Ana',
    outletName: 'Valor',
    responsibleId: 'r1',
    responsibleName: 'Bruno',
    deadlineAt: new Date('2026-08-12T12:00:00.000Z'),
    priority: 'medium',
    createdAt: new Date('2026-08-01T12:00:00.000Z'),
    updatedAt: new Date('2026-08-01T12:00:00.000Z'),
    interactions: [],
    decisions: [],
    finalPositioning: null,
    ...partial,
  }
}

describe('Demand domain', () => {
  it('reconhece os estados da jornada da POC', () => {
    expect(isDemandStatus('draft')).toBe(true)
    expect(isDemandStatus('in_progress')).toBe(true)
    expect(isDemandStatus('pending_review')).toBe(true)
    expect(isDemandStatus('changes_requested')).toBe(true)
    expect(isDemandStatus('approved')).toBe(true)
    expect(isDemandStatus('sent')).toBe(true)
    expect(isDemandStatus('closed_without_send')).toBe(true)
    expect(isDemandStatus('archived')).toBe(false)
  })

  it('separa demandas ativas de histórico pelo status', () => {
    expect(DEMAND_ACTIVE_STATUSES).toEqual([
      'draft',
      'in_progress',
      'pending_review',
      'changes_requested',
      'approved',
    ])
    expect(DEMAND_HISTORY_STATUSES).toEqual(['sent', 'closed_without_send'])
    expect(isActiveDemandStatus('approved')).toBe(true)
    expect(isActiveDemandStatus('sent')).toBe(false)
  })

  it('expõe somente as próximas ações válidas para cada estado', () => {
    expect(getDemandNextActions('draft')).toEqual(['enrich'])
    expect(getDemandNextActions('in_progress')).toEqual(['register_interaction', 'request_review', 'close_without_send'])
    expect(getDemandNextActions('pending_review')).toEqual(['register_interaction', 'record_decision'])
    expect(getDemandNextActions('changes_requested')).toEqual(['register_interaction', 'record_version', 'close_without_send'])
    expect(getDemandNextActions('approved')).toEqual(['register_interaction', 'record_positioning', 'close_without_send'])
    expect(getDemandNextActions('sent')).toEqual([])
    expect(getDemandNextActions('closed_without_send')).toEqual([])
  })

  it('mantém decisão separada do estado e reprovação volta para ajustes', () => {
    expect(transitionDemand('pending_review', { type: 'record_decision', outcome: 'approved' })).toBe('approved')
    expect(transitionDemand('pending_review', { type: 'record_decision', outcome: 'changes_requested' })).toBe('changes_requested')
    expect(transitionDemand('pending_review', { type: 'record_decision', outcome: 'rejected' })).toBe('changes_requested')
  })

  it('permite nova versão após ajustes e encerramento sem envio como estado terminal', () => {
    expect(transitionDemand('changes_requested', { type: 'record_version' })).toBe('in_progress')
    expect(transitionDemand('approved', { type: 'record_positioning' })).toBe('sent')
    expect(transitionDemand('in_progress', { type: 'close_without_send' })).toBe('closed_without_send')
    expect(() => transitionDemand('sent', { type: 'request_review' })).toThrow(/não está disponível/i)
  })

  it('particiona listas entre ativas e histórico', () => {
    const items = [
      demand({ id: '1', status: 'in_progress' }),
      demand({ id: '2', status: 'sent' }),
      demand({ id: '3', status: 'draft' }),
    ]

    const result = partitionDemandsByLifecycle(items)

    expect(result.active.map((d) => d.id)).toEqual(['1', '3'])
    expect(result.history.map((d) => d.id)).toEqual(['2'])
  })
})
