import { beforeEach, describe, expect, it } from 'vitest'

import { useLocalDemandStore } from './local-demand.store'
import type { Demand } from '@/domain/Demand/demand.entity'

const capture = {
  subject: 'Demanda local',
  factContext: 'Contexto recebido.',
  pressRequest: 'Pedido da redação.',
  requestedDeadline: '2026-08-26',
  channel: 'Telefone',
  contactMode: 'local' as const,
  contactName: 'Contato local',
  contactOutlet: 'Redação local',
  journalistId: '',
  journalistName: 'Contato local',
  outletName: 'Redação local',
}

describe('LocalDemandStore interactions', () => {
  beforeEach(() => useLocalDemandStore.getState().reset())

  it('registra várias interações externas na demanda capturada nesta sessão', () => {
    const demand = useLocalDemandStore.getState().add(capture)

    useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T12:00:00.000Z'),
      type: 'phone',
      result: 'information_missing',
      participants: 'Contato local',
      summary: 'Primeira interação.',
      nextStep: 'Retornar à redação.',
    })
    useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T13:00:00.000Z'),
      type: 'email',
      result: 'forwarded',
      participants: 'Contato local e Assessoria',
      summary: 'Segunda interação.',
      nextStep: 'Preparar resposta.',
    })
    const updated = useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T14:00:00.000Z'),
      result: 'resolved',
    })

    expect(updated?.interactions).toHaveLength(3)
    expect(updated?.interactions.map((item) => item.origin)).toEqual(['off_platform', 'off_platform', 'off_platform'])
    expect(updated?.interactions.map((item) => item.result)).toEqual(['information_missing', 'forwarded', 'resolved'])
    expect(updated?.interactions.at(-1)).toEqual(expect.objectContaining({
      type: null,
      participants: null,
      summary: null,
      nextStep: null,
    }))
    expect(updated?.interactions[0]?.id).not.toBe(updated?.interactions[1]?.id)
  })

  it('percorre enriquecimento, review, ajustes, nova versão, aprovação e envio', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const store = useLocalDemandStore.getState()

    store.enrich(demand.id, {
      tags: ['acidente', 'operação'],
      topics: ['Segurança operacional'],
      relatedAreas: ['Operações'],
      confirmedFacts: ['Ocorrência confirmada às 10h'],
      pendingFacts: ['Aguardar laudo'],
      responsibleId: 'r-ana',
      responsibleName: 'Ana Paula',
      priority: 'critical',
      nextStep: 'Validar o laudo com Operações.',
    })
    store.requestReview(demand.id, { reviewer: 'Marina Sousa (Coordenação)', versionLabel: 'v1', requestedBy: 'Noel Ferreira' })
    store.recordDecision(demand.id, { outcome: 'changes_requested', rationale: 'Detalhar a fonte.', decidedBy: 'Marina Sousa', decidedAt: new Date('2026-08-26T14:00:00.000Z') })
    store.recordVersion(demand.id, { versionLabel: 'v2', body: 'Nova versão com a fonte detalhada.', createdAt: new Date('2026-08-26T14:30:00.000Z'), createdBy: 'Noel Ferreira' })
    store.requestReview(demand.id, { reviewer: 'Marina Sousa (Coordenação)', versionLabel: 'v2', requestedBy: 'Noel Ferreira' })
    store.recordDecision(demand.id, { outcome: 'approved', rationale: 'Versão liberada.', decidedBy: 'Marina Sousa', decidedAt: new Date('2026-08-26T15:00:00.000Z') })
    const sent = store.recordPositioning(demand.id, { versionLabel: 'v2', channel: 'E-mail', recipient: 'redacao@exemplo.com', body: 'Posicionamento final.', sentAt: new Date('2026-08-26T16:00:00.000Z'), recordedBy: 'Noel Ferreira' })

    expect(sent?.status).toBe('sent')
    expect(sent?.enrichment.tags).toEqual(['acidente', 'operação'])
    expect(sent?.reviewRequests.map((item) => item.versionLabel)).toEqual(['v1', 'v2'])
    expect(sent?.versions).toEqual([expect.objectContaining({ versionLabel: 'v2', createdBy: 'Noel Ferreira' })])
    expect(sent?.decisions.map((item) => item.decision)).toEqual(['changes_requested', 'approved'])
    expect(sent?.finalPositioning).toEqual(expect.objectContaining({ versionLabel: 'v2', channel: 'E-mail' }))
    expect(sent?.stateTransitions.map((item) => item.to)).toEqual(['in_progress', 'pending_review', 'changes_requested', 'in_progress', 'pending_review', 'approved', 'sent'])
  })

  it('encerra sem envio sem criar posicionamento ou decisão implícita', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    useLocalDemandStore.getState().enrich(demand.id, { priority: 'high', responsibleId: 'r-ana', responsibleName: 'Ana Paula', nextStep: 'Confirmar disponibilidade.' })

    const closed = useLocalDemandStore.getState().closeWithoutSend(demand.id, { reason: 'Prazo expirou sem retorno da redação.', closedBy: 'Noel Ferreira' })

    expect(closed?.status).toBe('closed_without_send')
    expect(closed?.closure?.reason).toBe('Prazo expirou sem retorno da redação.')
    expect(closed?.finalPositioning).toBeNull()
    expect(closed?.decisions).toEqual([])
    expect(closed?.stateTransitions.at(-1)).toEqual(expect.objectContaining({ to: 'closed_without_send', recordedBy: 'Noel Ferreira' }))
  })

  it('adota uma demanda mock na sessão para permitir a jornada sem backend', () => {
    const source: Demand = {
      id: 'mock-1', code: 'DEM-1', title: 'Demanda mock', requestSummary: 'Pedido', journalistId: '', journalistName: 'Redação', outletName: 'Veículo',
      responsibleId: 'r-ana', responsibleName: 'Ana Paula', deadlineAt: new Date('2026-08-28T18:00:00.000Z'), priority: 'critical', status: 'pending_review',
      createdAt: new Date('2026-08-28T10:00:00.000Z'), updatedAt: new Date('2026-08-28T12:00:00.000Z'), interactions: [], decisions: [], finalPositioning: null,
    }

    const adopted = useLocalDemandStore.getState().adopt(source)

    expect(adopted).toEqual(expect.objectContaining({ id: 'mock-1', status: 'pending_review', priority: 'critical', journalistId: '' }))
    expect(useLocalDemandStore.getState().adopt(source)).toBe(adopted)
  })

  it('converte o contato local em vínculo de jornalista sem bloquear a captura', () => {
    const demand = useLocalDemandStore.getState().add(capture)

    const linked = useLocalDemandStore.getState().linkJournalist(demand.id, {
      journalistId: 'j-local-1', journalistName: 'Contato convertido', outletName: 'Redação local',
    })

    expect(linked).toEqual(expect.objectContaining({ contactMode: 'known', journalistId: 'j-local-1', journalistName: 'Contato convertido' }))
    expect(linked?.pressRequest).toBe(capture.pressRequest)
  })
})
