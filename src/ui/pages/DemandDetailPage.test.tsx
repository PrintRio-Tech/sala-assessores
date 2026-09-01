import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { DemandDetailPage } from './DemandDetailPage'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'

function renderDemandDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/demandas/d-regulacao']}>
        <Routes>
          <Route path="/demandas/:demandId" element={<DemandDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderLocalDemandDetail(contact = {
  name: 'Contato não identificado',
  outlet: 'Fonte não identificada',
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const local = useLocalDemandStore.getState().add({
    subject: 'Acidente na operação — TV Globo',
    factContext: 'A equipe ainda apura as circunstâncias.',
    pressRequest: 'A TV Globo pediu posicionamento.',
    requestedDeadline: 'Hoje, 18h',
    channel: 'Telefone',
    contactMode: 'local',
    contactName: contact.name,
    contactOutlet: contact.outlet,
    journalistId: 'unidentified',
    journalistName: contact.name,
    outletName: contact.outlet,
  })
  return { local, view: render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/demandas/${local.id}`]}>
        <Routes><Route path="/demandas/:demandId" element={<DemandDetailPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  ) }
}

afterEach(() => useLocalDemandStore.getState().reset())

describe('detalhe canônico da demanda', () => {
  it('promove o histórico como espinha dorsal com rail contextual', async () => {
    renderDemandDetail()

    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByRole('heading', { name: 'Histórico da demanda' })).toBeVisible()
    expect(within(page).getByRole('heading', { name: 'Estado atual' })).toBeVisible()
    expect(within(page).getByText('Ordem cronológica')).toBeVisible()
    expect(within(page).queryByText(/Variante A/)).not.toBeInTheDocument()
  })

  it('mantém estado atual, última decisão e posicionamento como fatos distintos', async () => {
    renderDemandDetail()

    const page = await screen.findByTestId('demand-detail')
    const decisionEvent = within(page).getByRole('heading', { name: 'Ajustes solicitados' }).closest('article')
    const currentEvent = within(page).getByRole('heading', { name: 'Em review' }).closest('article')

    expect(within(page).getAllByText('Em review').length).toBeGreaterThan(0)
    expect(within(page).getAllByText('Ajustes solicitados').length).toBeGreaterThan(0)
    expect(decisionEvent).not.toBeNull()
    expect(within(decisionEvent!).getByText('Marina Sousa (Coordenação)')).toBeVisible()
    expect(within(decisionEvent!).getByText('Decisão atribuída e registrada')).toBeVisible()
    expect(within(decisionEvent!).getByText('21 de out. de 2026')).toBeVisible()
    expect(currentEvent).not.toBeNull()
    expect(within(currentEvent!).getByText('Estado atual · última atualização do registro · responsável atribuído')).toBeVisible()
    expect(within(page).getByText('Sem posicionamento final registrado')).toBeVisible()
    expect(within(page).getByText('Artefato final ainda não registrado nesta demanda.')).toBeVisible()
  })

  it('identifica interações externas e preserva as ações sem inferir disponibilidade', async () => {
    renderDemandDetail()

    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getAllByText(/Fora da plataforma/)).toHaveLength(2)
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(page).queryByRole('button', { name: 'Solicitar review' })).not.toBeInTheDocument()
    expect(within(page).getAllByText('Consolidar dados com Sustentabilidade e preparar posicionamento.').length).toBeGreaterThan(0)
  })

  it('registra interações sem sair da demanda e atualiza timeline e próximo passo', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })

    expect(within(drawer).getByText('Fora da plataforma')).toBeVisible()
    const dateInput = within(drawer).getByRole('textbox', { name: 'Data' }) as HTMLInputElement
    const timeInput = within(drawer).getByRole('textbox', { name: 'Hora' }) as HTMLInputElement
    expect(dateInput.value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/)

    await user.clear(dateInput)
    await user.type(dateInput, '26082026')
    await user.clear(timeInput)
    await user.type(timeInput, '1435')

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    for (const option of ['Aguardando retorno', 'Faltou informação', 'Recusado', 'Resolvido', 'Encaminhado', 'Outro']) {
      expect(await screen.findByRole('option', { name: option })).toBeVisible()
    }
    await user.click(await screen.findByRole('option', { name: 'Faltou informação' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Tipo de interação' }))
    await user.click(await screen.findByRole('option', { name: 'Consulta jurídica' }))
    await user.type(within(drawer).getByLabelText('Com quem/qual área?'), 'Jurídico e Ana')
    await user.type(within(drawer).getByLabelText('O que faltou?'), 'Jurídico confirmou a informação.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Enviar minuta revisada.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect((await within(page).findAllByRole('heading', { name: 'Consulta jurídica · Faltou informação' })).length).toBeGreaterThan(0)
    expect(within(page).getByText('Último resultado da interação')).toBeVisible()
    const savedSummary = within(page).getByText('Jurídico confirmou a informação.')
    expect(savedSummary).toBeVisible()
    expect(savedSummary.closest('article')?.querySelector('time')).toHaveAttribute(
      'datetime',
      new Date(2026, 7, 26, 14, 35).toISOString(),
    )
    expect(within(page).getAllByText('Enviar minuta revisada.').length).toBeGreaterThan(0)
    expect(screen.queryByRole('dialog', { name: 'Registrar interação' })).not.toBeInTheDocument()
  })

  it('salva e prepara outra captura sem carregar campos condicionais irrelevantes', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    const dateInput = within(drawer).getByRole('textbox', { name: 'Data' })
    const timeInput = within(drawer).getByRole('textbox', { name: 'Hora' })
    await user.clear(dateInput)
    await user.type(dateInput, '01012020')
    await user.clear(timeInput)
    await user.type(timeInput, '0815')
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encaminhado' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Tipo de interação' }))
    await user.click(await screen.findByRole('option', { name: 'Reunião' }))
    await user.type(within(drawer).getByLabelText('Para quem/qual área?'), 'Coordenação e Jurídico')
    await user.type(within(drawer).getByLabelText('O que foi encaminhado?'), 'Reunião concluída.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Consolidar parecer.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar e registrar outra' }))

    expect(await within(page).findByText('Reunião concluída.')).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Resultado da interação' })).toHaveTextContent('Selecione o resultado')
    expect(within(drawer).getByRole('combobox', { name: 'Resultado da interação' })).toHaveFocus()
    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de interação' })).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Para quem/qual área?')).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('O que foi encaminhado?')).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Próximo passo')).not.toBeInTheDocument()
    expect(within(drawer).getByRole('textbox', { name: 'Data' })).not.toHaveValue('01/01/2020')
    expect(within(drawer).getByRole('textbox', { name: 'Hora' })).not.toHaveValue('08:15')
  })

  it('valida separadamente ausência e formatos inválidos de data e hora', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aguardando retorno' }))
    const dateInput = within(drawer).getByRole('textbox', { name: 'Data' })
    const timeInput = within(drawer).getByRole('textbox', { name: 'Hora' })
    await user.clear(dateInput)
    await user.clear(timeInput)
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect(within(drawer).getByText('Informe a data.')).toBeVisible()
    expect(within(drawer).getByText('Informe o horário.')).toBeVisible()
    expect(dateInput).toHaveFocus()

    await user.type(dateInput, '31022026')
    await user.type(timeInput, '2560')
    expect(within(drawer).getByText('Use o formato dd/mm/aaaa.')).toBeVisible()
    expect(within(drawer).getByText('Use o formato 00:00.')).toBeVisible()
  })

  it('exige um resultado explícito para registrar a interação', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de interação' })).not.toBeInTheDocument()
    const result = within(drawer).getByRole('combobox', { name: 'Resultado da interação' })
    const date = within(drawer).getByRole('textbox', { name: 'Data' })
    expect(result.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect(within(drawer).getByText('Informe o resultado da interação.')).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Resultado da interação' })).toHaveFocus()
  })

  it('troca resultado, aplica labels contextuais e limpa somente campos que deixam de se aplicar', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encaminhado' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Tipo de interação' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.type(within(drawer).getByLabelText('Para quem/qual área?'), 'Jurídico')
    await user.type(within(drawer).getByLabelText('O que foi encaminhado?'), 'Minuta para análise.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Aguardar parecer.')

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Resolvido' }))

    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de interação' })).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Para quem/qual área?')).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Próximo passo')).not.toBeInTheDocument()
    expect(within(drawer).getByLabelText('Observação')).toHaveValue('Minuta para análise.')

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encaminhado' }))
    expect(within(drawer).getByLabelText('Para quem/qual área?')).toHaveValue('')
    expect(within(drawer).getByLabelText('O que foi encaminhado?')).toHaveValue('Minuta para análise.')
    expect(within(drawer).getByLabelText('Próximo passo')).toHaveValue('')
  })

  it('foca o primeiro campo condicional inválido quando a matriz o exige', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Outro' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect(within(drawer).getByText('Informe o tipo de interação.')).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Tipo de interação' })).toHaveFocus()
  })

  it('registra Resolvido de forma enxuta e omite partes vazias na timeline', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Resolvido' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    const event = (await within(page).findAllByRole('heading', { name: 'Resolvido' }))
      .map((heading) => heading.closest('article'))
      .find((article) => article && within(article).queryByRole('paragraph') === null)
    expect(event).not.toBeNull()
    expect(within(event!).queryByText('Próximo passo registrado')).not.toBeInTheDocument()
    expect(within(event!).queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('registra interação também na demanda capturada localmente sem habilitar review', async () => {
    const user = userEvent.setup()
    const { view } = renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByRole('heading', { name: 'Acidente na operação — TV Globo' })).toBeVisible()
    expect(within(page).getAllByText('Rascunho').length).toBeGreaterThan(0)
    expect(within(page).getByRole('button', { name: 'Enriquecer demanda' })).toBeVisible()
    expect(within(page).queryByRole('button', { name: 'Solicitar review' })).not.toBeInTheDocument()
    await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aguardando retorno' }))
    await user.type(within(drawer).getByLabelText('Participantes ou área'), 'Contato local e Ana')
    await user.type(within(drawer).getByLabelText('Observação'), 'Prazo confirmado por telefone.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Preparar retorno.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect(await within(page).findByText('Prazo confirmado por telefone.')).toBeVisible()
    expect(within(page).getAllByText('Preparar retorno.').length).toBeGreaterThan(0)
    expect(within(page).getByText(/Fora da plataforma/)).toBeVisible()
    expect(within(page).queryByText('Prioridade Ainda não definida')).not.toBeInTheDocument()
    expect(within(page).queryByText(/Responsável será definido/)).not.toBeInTheDocument()
    expect(within(page).getByRole('heading', { name: 'Enriquecimento' })).toBeVisible()
    expect(within(page).getByRole('heading', { name: 'Operação' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Enriquecer / converter em jornalista' })).toBeVisible()

    view.unmount()
  })

  it('abre a conversão do contato local com nome e veículo preenchidos e editáveis', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail({ name: 'Marina Lima', outlet: 'TV Globo' })
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Enriquecer / converter em jornalista' }))
    const drawer = await screen.findByRole('dialog', { name: 'Novo jornalista' })
    const name = within(drawer).getByRole('textbox', { name: 'Nome completo' })
    const outlet = within(drawer).getByRole('textbox', { name: 'Veículo ou redação' })

    expect(name).toHaveValue('Marina Lima')
    expect(outlet).toHaveValue('TV Globo')

    await user.clear(name)
    await user.type(name, 'Marina de Lima')
    await user.clear(outlet)
    await user.type(outlet, 'GloboNews')
    expect(name).toHaveValue('Marina de Lima')
    expect(outlet).toHaveValue('GloboNews')
  })

  it('avança visualmente do enriquecimento para review com CTA contextual e autoria local', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Enriquecer demanda' }))
    const enrichment = await screen.findByRole('dialog', { name: 'Enriquecer demanda' })
    await user.type(within(enrichment).getByRole('textbox', { name: 'Tags' }), 'urgente, operação')
    await user.type(within(enrichment).getByRole('textbox', { name: 'Tema' }), 'Operação')
    await user.type(within(enrichment).getByRole('textbox', { name: 'Fatos confirmados' }), 'Ocorrência confirmada.')
    await user.type(within(enrichment).getByRole('textbox', { name: 'Pendências' }), 'Aguardar laudo.')
    await user.type(within(enrichment).getByRole('textbox', { name: 'Próximo passo' }), 'Validar com Operações.')
    await user.click(within(enrichment).getByRole('button', { name: 'Salvar enriquecimento' }))

    expect(await within(page).findByRole('button', { name: 'Solicitar review' })).toBeVisible()
    expect(within(page).getByText('urgente')).toBeVisible()
    expect(within(page).getByText('Ocorrência confirmada.')).toBeVisible()
    await user.click(within(page).getByRole('button', { name: 'Solicitar review' }))
    const review = await screen.findByRole('dialog', { name: 'Solicitar review' })
    await user.click(within(review).getByRole('combobox', { name: 'Revisor' }))
    await user.click(await screen.findByRole('option', { name: 'Coordenação' }))
    await user.type(within(review).getByRole('textbox', { name: 'Versão para review' }), 'v1')
    await user.click(within(review).getByRole('button', { name: 'Solicitar review' }))

    expect(await within(page).findByRole('button', { name: 'Registrar decisão' })).toBeVisible()
    const reviewEvent = within(page).getByRole('heading', { name: 'Review solicitado · v1' }).closest('article')
    expect(within(reviewEvent!).getByText('Noel Ferreira')).toBeVisible()
  })

  it('trata nova versão como artefato próprio antes de permitir novo review', async () => {
    const user = userEvent.setup()
    const { local } = renderLocalDemandDetail()
    act(() => {
      const store = useLocalDemandStore.getState()
      store.enrich(local.id, { responsibleId: 'r-noel', responsibleName: 'Noel Ferreira', priority: 'high', nextStep: 'Preparar versão.' })
      store.requestReview(local.id, { reviewer: 'Coordenação', requestedBy: 'Noel Ferreira', versionLabel: 'v1' })
      store.recordDecision(local.id, { outcome: 'changes_requested', rationale: 'Detalhar a fonte.', decidedBy: 'Coordenação', decidedAt: new Date('2026-08-28T14:00:00.000Z') })
    })
    const page = await screen.findByTestId('demand-detail')
    expect(await within(page).findByRole('button', { name: 'Nova versão' })).toBeVisible()

    await user.click(within(page).getByRole('button', { name: 'Nova versão' }))
    const drawer = await screen.findByRole('dialog', { name: 'Nova versão' })
    await user.type(within(drawer).getByRole('textbox', { name: 'Identificação da versão' }), 'v2')
    await user.type(within(drawer).getByRole('textbox', { name: 'Data da versão' }), '28082026')
    await user.type(within(drawer).getByRole('textbox', { name: 'Conteúdo da nova versão' }), 'Versão revisada com a fonte detalhada.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar nova versão' }))

    expect(await within(page).findByRole('button', { name: 'Solicitar review' })).toBeVisible()
    const artifact = within(page).getByRole('heading', { name: 'Nova versão · v2' }).closest('article')
    expect(within(artifact!).getByText('Noel Ferreira')).toBeVisible()
    expect(within(artifact!).getByText('Artefato registrado · conteúdo versionado')).toBeVisible()
  })

  it('abre a conversão do contato local com nome e redação preenchidos e editáveis', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')
    await user.click(within(page).getByRole('button', { name: 'Enriquecer / converter em jornalista' }))

    const drawer = await screen.findByRole('dialog', { name: 'Novo jornalista' })
    const name = within(drawer).getByRole('textbox', { name: 'Nome completo' })
    const outlet = within(drawer).getByRole('textbox', { name: 'Veículo ou redação' })
    expect(name).toHaveValue('Contato não identificado')
    expect(outlet).toHaveValue('Fonte não identificada')
    await user.clear(name)
    await user.type(name, 'Marina Lima')
    expect(name).toHaveValue('Marina Lima')
  })
})
