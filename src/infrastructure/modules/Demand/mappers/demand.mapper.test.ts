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
      journalist_id: 'j1',
      journalist_name: 'Ana',
      outlet_name: 'Valor',
      responsible_id: 'r1',
      responsible_name: 'Bruno',
      deadline_at: '2026-08-12T12:00:00.000Z',
      priority: 'high',
      status: 'draft',
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
        result: 'resolved',
        type: null,
        participants: null,
        summary: null,
        next_step: null,
        origin: 'off_platform',
      }],
      decisions: [],
      final_positioning: null,
    }

    const entity = toDomain(dto)

    expect(entity.requestSummary).toBe('Resumo')
    expect(entity.journalistId).toBe('j1')
    expect(entity.deadlineAt.toISOString()).toBe('2026-08-12T12:00:00.000Z')
    expect(entity.interactions[0]).toEqual(expect.objectContaining({
      result: 'waiting_response',
      recordedBy: 'Noel Ferreira',
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
    }))
    expect(entity.interactions[1]).toEqual(expect.objectContaining({
      result: 'resolved',
      recordedBy: 'Noel Ferreira',
      type: null,
      participants: null,
      summary: null,
      nextStep: null,
    }))
  })

  it('mapeia enriquecimento, reviews e encerramento sem envio sem confundir os registros', () => {
    const dto: DemandDto = {
      id: 'd2', code: 'DEM-2', title: 'Sem envio', request_summary: 'Pedido', journalist_id: '', journalist_name: 'Contato desconhecido', outlet_name: 'Redação',
      responsible_id: 'r1', responsible_name: 'Noel Ferreira', deadline_at: '2026-08-28T18:00:00.000Z', priority: 'critical', status: 'closed_without_send',
      created_at: '2026-08-28T10:00:00.000Z', updated_at: '2026-08-28T16:00:00.000Z', interactions: [], decisions: [], final_positioning: null,
      enrichment: { tags: ['urgente'], topics: ['Operação'], related_areas: ['Jurídico'], confirmed_facts: ['Fato confirmado'], pending_facts: [], next_step: 'Aguardar.' },
      review_requests: [{ id: 'rv1', requested_at: '2026-08-28T12:00:00.000Z', requested_by: 'Noel Ferreira', reviewer: 'Coordenação', version_label: 'v1' }],
      versions: [{ id: 'v2', version_label: 'v2', body: 'Texto revisado.', created_at: '2026-08-28T14:00:00.000Z', created_by: 'Noel Ferreira' }],
      state_transitions: [{ id: 'st1', from: 'changes_requested', to: 'in_progress', occurred_at: '2026-08-28T14:00:00.000Z', recorded_by: 'Noel Ferreira', trigger: 'new_version' }],
      closure: { closed_at: '2026-08-28T16:00:00.000Z', closed_by: 'Noel Ferreira', reason: 'Redação desistiu.' },
    }

    const entity = toDomain(dto)

    expect(entity.status).toBe('closed_without_send')
    expect(entity.enrichment?.tags).toEqual(['urgente'])
    expect(entity.reviewRequests?.[0]?.versionLabel).toBe('v1')
    expect(entity.versions?.[0]).toEqual(expect.objectContaining({ versionLabel: 'v2', createdBy: 'Noel Ferreira' }))
    expect(entity.stateTransitions?.[0]).toEqual(expect.objectContaining({ from: 'changes_requested', to: 'in_progress', trigger: 'new_version' }))
    expect(entity.closure?.reason).toBe('Redação desistiu.')
    expect(entity.finalPositioning).toBeNull()
  })
})
