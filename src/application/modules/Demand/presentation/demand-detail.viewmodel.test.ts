import { describe, expect, it } from 'vitest'

import { demandService } from '@/application/composition'
import { buildDemandDetailViewModel, buildLocalDemandDetailViewModel } from './demand-detail.viewmodel'
import { useLocalDemandStore } from '../stores/local-demand.store'

describe('Demand detail presentation contract', () => {
  it('expõe o inventário atribuído do detalhe canônico via interações', async () => {
    const demand = await demandService.getById('d-regulacao')
    const viewModel = buildDemandDetailViewModel(demand!)

    expect(viewModel.identity).toEqual(expect.objectContaining({
      code: 'DEM-992-B',
      title: 'Impactos da nova regulamentação no setor',
      journalistName: 'Carolina Montenegro',
      outletName: 'Valor Econômico',
      priorityLabel: 'Alta',
      statusLabel: 'Em andamento',
      responsibleName: 'Ana Paula',
    }))
    expect(viewModel.requestSummary).toContain('nova regulamentação ambiental')
    expect(viewModel.factContext).toBeFalsy()
    expect(viewModel.timeline.find((event) => event.kind === 'request')).toEqual(expect.objectContaining({
      title: 'Demanda registrada',
      description: null,
    }))
    expect(viewModel.identity.deadline.shortDate).toMatch(/^\d{2}\/\d{2}\/\d{2}$/)
    expect(viewModel.interactions).toHaveLength(3)
    expect(viewModel.interactions.every((item) => item.originLabel === 'Fora da plataforma')).toBe(true)
    expect(viewModel.interactions.at(-1)?.resultLabel).toBe('Faltou informação ou ajustes')
    expect(viewModel.currentState.latestRecordedNextStep).toBe('Atualizar o material com a fonte e a ressalva regulatória.')
    expect(viewModel.currentState.latestInteractionResult).toBe('Faltou informação ou ajustes')
    expect(viewModel.timeline[0]?.kind).toBe('current')
    expect(viewModel.timeline.map((event) => event.kind).slice(0, 3)).toEqual([
      'current', 'positioning_version', 'interaction',
    ])
    expect(viewModel.timeline.filter((event) => event.kind === 'positioning_version')).toHaveLength(1)
    expect(viewModel.timeline.filter((event) => event.kind === 'interaction')).toHaveLength(3)
    expect(viewModel.timeline.find((event) => event.id === 'int-5')?.title).toBe('Aguardando retorno')
    expect(viewModel.positioning).toEqual(expect.objectContaining({
      state: 'draft',
      stateLabel: 'Rascunho',
      isEmpty: false,
      writeLabel: 'Atualizar posicionamento',
      primaryAction: 'register_interaction',
    }))
    expect(viewModel.timeline.some((event) => event.kind === 'positioning_version' && event.title === 'Versão salva')).toBe(true)
    expect(viewModel.timeline.find((event) => event.id === 'int-regulacao-ajustes')).toEqual(expect.objectContaining({
      title: 'Faltou informação ou ajustes',
      actor: 'Ana Paula',
      participants: 'Marina Sousa (Coordenação)',
    }))
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
    expect(viewModel.timeline[0]).toEqual(expect.objectContaining({ kind: 'current', isCurrent: true }))
    const rest = viewModel.timeline.slice(1)
    expect(rest.map((event) => event.iso)).toEqual([...rest.map((event) => event.iso)].sort().reverse())
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

  it('apresenta interação sem próximo passo e preserva o último próximo passo preenchido', async () => {
    const demand = await demandService.getById('d-regulacao')
    demand!.interactions = [
      { ...demand!.interactions[0]!, id: 'with-step', occurredAt: new Date('2026-10-22T12:00:00.000Z'), nextStep: 'Aguardar publicação.' },
      {
        id: 'waiting-minimal',
        occurredAt: new Date('2026-10-23T12:00:00.000Z'),
        result: 'waiting_response',
        type: null,
        participants: null,
        summary: null,
        nextStep: null,
        channel: null,
        recipient: null,
        body: null,
        origin: 'off_platform',
      },
    ]

    const viewModel = buildDemandDetailViewModel(demand!)
    const event = viewModel.timeline.find((item) => item.id === 'waiting-minimal')

    expect(event).toEqual(expect.objectContaining({
      title: 'Aguardando retorno',
      actor: 'Autoria não informada',
      description: null,
      nextStep: null,
    }))
    expect(viewModel.currentState.latestInteractionResult).toBe('Aguardando retorno')
    expect(viewModel.currentState.latestRecordedNextStep).toBe('Aguardar publicação.')
  })

  it('expõe enriquecimento, ações válidas e captura no histórico local', () => {
    useLocalDemandStore.getState().reset()
    const record = useLocalDemandStore.getState().add({
      subject: 'Caso urgente sem jornalista', factContext: 'Fato em apuração.', pressRequest: 'Nota até 18h',
      requestedDeadline: '2026-08-28', channel: 'Telefone', contactMode: 'local', contactName: 'Plantão',
      contactOutlet: 'Redação', journalistId: '', journalistName: 'Plantão', outletName: 'Redação',
      priority: 'critical',
      enrichment: { tags: ['urgente'], topics: ['Operação'], relatedAreas: ['Jurídico'], confirmedFacts: ['Ocorrência confirmada'], pendingFacts: ['Aguardar laudo'], nextStep: 'Solicitar laudo.' },
    })

    const view = buildLocalDemandDetailViewModel(record)

    expect(view.enrichment).toEqual(expect.objectContaining({ tags: ['urgente'], confirmedFacts: ['Ocorrência confirmada'], pendingFacts: ['Aguardar laudo'] }))
    expect(view.timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'enrichment',
        title: 'Apuração registrada',
        description: expect.stringContaining('Ocorrência confirmada'),
        nextStep: 'Solicitar laudo.',
      }),
    ]))
    expect(view.validNextActions).toEqual(['write_positioning', 'register_interaction'])
    expect(view.canWritePositioning).toBe(true)
    expect(view.canRegisterInteraction).toBe(true)
    expect(view.positioning.isEmpty).toBe(true)
    expect(view.positioning.primaryAction).toBe('write_positioning')
    expect(view.identity.statusLabel).toBe('Em andamento')
    expect(view.factContext).toBe('Fato em apuração.')
    expect(view.requestSummary).toBe('Nota até 18h')
    expect(view.timeline.find((event) => event.kind === 'request')?.title).toBe('Demanda registrada')
  })

  it('expõe pedido e fato separados nos três cenários de interação fora da plataforma', async () => {
    const coletiva = buildDemandDetailViewModel((await demandService.getById('d-coletiva-prazo'))!)
    const juridico = buildDemandDetailViewModel((await demandService.getById('d-juridico-frase'))!)
    const adiada = buildDemandDetailViewModel((await demandService.getById('d-entrevista-adiada'))!)

    expect(coletiva.identity.statusLabel).toBe('Em andamento')
    expect(coletiva.identity.journalistName).toBe('Maria Clara')
    expect(coletiva.identity.responsibleName).toBe('Ana Paula')
    expect(coletiva.factContext.length).toBeGreaterThan(80)
    expect(coletiva.requestSummary.length).toBeGreaterThan(80)
    expect(coletiva.factContext).not.toBe(coletiva.requestSummary)
    expect(coletiva.validNextActions).toEqual(['write_positioning', 'register_interaction'])
    expect(coletiva.interactions[0]).toEqual(expect.objectContaining({
      typeLabel: 'Telefonema',
      originLabel: 'Fora da plataforma',
    }))

    expect(juridico.identity.statusLabel).toBe('Em andamento')
    expect(juridico.identity.journalistName).toBe('Carolina Montenegro')
    expect(juridico.validNextActions).toEqual(['write_positioning', 'register_interaction'])
    expect(juridico.interactions.some((item) => item.typeLabel === 'Consulta jurídica')).toBe(true)
    expect(juridico.timeline.filter((event) => event.kind === 'interaction').every((event) => event.attribution.startsWith('Fora da plataforma'))).toBe(true)

    expect(adiada.identity.statusLabel).toBe('Em andamento')
    expect(adiada.interactions.some((item) => item.resultLabel === 'Aprovado')).toBe(true)
    expect(adiada.validNextActions).toEqual(['write_positioning', 'register_interaction'])
    expect(adiada.positioning.state).toBe('approved')
    expect(adiada.positioning.body).toContain('fala já liberada')
    expect(adiada.interactions[0]?.originLabel).toBe('Fora da plataforma')
  })
})
