import { describe, expect, it } from 'vitest'

import { toDomain } from './demand.mapper'
import type { DemandDto } from '../DTOs/demand.dto'

describe('demand.mapper', () => {
  it('converte DTO snake_case para entidade de domínio', () => {
    const dto: DemandDto = {
      id: 'd1',
      code: 'DEM-1',
      title: 'Título',
      request_summary: 'Resumo',
      fact_context: 'Fato inicial da pauta, separado do pedido.',
      journalist_id: 'j1',
      journalist_name: 'Ana',
      outlet_name: 'Valor',
      responsible_id: 'r1',
      responsible_name: 'Bruno',
      deadline_at: '2026-08-12T12:00:00.000Z',
      priority: 'high',
      status: 'in_progress',
      created_at: '2026-08-01T12:00:00.000Z',
      updated_at: '2026-08-02T12:00:00.000Z',
      interactions: [{
        id: 'i1',
        occurred_at: '2026-08-02T10:00:00.000Z',
        type: 'phone',
        result: 'waiting_response',
        recorded_by: 'Noel Ferreira',
        participants: 'Ana e redação',
        summary: 'Contato realizado.',
        next_step: 'Aguardar retorno.',
        origin: 'off_platform',
      }, {
        id: 'i2',
        occurred_at: '2026-08-02T11:00:00.000Z',
        result: 'waiting_response',
        type: null,
        participants: null,
        summary: 'Confirmação de recebimento.',
        next_step: null,
        origin: 'off_platform',
      }],
    }

    const entity = toDomain(dto)

    expect(entity.requestSummary).toBe('Resumo')
    expect(entity.factContext).toBe('Fato inicial da pauta, separado do pedido.')
    expect(entity.journalistId).toBe('j1')
    expect(entity.status).toBe('in_progress')
    expect(entity.deadlineAt.toISOString()).toBe('2026-08-12T12:00:00.000Z')
    expect(entity.interactions[0]).toEqual(expect.objectContaining({
      result: 'waiting_response',
      recordedBy: 'Noel Ferreira',
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
      channel: null,
      recipient: null,
      body: null,
    }))
    expect(entity.interactions[1]).toEqual(expect.objectContaining({
      result: 'waiting_response',
      recordedBy: 'Noel Ferreira',
      type: null,
      participants: null,
      summary: 'Confirmação de recebimento.',
      nextStep: null,
    }))
    expect(entity.positioning).toEqual({ state: 'empty', versions: [], approval: null })
  })

  it('mapeia envio e encerramento como interações e transições de estado', () => {
    const dto: DemandDto = {
      id: 'd2', code: 'DEM-2', title: 'Sem envio', request_summary: 'Pedido', journalist_id: '', journalist_name: 'Contato desconhecido', outlet_name: 'Redação',
      responsible_id: 'r1', responsible_name: 'Noel Ferreira', deadline_at: '2026-08-28T18:00:00.000Z', priority: 'critical', status: 'closed_without_send',
      created_at: '2026-08-28T10:00:00.000Z', updated_at: '2026-08-28T16:00:00.000Z',
      interactions: [{
        id: 'i-close',
        occurred_at: '2026-08-28T16:00:00.000Z',
        result: 'closed_without_send',
        summary: 'Redação desistiu.',
        origin: 'off_platform',
      }],
      enrichment: { tags: ['urgente'], topics: ['Operação'], related_areas: ['Jurídico'], confirmed_facts: ['Fato confirmado'], pending_facts: [], next_step: 'Aguardar.' },
      state_transitions: [{ id: 'st1', from: 'in_progress', to: 'closed_without_send', occurred_at: '2026-08-28T16:00:00.000Z', recorded_by: 'Noel Ferreira', trigger: 'closed_without_send' }],
    }

    const entity = toDomain(dto)

    expect(entity.status).toBe('closed_without_send')
    expect(entity.enrichment?.tags).toEqual(['urgente'])
    expect(entity.interactions[0]).toEqual(expect.objectContaining({ result: 'closed_without_send', summary: 'Redação desistiu.' }))
    expect(entity.stateTransitions?.[0]).toEqual(expect.objectContaining({ from: 'in_progress', to: 'closed_without_send', trigger: 'closed_without_send' }))
    expect(entity.factContext).toBeUndefined()
    expect(entity.outcome).toBeNull()
  })

  it('mapeia o resultado da pauta quando presente', () => {
    const dto: DemandDto = {
      id: 'd3', code: 'DEM-3', title: 'Com outcome', request_summary: 'Pedido', journalist_id: 'j1', journalist_name: 'Ana', outlet_name: 'Valor',
      responsible_id: 'r1', responsible_name: 'Noel', deadline_at: '2026-08-28T18:00:00.000Z', priority: 'medium', status: 'sent',
      created_at: '2026-08-01T10:00:00.000Z', updated_at: '2026-08-12T10:00:00.000Z',
      interactions: [],
      outcome: {
        tone_score: 5,
        published: 'yes',
        usage_score: 5,
        result_summary: 'Matéria alinhada.',
        recorded_by: 'Ana Paula',
        recorded_at: '2026-08-13T10:00:00.000Z',
      },
    }

    expect(toDomain(dto).outcome).toEqual({
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: 'Matéria alinhada.',
      recordedBy: 'Ana Paula',
      recordedAt: new Date('2026-08-13T10:00:00.000Z'),
    })
  })
})
