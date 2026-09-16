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
  registerDemandOutcome,
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
  DemandOutcomeNotAllowedError,
  InvalidDemandOutcomeError,
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

  it('rejeita salvar posicionamento sem texto nem anexo ou em caso já fechado', () => {
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

  it('salva versão só com anexo e deixa o texto vazio', () => {
    const saved = savePositioningVersion(emptyPositioning(), {
      id: 'pos-file',
      body: '   ',
      author: 'Noel Ferreira',
      savedAt: new Date('2026-09-13T18:00:00.000Z'),
      attachment: {
        filename: 'nota-oficial.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2048,
        objectUrl: 'blob:http://localhost/nota',
      },
    }, 'in_progress')

    expect(saved.state).toBe('draft')
    expect(currentPositioningBody(saved)).toBe('')
    expect(saved.versions.at(-1)).toEqual(expect.objectContaining({
      id: 'pos-file',
      body: '',
      attachment: {
        filename: 'nota-oficial.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2048,
        objectUrl: 'blob:http://localhost/nota',
      },
    }))
  })

  it('salva versão com texto e anexo juntos', () => {
    const saved = savePositioningVersion(emptyPositioning(), {
      id: 'pos-both',
      body: '  Trecho da nota.  ',
      author: 'Noel Ferreira',
      savedAt: new Date('2026-09-13T18:00:00.000Z'),
      attachment: {
        filename: 'nota.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 4096,
        objectUrl: 'blob:http://localhost/docx',
      },
    }, 'in_progress')

    expect(currentPositioningBody(saved)).toBe('Trecho da nota.')
    expect(saved.versions.at(-1)?.attachment?.filename).toBe('nota.docx')
  })

  it('aprovar sem texto nem anexo falha; anexo sozinho libera o parecer', () => {
    expect(() => applyInteractionToPositioning(emptyPositioning(), {
      result: 'approved',
      approvedBy: 'Coordenação',
      opinion: 'Liberado.',
    })).toThrow(PositioningTextRequiredError)

    const draft = savePositioningVersion(emptyPositioning(), {
      id: 'pos-file',
      body: '',
      author: 'Noel Ferreira',
      savedAt: new Date('2026-09-13T18:00:00.000Z'),
      attachment: {
        filename: 'nota.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
        objectUrl: 'blob:http://localhost/pdf',
      },
    }, 'in_progress')
    const approved = applyInteractionToPositioning(draft, {
      result: 'approved',
      approvedBy: 'Coordenação',
      opinion: 'Liberado para envio.',
      occurredAt: new Date('2026-09-13T19:00:00.000Z'),
    })

    expect(approved.state).toBe('approved')
    expect(approved.approval?.versionId).toBe('pos-file')
    expect(new PositioningTextRequiredError().message).toBe('Salve o posicionamento (texto ou anexo) antes de registrar a aprovação.')
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

  it('rejeita avaliar resultado enquanto o caso está em andamento', () => {
    expect(() => registerDemandOutcome(demand({ id: '1', status: 'in_progress' }), {
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: 'Matéria saiu no Valor.',
      recordedBy: 'Noel Ferreira',
      recordedAt: new Date('2026-09-15T12:00:00.000Z'),
    })).toThrow(DemandOutcomeNotAllowedError)
  })

  it('registra o resultado em caso enviado ou encerrado e substitui o anterior', () => {
    const recordedAt = new Date('2026-09-15T12:00:00.000Z')
    const now = new Date('2026-09-15T13:00:00.000Z')
    const first = registerDemandOutcome(demand({ id: '2', status: 'sent' }), {
      toneScore: 3,
      published: 'unknown',
      usageScore: null,
      resultSummary: 'Ainda sem retorno da redação.',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    }, now)

    expect(first.outcome).toEqual({
      toneScore: 3,
      published: 'unknown',
      usageScore: null,
      resultSummary: 'Ainda sem retorno da redação.',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    })
    expect(first.updatedAt).toEqual(now)

    const second = registerDemandOutcome(first, {
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: '  Matéria publicada com o posicionamento.  ',
      recordedBy: '  Noel Ferreira  ',
      recordedAt: new Date('2026-09-16T10:00:00.000Z'),
    }, new Date('2026-09-16T11:00:00.000Z'))

    expect(second.outcome).toEqual({
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: 'Matéria publicada com o posicionamento.',
      recordedBy: 'Noel Ferreira',
      recordedAt: new Date('2026-09-16T10:00:00.000Z'),
    })

    expect(() => registerDemandOutcome(demand({ id: '3', status: 'closed_without_send' }), {
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: '',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    })).toThrow(InvalidDemandOutcomeError)

    expect(() => registerDemandOutcome(demand({ id: '4', status: 'sent' }), {
      toneScore: 0,
      published: 'yes',
      usageScore: 5,
      resultSummary: 'Resumo',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    })).toThrow(InvalidDemandOutcomeError)

    const unpublished = registerDemandOutcome(demand({ id: '5', status: 'closed_without_send' }), {
      toneScore: 2,
      published: 'no',
      usageScore: 5,
      resultSummary: 'Não saiu no veículo.',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    })
    expect(unpublished.outcome?.usageScore).toBeNull()

    expect(() => registerDemandOutcome(demand({ id: '6', status: 'sent' }), {
      toneScore: 4,
      published: 'yes',
      usageScore: null,
      resultSummary: 'Publicou sem nota de uso.',
      recordedBy: 'Noel Ferreira',
      recordedAt,
    })).toThrow(InvalidDemandOutcomeError)
  })
})
