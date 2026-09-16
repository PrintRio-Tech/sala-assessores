import { beforeEach, describe, expect, it } from 'vitest'

import { useLocalDemandStore } from './local-demand.store'
import { currentUser } from '@/application/current-user'
import type { Demand } from '@/domain/Demand/demand.entity'
import { DemandInteractionNotAllowedError, PositioningTextRequiredError } from '@/domain/Demand/errors/demand.errors'

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

const emptyEnrichment = { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null }

function mockDemand(partial: Partial<Demand> & Pick<Demand, 'id' | 'status'>): Demand {
  return {
    code: 'DEM-1', title: 'Demanda mock', requestSummary: 'Pedido', journalistId: '', journalistName: 'Redação', outletName: 'Veículo',
    responsibleId: 'r-ana', responsibleName: 'Ana Paula', deadlineAt: new Date('2026-08-28T18:00:00.000Z'), priority: 'critical',
    createdAt: new Date('2026-08-28T10:00:00.000Z'), updatedAt: new Date('2026-08-28T12:00:00.000Z'), interactions: [],
    ...partial,
  }
}

describe('LocalDemandStore interactions', () => {
  beforeEach(() => useLocalDemandStore.getState().reset())

  it('nasce em andamento com createdBy e responsável do currentUser', () => {
    const demand = useLocalDemandStore.getState().add({
      ...capture,
      priority: 'high',
      enrichment: { tags: ['operação'], topics: ['Segurança'], relatedAreas: ['Operações'], confirmedFacts: ['Fato confirmado'], pendingFacts: ['Laudo'], nextStep: 'Validar laudo.' },
    })

    expect(demand.status).toBe('in_progress')
    expect(demand.positioning.state).toBe('empty')
    expect(demand.createdBy).toEqual({ id: currentUser.id, name: currentUser.name })
    expect(demand.responsibleId).toBe(currentUser.id)
    expect(demand.responsibleName).toBe(currentUser.name)
    expect(demand.priority).toBe('high')
    expect(demand.enrichment.tags).toEqual(['operação'])
  })

  it('não inventa canal, fato nem createdBy ao adotar um registro mock', () => {
    const adopted = useLocalDemandStore.getState().adopt(mockDemand({ id: 'mock-1', status: 'in_progress' }))

    expect(adopted.createdBy).toBeNull()
    expect(adopted.channel).toBe('')
    expect(adopted.factContext).toBe('')
    expect(adopted.pressRequest).toBe('Pedido')
    expect(adopted.status).toBe('in_progress')
  })

  it('não altera createdBy, responsável nem status na edição da captura', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const updated = useLocalDemandStore.getState().updateCapture(demand.id, {
      ...capture,
      subject: 'Assunto revisado',
      priority: 'critical',
      enrichment: { ...emptyEnrichment, tags: ['editada'], nextStep: 'Novo passo.' },
    })

    expect(updated?.status).toBe('in_progress')
    expect(updated?.createdBy).toEqual({ id: currentUser.id, name: currentUser.name })
    expect(updated?.responsibleId).toBe(currentUser.id)
    expect(updated?.subject).toBe('Assunto revisado')
    expect(updated?.enrichment.tags).toEqual(['editada'])
  })

  it('mantém o status em andamento após recusa, aprovação e encaminhamento', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const store = useLocalDemandStore.getState()
    store.savePositioning(demand.id, { body: 'Nota oficial da sessão.' })

    store.registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T12:00:00.000Z'),
      result: 'approved',
      participants: 'Coordenação',
      summary: 'Parecer liberado.',
    })
    store.registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T13:00:00.000Z'),
      result: 'declined',
      participants: 'Redação',
      summary: 'Sem espaço na edição.',
    })
    const updated = store.registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T14:00:00.000Z'),
      result: 'forwarded',
      participants: 'Jurídico',
      summary: 'Pedido de parecer.',
      nextStep: 'Aguardar retorno.',
    })

    expect(updated?.status).toBe('in_progress')
    expect(updated?.stateTransitions).toEqual([])
    expect(updated?.interactions.map((item) => item.result)).toEqual(['approved', 'declined', 'forwarded'])
    expect(updated?.positioning.state).toBe('approved')
  })

  it('salva versão do posicionamento e recusa aprovação sem texto', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    expect(() => useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T12:00:00.000Z'),
      result: 'approved',
      participants: 'Coordenação',
      summary: 'Parecer liberado.',
    })).toThrow(PositioningTextRequiredError)

    const saved = useLocalDemandStore.getState().savePositioning(demand.id, { body: '  Nota da sessão.  ' })
    expect(saved?.positioning.state).toBe('draft')
    expect(saved?.positioning.versions.at(-1)?.body).toBe('Nota da sessão.')
    expect(saved?.positioning.versions.at(-1)?.author).toBe(currentUser.name)

    const approved = useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-25T13:00:00.000Z'),
      result: 'approved',
      participants: 'Coordenação',
      summary: 'Liberado.',
    })
    expect(approved?.status).toBe('in_progress')
    expect(approved?.positioning.state).toBe('approved')
    expect(approved?.positioning.approval?.versionId).toBe(saved?.positioning.versions.at(-1)?.id)
    expect(approved?.interactions.at(-1)?.positioningVersionId).toBe(saved?.positioning.versions.at(-1)?.id)
  })

  it('marca o artefato como enviado ao registrar resposta enviada', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    useLocalDemandStore.getState().savePositioning(demand.id, { body: 'Nota oficial.' })
    const sent = useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-26T16:00:00.000Z'),
      result: 'response_sent',
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota oficial.',
    })
    expect(sent?.status).toBe('sent')
    expect(sent?.positioning.state).toBe('sent')
  })

  it('fecha o caso com resposta enviada e grava a transição', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const sent = useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-26T16:00:00.000Z'),
      result: 'response_sent',
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota enviada.',
    })

    expect(sent?.status).toBe('sent')
    expect(sent?.interactions.at(-1)).toEqual(expect.objectContaining({
      result: 'response_sent',
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota enviada.',
    }))
    expect(sent?.stateTransitions).toEqual([expect.objectContaining({
      from: 'in_progress',
      to: 'sent',
      trigger: 'response_sent',
      recordedBy: currentUser.name,
    })])
  })

  it('encerra sem envio com o motivo na interação', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const closed = useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-26T16:00:00.000Z'),
      result: 'closed_without_send',
      summary: 'Prazo expirou sem retorno da redação.',
    })

    expect(closed?.status).toBe('closed_without_send')
    expect(closed?.interactions.at(-1)?.summary).toBe('Prazo expirou sem retorno da redação.')
    expect(closed?.stateTransitions.at(-1)).toEqual(expect.objectContaining({
      to: 'closed_without_send',
      trigger: 'closed_without_send',
    }))
  })

  it('rejeita nova interação depois de enviado ou encerrado', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-26T16:00:00.000Z'),
      result: 'response_sent',
      channel: 'E-mail',
      recipient: 'redacao@exemplo.com',
      body: 'Nota enviada.',
    })

    expect(() => useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-26T17:00:00.000Z'),
      result: 'waiting_response',
    })).toThrow(DemandInteractionNotAllowedError)
    expect(useLocalDemandStore.getState().records[0]?.interactions).toHaveLength(1)
  })

  it('edita enriquecimento sem avançar etapa', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const updated = useLocalDemandStore.getState().updateEnrichment(demand.id, { tags: ['editada'], confirmedFacts: ['Fato revisado.'] })

    expect(updated?.status).toBe('in_progress')
    expect(updated?.enrichment).toEqual(expect.objectContaining({ tags: ['editada'], confirmedFacts: ['Fato revisado.'] }))
    expect(updated?.stateTransitions).toHaveLength(0)
  })

  it('corrige cadastro no histórico sem alterar status nem interações', () => {
    const source = mockDemand({
      id: 'mock-sent',
      code: 'REL-101',
      title: 'Resultados originais',
      requestSummary: 'Pedido original.',
      journalistId: 'j-carolina',
      journalistName: 'Carolina Montenegro',
      outletName: 'Valor Econômico',
      priority: 'medium',
      status: 'sent',
      interactions: [{
        id: 'int-1', occurredAt: new Date('2026-03-12T09:00:00.000Z'), type: null, result: 'response_sent',
        participants: null, summary: null, nextStep: null, channel: 'E-mail', recipient: 'redacao@valor.com',
        body: 'Posicionamento final.', origin: 'off_platform',
      }],
      stateTransitions: [{ id: 'st-1', from: 'in_progress', to: 'sent', occurredAt: new Date('2026-03-12T09:00:00.000Z'), recordedBy: 'Ana Paula', trigger: 'response_sent' }],
    })
    const adopted = useLocalDemandStore.getState().adopt(source)
    const updated = useLocalDemandStore.getState().updateCapture(adopted.id, {
      subject: 'Assunto corrigido no histórico',
      factContext: 'Contexto corrigido.',
      pressRequest: 'Pedido corrigido.',
      requestedDeadline: '2026-09-20',
      channel: 'WhatsApp',
      contactMode: 'known',
      contactName: 'Carolina Montenegro',
      contactOutlet: 'Valor Econômico',
      journalistId: 'j-carolina',
      journalistName: 'Carolina Montenegro',
      outletName: 'Valor Econômico',
      enrichment: { tags: ['histórico'], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
    })

    expect(updated).toEqual(expect.objectContaining({
      subject: 'Assunto corrigido no histórico',
      status: 'sent',
      responsibleId: 'r-ana',
      createdBy: null,
      interactions: source.interactions,
      stateTransitions: source.stateTransitions,
    }))
  })

  it('remove a demanda da sessão e impede que o mock reapareça', () => {
    const local = useLocalDemandStore.getState().add(capture)
    const source = mockDemand({ id: 'mock-remove', status: 'in_progress' })
    useLocalDemandStore.getState().adopt(source)
    useLocalDemandStore.getState().remove(local.id)
    useLocalDemandStore.getState().remove(source.id)

    expect(useLocalDemandStore.getState().isHidden(local.id)).toBe(true)
    expect(useLocalDemandStore.getState().isHidden(source.id)).toBe(true)
  })

  it('converte o contato local em vínculo de jornalista sem bloquear a captura', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    const linked = useLocalDemandStore.getState().linkJournalist(demand.id, {
      journalistId: 'j-local-1', journalistName: 'Contato convertido', outletName: 'Redação local',
    })

    expect(linked).toEqual(expect.objectContaining({ contactMode: 'known', journalistId: 'j-local-1' }))
  })

  it('registra e substitui o resultado da pauta após o fechamento', () => {
    const demand = useLocalDemandStore.getState().add(capture)
    useLocalDemandStore.getState().registerInteraction(demand.id, {
      occurredAt: new Date('2026-08-30T18:00:00.000Z'),
      result: 'closed_without_send',
      summary: 'Pedido perdeu a atualidade.',
    })

    const first = useLocalDemandStore.getState().registerOutcome(demand.id, {
      toneScore: 1,
      published: 'no',
      usageScore: 1,
      resultSummary: 'Redação não retornou.',
    })
    expect(first?.outcome).toEqual(expect.objectContaining({
      toneScore: 1,
      published: 'no',
      usageScore: 1,
      resultSummary: 'Redação não retornou.',
      recordedBy: currentUser.name,
    }))

    const second = useLocalDemandStore.getState().registerOutcome(demand.id, {
      toneScore: 5,
      published: 'yes',
      usageScore: 5,
      resultSummary: 'Veículo publicou com o recorte alinhado.',
    })
    expect(second?.outcome?.resultSummary).toBe('Veículo publicou com o recorte alinhado.')
    expect(second?.outcome?.toneScore).toBe(5)
  })
})
