import { describe, expect, it } from 'vitest'

import { demandService } from '@/application/composition'
import { buildDemandDetailViewModel, buildLocalDemandDetailViewModel } from './demand-detail.viewmodel'
import { useLocalDemandStore } from '../stores/local-demand.store'

describe('Demand detail presentation contract', () => {
  it('exposes the complete, attributed inventory for the canonical detail', async () => {
    const demand = await demandService.getById('d-regulacao')
    const viewModel = buildDemandDetailViewModel(demand!)

    expect(viewModel.identity).toEqual(expect.objectContaining({
      code: 'DEM-992-B',
      title: 'Impactos da nova regulamentação no setor',
      journalistName: 'Carolina Montenegro',
      outletName: 'Valor Econômico',
      priorityLabel: 'Alta',
      statusLabel: 'Em review',
      responsibleName: 'Ana Paula',
    }))
    expect(viewModel.requestSummary).toContain('nova regulamentação ambiental')
    expect(viewModel.interactions).toHaveLength(2)
    expect(viewModel.interactions.every((item) => item.originLabel === 'Fora da plataforma')).toBe(true)
    expect(viewModel.interactions.at(-1)?.resultLabel).toBe('Resolvido')
    expect(viewModel.decisions).toEqual([
      expect.objectContaining({
        consultedParty: 'Marina Sousa (Coordenação)',
        outcomeLabel: 'Ajustes solicitados',
      }),
    ])
    expect(viewModel.positioning).toEqual({ state: 'missing', label: 'Sem posicionamento final registrado' })
    expect(viewModel.currentState.latestRecordedNextStep).toBe('Consolidar dados com Sustentabilidade e preparar posicionamento.')
    expect(viewModel.currentState.latestInteractionResult).toBe('Resolvido')
    expect(viewModel.currentState.latestDecisionSummary).toContain('Detalhar a fonte dos indicadores')
    expect('attention' in viewModel.currentState).toBe(false)
    expect('recordedNextStep' in viewModel.currentState).toBe(false)
    expect(viewModel.lifecycle.createdAt.iso).toBe('2026-10-20T14:32:05.000Z')
    expect(viewModel.lifecycle.updatedAt.iso).toBe('2026-10-21T10:15:22.000Z')
    expect(viewModel.timeline.map((event) => event.kind)).toEqual([
      'request', 'interaction', 'interaction', 'decision', 'current',
    ])
    expect(viewModel.timeline.find((event) => event.id === 'int-5')?.title).toBe('Resolvido')
  })

  it('ordena interações pela ocorrência e usa o próximo passo mais recente', async () => {
    const demand = await demandService.getById('d-regulacao')
    demand!.interactions = [
      { ...demand!.interactions[0]!, id: 'newer', occurredAt: new Date('2026-10-23T12:00:00.000Z'), nextStep: 'Passo mais recente.' },
      { ...demand!.interactions[0]!, id: 'older', occurredAt: new Date('2026-10-19T12:00:00.000Z'), nextStep: 'Passo antigo.' },
    ]

    const viewModel = buildDemandDetailViewModel(demand!)

    expect(viewModel.interactions.map((item) => item.id)).toEqual(['older', 'newer'])
    expect(viewModel.currentState.latestRecordedNextStep).toBe('Passo mais recente.')
    expect(viewModel.timeline.map((event) => event.iso)).toEqual(
      [...viewModel.timeline.map((event) => event.iso)].sort(),
    )
  })

  it('atribui a interação ao autor do registro e mantém participantes externos separados', async () => {
    const demand = await demandService.getById('d-regulacao')
    demand!.interactions = [{
      ...demand!.interactions[0]!,
      id: 'authored-interaction',
      recordedBy: 'Noel Ferreira',
      participants: 'Maria Clara; Redação',
    }]

    const event = buildDemandDetailViewModel(demand!).timeline.find((item) => item.id === 'authored-interaction')

    expect(event).toEqual(expect.objectContaining({
      actor: 'Noel Ferreira',
      participants: 'Maria Clara; Redação',
      attribution: 'Fora da plataforma · Participantes: Maria Clara; Redação',
    }))
  })

  it('apresenta interação Resolvido sem tipo ou textos e preserva o último próximo passo preenchido', async () => {
    const demand = await demandService.getById('d-regulacao')
    demand!.interactions = [
      { ...demand!.interactions[0]!, id: 'with-step', occurredAt: new Date('2026-10-22T12:00:00.000Z'), nextStep: 'Aguardar publicação.' },
      {
        id: 'resolved-minimal',
        occurredAt: new Date('2026-10-23T12:00:00.000Z'),
        result: 'resolved',
        type: null,
        participants: null,
        summary: null,
        nextStep: null,
        origin: 'off_platform',
      },
    ]

    const viewModel = buildDemandDetailViewModel(demand!)
    const event = viewModel.timeline.find((item) => item.id === 'resolved-minimal')

    expect(event).toEqual(expect.objectContaining({
      title: 'Resolvido',
      actor: 'Autoria não informada',
      description: null,
      nextStep: null,
    }))
    expect(viewModel.currentState.latestInteractionResult).toBe('Resolvido')
    expect(viewModel.currentState.latestRecordedNextStep).toBe('Aguardar publicação.')
  })

  it('expõe enriquecimento, ações válidas e artefatos com autoria no histórico local', () => {
    useLocalDemandStore.getState().reset()
    const record = useLocalDemandStore.getState().add({
      subject: 'Caso urgente sem jornalista', factContext: 'Fato em apuração.', pressRequest: 'Nota até 18h',
      requestedDeadline: '2026-08-28', channel: 'Telefone', contactMode: 'local', contactName: 'Plantão',
      contactOutlet: 'Redação', journalistId: '', journalistName: 'Plantão', outletName: 'Redação',
    })
    useLocalDemandStore.getState().enrich(record.id, {
      tags: ['urgente'], topics: ['Operação'], relatedAreas: ['Jurídico'], confirmedFacts: ['Ocorrência confirmada'],
      pendingFacts: ['Aguardar laudo'], responsibleId: 'r-noel', responsibleName: 'Noel Ferreira', priority: 'critical', nextStep: 'Solicitar laudo.',
    })
    useLocalDemandStore.getState().requestReview(record.id, { reviewer: 'Coordenação', requestedBy: 'Noel Ferreira', versionLabel: 'v1' })
    const current = useLocalDemandStore.getState().records[0]!

    const view = buildLocalDemandDetailViewModel(current)

    expect(view.enrichment).toEqual(expect.objectContaining({ tags: ['urgente'], confirmedFacts: ['Ocorrência confirmada'], pendingFacts: ['Aguardar laudo'] }))
    expect(view.validNextActions).toEqual(['register_interaction', 'record_decision'])
    expect(view.timeline).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'review', actor: 'Noel Ferreira', title: 'Review solicitado · v1' })]))
    expect(view.timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'state_change', title: 'Em andamento', actor: 'Noel Ferreira' }),
      expect.objectContaining({ kind: 'state_change', title: 'Em review', actor: 'Noel Ferreira' }),
    ]))
    expect(view.identity.statusLabel).toBe('Em review')
  })
})
