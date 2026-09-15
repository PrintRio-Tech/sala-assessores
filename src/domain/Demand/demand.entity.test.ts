import { describe, expect, it } from 'vitest'

import {
  DEMAND_ACTIVE_STATUSES,
  DEMAND_HISTORY_STATUSES,
  EXTERNAL_INTERACTION_RESULT_RULES,
  EXTERNAL_INTERACTION_RESULTS,
  applyInteractionToPositioning,
  currentPositioningBody,
  emptyPositioning,
  getDemandNextActions,
  getDemandStatusFilterValues,
  getExternalInteractionFieldErrors,
  isExternalInteractionResult,
  sanitizeDemandListStatus,
  savePositioningVersion,
  transitionDemand,
  isActiveDemandStatus,
  isDemandStatus,
  partitionDemandsByLifecycle,
} from './demand.entity'
import type { Demand } from './demand.entity'
import {
  DemandInteractionNotAllowedError,
  PositioningNotEditableError,
  PositioningTextRequiredError,
} from './errors/demand.errors'

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
    ...partial,
  }
}

describe('Demand domain', () => {
  it('reconhece só os estados ativos da Sala', () => {
    expect(isDemandStatus('in_progress')).toBe(true)
    expect(isDemandStatus('sent')).toBe(true)
    expect(isDemandStatus('closed_without_send')).toBe(true)
    expect(isDemandStatus('draft')).toBe(false)
    expect(isDemandStatus('pending_review')).toBe(false)
    expect(isDemandStatus('changes_requested')).toBe(false)
    expect(isDemandStatus('approved')).toBe(false)
  })

  it('separa demandas ativas de histórico pelo status', () => {
    expect(DEMAND_ACTIVE_STATUSES).toEqual(['in_progress'])
    expect(DEMAND_HISTORY_STATUSES).toEqual(['sent', 'closed_without_send'])
    expect(isActiveDemandStatus('in_progress')).toBe(true)
    expect(isActiveDemandStatus('sent')).toBe(false)
    expect(isActiveDemandStatus('closed_without_send')).toBe(false)
  })

  it('expõe escrever posicionamento e registrar interação enquanto o caso está em andamento', () => {
    expect(getDemandNextActions('in_progress')).toEqual(['write_positioning', 'register_interaction'])
    expect(getDemandNextActions('sent')).toEqual([])
    expect(getDemandNextActions('closed_without_send')).toEqual([])
  })

  it('mantém o status em andamento para recusa, aprovação e encaminhamento', () => {
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'declined' })).toBe('in_progress')
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'approved' })).toBe('in_progress')
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'forwarded' })).toBe('in_progress')
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'waiting_response' })).toBe('in_progress')
  })

  it('fecha o caso só com resposta enviada ou encerramento sem envio', () => {
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'response_sent' })).toBe('sent')
    expect(transitionDemand('in_progress', { type: 'register_interaction', result: 'closed_without_send' })).toBe('closed_without_send')
  })

  it('bloqueia interação em caso já enviado ou encerrado', () => {
    expect(() => transitionDemand('sent', { type: 'register_interaction', result: 'waiting_response' }))
      .toThrow(DemandInteractionNotAllowedError)
    expect(() => transitionDemand('closed_without_send', { type: 'register_interaction', result: 'closed_without_send' }))
      .toThrow(DemandInteractionNotAllowedError)
  })

  it('particiona listas entre ativas e histórico', () => {
    const items = [
      demand({ id: '1', status: 'in_progress' }),
      demand({ id: '2', status: 'sent' }),
      demand({ id: '3', status: 'closed_without_send' }),
    ]

    const result = partitionDemandsByLifecycle(items)

    expect(result.active.map((d) => d.id)).toEqual(['1'])
    expect(result.history.map((d) => d.id)).toEqual(['2', '3'])
  })

  it('expõe status de filtro coerentes com o ciclo e descarta combinações inválidas', () => {
    expect(getDemandStatusFilterValues('active')).toEqual(['all', 'in_progress'])
    expect(getDemandStatusFilterValues('history')).toEqual(['all', 'sent', 'closed_without_send'])
    expect(sanitizeDemandListStatus('in_progress', 'history')).toBe('all')
    expect(sanitizeDemandListStatus('sent', 'active')).toBe('all')
    expect(sanitizeDemandListStatus('closed_without_send', 'active')).toBe('all')
    expect(sanitizeDemandListStatus('sent', 'history')).toBe('sent')
    expect(sanitizeDemandListStatus('in_progress', 'active')).toBe('in_progress')
    expect(sanitizeDemandListStatus('all', 'history')).toBe('all')
  })

  it('expõe os resultados de interação com labels em pt-BR, sem Resolvido e sem campo de versão', () => {
    expect([...EXTERNAL_INTERACTION_RESULTS]).toEqual([
      'waiting_response',
      'forwarded',
      'information_missing',
      'declined',
      'approved',
      'other',
      'response_sent',
      'closed_without_send',
    ])
    expect(EXTERNAL_INTERACTION_RESULT_RULES.waiting_response.label).toBe('Aguardando retorno')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.forwarded.label).toBe('Encaminhado')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.information_missing.label).toBe('Faltou informação ou ajustes')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.declined.label).toBe('Recusado')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.approved.label).toBe('Aprovado')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.other.label).toBe('Outro')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.response_sent.label).toBe('Resposta enviada')
    expect(EXTERNAL_INTERACTION_RESULT_RULES.closed_without_send.label).toBe('Encerrado sem resposta')
    expect(isExternalInteractionResult('resolved')).toBe(false)
    expect(JSON.stringify(EXTERNAL_INTERACTION_RESULT_RULES)).not.toMatch(/versão/i)
  })

  it('exige canal, destinatário e texto só na resposta enviada', () => {
    expect(getExternalInteractionFieldErrors('response_sent', {})).toEqual({
      channel: 'Informe o canal.',
      recipient: 'Informe o destinatário.',
      body: 'Informe o texto enviado.',
    })
    expect(getExternalInteractionFieldErrors('response_sent', {
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota enviada.',
    })).toEqual({})
    expect(getExternalInteractionFieldErrors('approved', {
      participants: 'Coordenação',
      summary: 'Parecer liberado.',
    })).toEqual({})
    expect(getExternalInteractionFieldErrors('closed_without_send', {})).toEqual({
      summary: 'Informe o motivo do encerramento.',
    })
    expect(EXTERNAL_INTERACTION_RESULT_RULES.forwarded.fields.nextStep.required).toBe(true)
    expect(EXTERNAL_INTERACTION_RESULT_RULES.response_sent.fields.nextStep.visible).toBe(false)
    expect(EXTERNAL_INTERACTION_RESULT_RULES.response_sent.fields.type.visible).toBe(false)
  })

  it('salva versão do posicionamento como rascunho com autor e data', () => {
    const saved = savePositioningVersion(emptyPositioning(), {
      id: 'pos-1',
      body: '  Nota sobre o acidente.  ',
      author: 'Noel Ferreira',
      savedAt: new Date('2026-09-13T18:00:00.000Z'),
    }, 'in_progress')

    expect(saved.state).toBe('draft')
    expect(currentPositioningBody(saved)).toBe('Nota sobre o acidente.')
    expect(saved.versions).toEqual([expect.objectContaining({
      id: 'pos-1',
      body: 'Nota sobre o acidente.',
      author: 'Noel Ferreira',
    })])
    expect(saved.approval).toBeNull()
  })

  it('rejeita salvar posicionamento sem texto ou em caso já fechado', () => {
    expect(() => savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: '   ', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'in_progress')).toThrow(PositioningTextRequiredError)
    expect(() => savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: 'Nota.', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'sent')).toThrow(PositioningNotEditableError)
    expect(() => savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: 'Nota.', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'closed_without_send')).toThrow(PositioningNotEditableError)
  })

  it('aprovar sem texto falha; com texto marca o artefato e prende o parecer a esta versão', () => {
    expect(() => applyInteractionToPositioning(emptyPositioning(), {
      result: 'approved',
      approvedBy: 'Coordenação',
      opinion: 'Liberado.',
      occurredAt: new Date('2026-09-13T19:00:00.000Z'),
    })).toThrow(PositioningTextRequiredError)

    const draft = savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: 'Nota oficial.', author: 'Noel Ferreira', savedAt: new Date('2026-09-13T18:00:00.000Z'),
    }, 'in_progress')
    const approved = applyInteractionToPositioning(draft, {
      result: 'approved',
      approvedBy: 'Coordenação',
      opinion: 'Liberado para envio.',
      occurredAt: new Date('2026-09-13T19:00:00.000Z'),
    })

    expect(approved.state).toBe('approved')
    expect(approved.approval).toEqual({
      approvedBy: 'Coordenação',
      opinion: 'Liberado para envio.',
      approvedAt: new Date('2026-09-13T19:00:00.000Z'),
      versionId: 'pos-1',
    })
    expect(currentPositioningBody(approved)).toBe('Nota oficial.')
  })

  it('enviar usa o texto atual e marca o artefato como enviado', () => {
    const draft = savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: 'Nota oficial.', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'in_progress')
    const sent = applyInteractionToPositioning(draft, { result: 'response_sent' })

    expect(sent.state).toBe('sent')
    expect(currentPositioningBody(sent)).toBe('Nota oficial.')
  })

  it('nova versão depois de aprovado volta a rascunho e solta o parecer', () => {
    const draft = savePositioningVersion(emptyPositioning(), {
      id: 'pos-1', body: 'Nota 1.', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'in_progress')
    const approved = applyInteractionToPositioning(draft, {
      result: 'approved', approvedBy: 'Coordenação', opinion: 'Ok.', occurredAt: new Date(),
    })
    const next = savePositioningVersion(approved, {
      id: 'pos-2', body: 'Nota 2.', author: 'Noel Ferreira', savedAt: new Date(),
    }, 'in_progress')

    expect(next.state).toBe('draft')
    expect(next.approval).toBeNull()
    expect(currentPositioningBody(next)).toBe('Nota 2.')
    expect(next.versions).toHaveLength(2)
  })
})
