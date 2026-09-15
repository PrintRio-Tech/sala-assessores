import { describe, expect, it } from 'vitest'

import { applyDemandCaptureRevision } from './revise-demand-capture.use-case'

const revision = {
  subject: 'Assunto atualizado',
  factContext: 'Fato confirmado na redação.',
  pressRequest: 'Pedido atualizado.',
  requestedDeadline: '2026-09-12',
  channel: 'E-mail',
  contactMode: 'local' as const,
  contactName: 'Joana Ribeiro',
  contactOutlet: 'TV Globo',
  journalistId: '',
  journalistName: 'Joana Ribeiro',
  outletName: 'TV Globo',
}

const historyRecord = {
  status: 'sent' as const,
  subject: 'Assunto original',
  factContext: 'Contexto original.',
  pressRequest: 'Pedido original.',
  requestedDeadline: '2026-03-12',
  channel: 'Telefone',
  contactMode: 'known' as const,
  contactName: 'Carolina Montenegro',
  contactOutlet: 'Valor Econômico',
  journalistId: 'j-carolina',
  journalistName: 'Carolina Montenegro',
  outletName: 'Valor Econômico',
  createdBy: { id: 'r-ana', name: 'Ana Paula' },
  responsibleId: 'r-ana',
  responsibleName: 'Ana Paula',
  priority: 'medium' as const,
  enrichment: { tags: ['original'], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null as string | null },
  stateTransitions: [{ id: 'st-1', from: 'in_progress' as const, to: 'sent' as const, occurredAt: new Date('2026-03-12T09:00:00.000Z'), recordedBy: 'Ana Paula', trigger: 'response_sent' as const }],
  interactions: [{
    id: 'int-1',
    occurredAt: new Date('2026-03-12T09:00:00.000Z'),
    type: null,
    result: 'response_sent' as const,
    participants: null,
    summary: null,
    nextStep: null,
    channel: 'E-mail',
    recipient: 'redacao@valor.com',
    body: 'Posicionamento final.',
    origin: 'off_platform' as const,
  }],
}

describe('applyDemandCaptureRevision', () => {
  it('atualiza só os dados de cadastro e preserva status, interações e transições', () => {
    const closed = {
      ...historyRecord,
      status: 'closed_without_send' as const,
      interactions: [{
        ...historyRecord.interactions[0]!,
        result: 'closed_without_send' as const,
        channel: null,
        recipient: null,
        body: null,
        summary: 'Pauta mudou.',
      }],
      stateTransitions: [{ id: 'st-1', from: 'in_progress' as const, to: 'closed_without_send' as const, occurredAt: new Date('2026-07-18T12:00:00.000Z'), recordedBy: 'Ana Paula', trigger: 'closed_without_send' as const }],
    }

    const sentUpdated = applyDemandCaptureRevision(historyRecord, revision)
    const closedUpdated = applyDemandCaptureRevision(closed, revision)

    expect(sentUpdated).toEqual(expect.objectContaining({
      ...revision,
      status: 'sent',
      stateTransitions: historyRecord.stateTransitions,
      interactions: historyRecord.interactions,
      responsibleId: 'r-ana',
      createdBy: { id: 'r-ana', name: 'Ana Paula' },
      priority: 'medium',
      enrichment: historyRecord.enrichment,
    }))
    expect(closedUpdated.status).toBe('closed_without_send')
    expect(closedUpdated.interactions[0]?.summary).toBe('Pauta mudou.')
    expect(closedUpdated.createdBy).toEqual({ id: 'r-ana', name: 'Ana Paula' })
  })

  it('atualiza prioridade e enriquecimento sem alterar createdBy ou responsável', () => {
    const updated = applyDemandCaptureRevision(historyRecord, {
      ...revision,
      priority: 'critical',
      enrichment: { tags: ['revisada'], topics: ['Tema'], relatedAreas: ['Jurídico'], confirmedFacts: ['Fato'], pendingFacts: [], nextStep: 'Seguir.' },
    })

    expect(updated.priority).toBe('critical')
    expect(updated.enrichment).toEqual({
      tags: ['revisada'],
      topics: ['Tema'],
      relatedAreas: ['Jurídico'],
      confirmedFacts: [],
      pendingFacts: [],
      nextStep: null,
    })
    expect(updated.createdBy).toEqual({ id: 'r-ana', name: 'Ana Paula' })
    expect(updated.responsibleId).toBe('r-ana')
    expect(updated.responsibleName).toBe('Ana Paula')
  })
})
