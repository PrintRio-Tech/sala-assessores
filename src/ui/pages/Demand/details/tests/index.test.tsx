import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { DemandDetailPage } from '..'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import type { DemandStatus } from '@/application/modules/Demand/stores/local-demand.store'

function renderDemandDetail(demandId = 'd-regulacao') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/demandas/${demandId}`]}>
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
}, status: DemandStatus = 'in_progress') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
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
  useLocalDemandStore.setState((state) => ({
    records: state.records.map((record) => record.id === local.id ? { ...record, status } : record),
  }))
  return { local, view: render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/demandas/${local.id}`]}>
        <Routes>
          <Route path="/demandas/:demandId" element={<DemandDetailPage />} />
          <Route path="/demandas" element={<div data-testid="demand-list-route">Lista de demandas</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  ) }
}

async function openDetailActions(user: ReturnType<typeof userEvent.setup>, page: HTMLElement) {
  await user.click(within(page).getByRole('button', { name: 'Editar' }))
}

async function openInteraction(user: ReturnType<typeof userEvent.setup>, page: HTMLElement) {
  await user.click(within(page).getByRole('button', { name: 'Registrar interação' }))
  await screen.findByRole('dialog', { name: 'Registrar interação' })
}

afterEach(() => useLocalDemandStore.getState().reset())

describe('detalhe canônico da demanda', () => {
  it('mostra toolbar acima do título com voltar e ações visíveis, sem menu ⋮', async () => {
    renderDemandDetail('d-ceo')

    const page = await screen.findByTestId('demand-detail')
    const header = within(page).getByRole('banner')
    const back = within(header).getByRole('link', { name: 'Voltar para demandas' })
    const title = within(header).getByRole('heading', { level: 1, name: 'Entrevista exclusiva: CEO TechCorp' })
    const actions = within(header).getByRole('group', { name: 'Ações da demanda' })

    expect(back).toHaveAttribute('href', '/demandas')
    expect(back.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(actions.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(header).queryByRole('button', { name: 'Ações da demanda' })).not.toBeInTheDocument()
    expect(within(actions).queryByRole('button', { name: 'Escrever posicionamento' })).not.toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: 'Registrar interação' })).toHaveTextContent('Registrar interação')
    const interact = within(actions).getByRole('button', { name: 'Registrar interação' })
    const edit = within(actions).getByRole('button', { name: 'Editar' })
    const remove = within(actions).getByRole('button', { name: 'Excluir' })
    expect(within(header).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(interact.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(edit.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(edit).toHaveAttribute('aria-label', 'Editar')
    expect(remove).toHaveAttribute('aria-label', 'Excluir')
    expect(edit).not.toHaveTextContent('Editar')
    expect(remove).not.toHaveTextContent('Excluir')
    expect(within(header).queryByText(/Demanda ·/)).not.toBeInTheDocument()
    expect(within(header).queryByText('Status')).not.toBeInTheDocument()
    expect(within(header).queryByText('Prazo')).not.toBeInTheDocument()
    expect(within(header).queryByText(/Maria Clara/)).not.toBeInTheDocument()
    expect(within(header).queryByText(/TechNews/)).not.toBeInTheDocument()
    expect(within(header).queryByText(/20:00/)).not.toBeInTheDocument()
    expect(within(header).getByText('TEC-889')).toBeVisible()
    expect(within(header).getByText('Em andamento')).toBeVisible()
  })

  it('empilha info rápida à esquerda e textos longos em cards acima do histórico', async () => {
    renderDemandDetail('d-ceo')

    const page = await screen.findByTestId('demand-detail')
    const rail = within(page).getByTestId('demand-summary-rail')
    const caseCard = within(rail).getByTestId('demand-case-card')
    const classCard = within(rail).getByTestId('demand-classification-card')
    const pedido = within(page).getByTestId('demand-press-request')
    const fato = within(page).getByTestId('demand-fact-context')
    const positioning = within(page).getByTestId('demand-positioning')
    const history = within(page).getByRole('heading', { level: 2, name: 'Histórico' })
    const contato = within(caseCard).getByTestId('stacked-contato')
    const prazo = within(caseCard).getByTestId('stacked-prazo')

    expect(within(page).queryByTestId('demand-quick-info')).not.toBeInTheDocument()
    expect(within(rail).queryByTestId('demand-summary-card')).not.toBeInTheDocument()
    expect(within(contato).getByText('Contato')).toBeVisible()
    expect(within(contato).queryByRole('link', { name: 'Maria Clara' })).not.toBeInTheDocument()
    expect(within(contato).getByText('Maria Clara')).toBeVisible()
    expect(within(contato).getByText('Contato').compareDocumentPosition(within(contato).getByText('Maria Clara')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(caseCard).getByText('TechNews')).toBeVisible()
    expect(within(caseCard).getByText('Ana Paula').textContent).toBe('Ana Paula')
    expect(within(prazo).getByText('11/08/26')).toBeVisible()
    expect(within(prazo).queryByText(/20:00/)).not.toBeInTheDocument()
    expect(within(caseCard).queryByText(/de ago/)).not.toBeInTheDocument()
    expect(within(classCard).getByRole('heading', { level: 2, name: 'Classificação' })).toBeVisible()
    expect(within(rail).queryByText(/expansão internacional/)).not.toBeInTheDocument()
    expect(within(pedido).getByRole('heading', { level: 2, name: 'Pedido da imprensa' })).toBeVisible()
    expect(within(pedido).getByText(/expansão internacional/)).toBeVisible()
    expect(within(fato).getByRole('heading', { level: 2, name: 'O que aconteceu' })).toBeVisible()
    const pedidoTitle = within(pedido).getByRole('heading', { level: 2, name: 'Pedido da imprensa' })
    expect(pedidoTitle.className).toMatch(/sm/)
    expect(history.className).toMatch(/sm/)
    expect(getComputedStyle(pedidoTitle).fontSize).not.toBe('32px')
    expect(getComputedStyle(pedidoTitle).fontSize).not.toBe('2rem')
    expect(within(page).queryByRole('heading', { name: 'Histórico da demanda' })).not.toBeInTheDocument()
    expect(within(page).queryByText('Linha do tempo')).not.toBeInTheDocument()
    expect(within(page).queryByText('Ordem cronológica')).not.toBeInTheDocument()
    expect(rail.compareDocumentPosition(positioning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(positioning.compareDocumentPosition(pedido) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pedido.compareDocumentPosition(fato) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(fato.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(page).queryByRole('heading', { name: 'Pedido original' })).not.toBeInTheDocument()
    expect(within(page).getByRole('heading', { name: 'Demanda registrada' })).toBeVisible()
    const historyEvents = within(history.closest('div')!.parentElement!).getAllByRole('article')
    expect(within(historyEvents[0]!).getByRole('heading', { name: 'Em andamento' })).toBeVisible()
    expect(historyEvents[0]!.className).toMatch(/current/)
    expect(within(historyEvents.at(-1)!).getByRole('heading', { name: 'Demanda registrada' })).toBeVisible()
    expect(within(page).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Ações da demanda' })).not.toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Excluir' })).toBeVisible()
  })

  it('mantém parecer e estado no histórico como eventos de interação', async () => {
    renderDemandDetail()

    const page = await screen.findByTestId('demand-detail')
    const adjustmentEvent = within(page).getByRole('heading', { name: 'Faltou informação ou ajustes' }).closest('article')
    const currentEvent = within(page).getByRole('heading', { name: 'Em andamento' }).closest('article')

    expect(within(page).getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(adjustmentEvent).not.toBeNull()
    expect(within(adjustmentEvent!).getByText(/Marina Sousa \(Coordenação\)/)).toBeVisible()
    expect(within(adjustmentEvent!).getByText(/Detalhar a fonte dos indicadores/)).toBeVisible()
    expect(currentEvent).not.toBeNull()
    expect(within(currentEvent!).getByText('Estado atual · última atualização do registro · responsável atribuído')).toBeVisible()
    expect(within(page).getByTestId('demand-positioning')).toBeVisible()
    expect(within(page).getByRole('heading', { name: 'Posicionamento' })).toBeVisible()
    expect(within(page).queryByText('Sem posicionamento final registrado')).not.toBeInTheDocument()
  })

  it('mostra apuração capturada sem accordion ornamental', async () => {
    const { local } = renderLocalDemandDetail()
    act(() => {
      useLocalDemandStore.getState().updateEnrichment(local.id, {
        tags: ['transparência'],
        topics: ['Governança'],
        relatedAreas: ['Sustentabilidade'],
        confirmedFacts: ['Indicador confirmado.'],
      })
    })
    const page = await screen.findByTestId('demand-detail')

    const rail = within(page).getByTestId('demand-summary-rail')
    const investigation = within(page).getByTestId('demand-investigation')
    expect(within(page).queryByTestId('demand-quick-info')).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: /Apuração e classificação/ })).not.toBeInTheDocument()
    expect(within(rail).queryByText('Fatos confirmados')).not.toBeInTheDocument()
    expect(within(rail).queryByText(/A equipe ainda apura/)).not.toBeInTheDocument()
    expect(within(rail).getByText('transparência')).toBeVisible()
    expect(within(rail).getByText('Governança')).toBeVisible()
    expect(within(rail).getByText('Sustentabilidade')).toBeVisible()
    expect(within(page).getByTestId('demand-press-request')).toHaveTextContent('A TV Globo pediu posicionamento.')
    expect(within(page).getByTestId('demand-fact-context')).toHaveTextContent('A equipe ainda apura as circunstâncias.')
    expect(within(investigation).getByRole('heading', { name: 'Apuração' })).toBeVisible()
    expect(within(investigation).getByText(/Indicador confirmado/)).toBeVisible()
    expect(within(page).getByRole('heading', { name: 'Apuração registrada' })).toBeVisible()
    expect(within(page).getAllByText(/Indicador confirmado/).length).toBeGreaterThan(0)
    expect(within(page).queryByText('Nenhuma tag registrada.')).not.toBeInTheDocument()
    expect(within(page).queryByText('Sem pendências registradas.')).not.toBeInTheDocument()
  })

  it('abre e cancela edição sem criar informações complementares artificiais', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).queryByRole('heading', { name: 'Apuração e classificação' })).not.toBeInTheDocument()
    await openDetailActions(user, page)
    const drawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    expect(within(drawer).queryByRole('combobox', { name: 'Responsável' })).not.toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Cancelar' }))

    expect(within(page).queryByRole('heading', { name: 'Apuração e classificação' })).not.toBeInTheDocument()
    expect(useLocalDemandStore.getState().records).toHaveLength(0)
  })

  it('identifica interações externas e oferece um único CTA de acompanhamento', async () => {
    renderDemandDetail()

    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getAllByText(/Fora da plataforma/).length).toBeGreaterThanOrEqual(3)
    expect(within(page).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Ações da demanda' })).not.toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Excluir' })).toBeVisible()
    expect(within(page).queryByRole('button', { name: 'Mais ações' })).not.toBeInTheDocument()
    expect(within(page).getAllByText('Consolidar dados com Sustentabilidade e preparar posicionamento.').length).toBeGreaterThan(0)
  })

  it('cancela e confirma a exclusão da fixture local, deixando clara a limitação da sessão', async () => {
    const user = userEvent.setup()
    const { local } = renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Excluir' }))
    let confirm = await screen.findByRole('dialog', { name: 'Excluir demanda?' })
    expect(confirm).toHaveTextContent('somente nesta sessão do protótipo')
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    expect(useLocalDemandStore.getState().isHidden(local.id)).toBe(false)
    expect(within(page).getByRole('heading', { name: 'Acidente na operação — TV Globo' })).toBeVisible()

    await user.click(within(page).getByRole('button', { name: 'Excluir' }))
    confirm = await screen.findByRole('dialog', { name: 'Excluir demanda?' })
    await user.click(within(confirm).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByTestId('demand-list-route')).toBeVisible()
    expect(useLocalDemandStore.getState().isHidden(local.id)).toBe(true)
  })

  it('registra interações sem sair da demanda e atualiza timeline e próximo passo', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await openInteraction(user, page)
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })

    expect(within(drawer).getByText('Fora da plataforma')).toBeVisible()
    expect(within(drawer).getByText(/Documente o que já aconteceu fora da Sala/)).toBeVisible()
    const dateInput = within(drawer).getByRole('textbox', { name: 'Data' }) as HTMLInputElement
    const timeInput = within(drawer).getByRole('textbox', { name: 'Hora' }) as HTMLInputElement
    expect(dateInput.value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/)

    await user.clear(dateInput)
    await user.type(dateInput, '26082026')
    await user.clear(timeInput)
    await user.type(timeInput, '1435')

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    for (const option of ['Aguardando retorno', 'Faltou informação ou ajustes', 'Recusado', 'Aprovado', 'Encaminhado', 'Outro', 'Resposta enviada', 'Encerrado sem resposta']) {
      expect(await screen.findByRole('option', { name: option })).toBeVisible()
    }
    expect(screen.queryByRole('option', { name: 'Resolvido' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'Faltou informação ou ajustes' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Tipo de interação' }))
    await user.click(await screen.findByRole('option', { name: 'Consulta jurídica' }))
    await user.type(within(drawer).getByLabelText('Com quem/qual área?'), 'Jurídico e Ana')
    await user.type(within(drawer).getByLabelText('O que faltou ou o que pediram?'), 'Jurídico confirmou a informação.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Enviar minuta revisada.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect((await within(page).findAllByRole('heading', { name: 'Consulta jurídica · Faltou informação ou ajustes' })).length).toBeGreaterThan(0)
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

    await openInteraction(user, page)
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

    await openInteraction(user, page)
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

    await openInteraction(user, page)
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

    await openInteraction(user, page)
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encaminhado' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Tipo de interação' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.type(within(drawer).getByLabelText('Para quem/qual área?'), 'Jurídico')
    await user.type(within(drawer).getByLabelText('O que foi encaminhado?'), 'Minuta para análise.')
    await user.type(within(drawer).getByLabelText('Próximo passo'), 'Aguardar parecer.')

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encerrado sem resposta' }))

    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de interação' })).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Para quem/qual área?')).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Próximo passo')).not.toBeInTheDocument()
    expect(within(drawer).getByLabelText('Motivo do encerramento')).toHaveValue('Minuta para análise.')

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

    await openInteraction(user, page)
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Outro' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    expect(within(drawer).getByText('Informe o tipo de interação.')).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Tipo de interação' })).toHaveFocus()
  })

  it('registra Aguardando retorno de forma enxuta e omite partes vazias na timeline', async () => {
    const user = userEvent.setup()
    renderDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await openInteraction(user, page)
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aguardando retorno' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    const event = (await within(page).findAllByRole('heading', { name: 'Aguardando retorno' }))
      .map((heading) => heading.closest('article'))
      .find((article) => article && within(article).queryByRole('paragraph') === null)
    expect(event).not.toBeNull()
    expect(within(event!).queryByText('Próximo passo registrado')).not.toBeInTheDocument()
    expect(within(event!).queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('oferece registrar interação na captura local já em andamento, sem completar informações', async () => {
    const { view } = renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByRole('heading', { name: 'Acidente na operação — TV Globo' })).toBeVisible()
    expect(within(page).getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(within(page).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Completar informações' })).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Mais ações' })).not.toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Excluir' })).toBeVisible()
    expect(within(page).getByText('Contato ainda não cadastrado')).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Cadastrar jornalista' })).toBeVisible()

    view.unmount()
  })

  it('abre a conversão do contato local com nome e veículo preenchidos e editáveis', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail({ name: 'Marina Lima', outlet: 'TV Globo' })
    const page = await screen.findByTestId('demand-detail')

    await user.click(within(page).getByRole('button', { name: 'Cadastrar jornalista' }))
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

  it('edita somente complementares sem trocar responsável nem etapa', async () => {
    const user = userEvent.setup()
    const { local } = renderLocalDemandDetail()
    act(() => useLocalDemandStore.getState().updateEnrichment(local.id, { priority: 'high', tags: ['original'] }))
    const page = await screen.findByTestId('demand-detail')

    await openDetailActions(user, page)
    const drawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    expect(within(drawer).queryByRole('combobox', { name: 'Responsável' })).not.toBeInTheDocument()
    await user.click(within(drawer).getByRole('tab', { name: 'Classificação' }))
    await user.click(within(drawer).getByRole('button', { name: 'Remover tag original' }))
    await user.type(within(drawer).getByRole('textbox', { name: 'Tags' }), 'editada{Enter}')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }))

    expect(within(page).getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(within(page).getAllByText('Noel Ferreira').length).toBeGreaterThan(0)
    expect(useLocalDemandStore.getState().records[0]?.responsibleName).toBe('Noel Ferreira')
    expect(useLocalDemandStore.getState().records[0]?.status).toBe('in_progress')
    expect(useLocalDemandStore.getState().records[0]?.enrichment.tags).toEqual(['editada'])
  })

  it.each([
    ['in_progress', true, false],
    ['sent', false, true],
    ['closed_without_send', false, true],
  ] satisfies Array<[DemandStatus, boolean, boolean]>)('status %s: interação=%s avaliação=%s', async (status, canInteract, canEvaluate) => {
    renderLocalDemandDetail(undefined, status)
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Solicitar revisão' })).not.toBeInTheDocument()
    expect(within(page).queryByRole('button', { name: 'Completar informações' })).not.toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Excluir' })).toBeVisible()
    if (canInteract) {
      expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
      expect(within(page).getAllByRole('button', { name: 'Escrever posicionamento' }).length).toBeGreaterThan(0)
      expect(within(page).queryByRole('button', { name: 'Avaliar resultado' })).not.toBeInTheDocument()
    } else {
      expect(within(page).queryByRole('button', { name: 'Registrar interação' })).not.toBeInTheDocument()
      expect(within(page).queryByRole('button', { name: 'Escrever posicionamento' })).not.toBeInTheDocument()
      expect(within(page).queryByRole('button', { name: 'Atualizar posicionamento' })).not.toBeInTheDocument()
    }
    if (canEvaluate) {
      expect(within(page).getByRole('button', { name: 'Avaliar resultado' })).toBeVisible()
    }
  })

  it('registra o resultado da pauta após o fechamento e troca o CTA para editar', async () => {
    const user = userEvent.setup()
    renderDemandDetail('d-encerrada')
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByRole('button', { name: 'Avaliar resultado' })).toBeVisible()
    expect(within(page).queryByTestId('demand-outcome-card')).not.toBeInTheDocument()

    await user.click(within(page).getByRole('button', { name: 'Avaliar resultado' }))
    const drawer = await screen.findByRole('dialog', { name: /Avaliar resultado/i })
    const toneGroup = within(drawer).getByRole('radiogroup', { name: 'Qual foi o tom da matéria?' })
    await user.click(within(toneGroup).getByRole('radio', { name: '5 de 5' }))
    await user.click(within(drawer).getByRole('combobox', { name: 'Foi publicado?' }))
    await user.click(await screen.findByRole('option', { name: 'Não' }))
    const usageGroup = within(drawer).getByRole('radiogroup', { name: 'Como o material foi aproveitado?' })
    await user.click(within(usageGroup).getByRole('radio', { name: '1 de 5' }))
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que aconteceu nesta pauta?' }), {
      target: { value: 'Pauta perdeu o objeto; nenhum material foi publicado.' },
    })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar avaliação' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Avaliar resultado/i })).not.toBeInTheDocument()
    })
    expect(within(page).getByTestId('demand-outcome-card')).toBeVisible()
    expect(within(page).getByTestId('stacked-outcome-tone')).toHaveTextContent('5/5')
    expect(within(page).getByTestId('stacked-outcome-published')).toHaveTextContent('Não')
    expect(within(page).getByTestId('stacked-outcome-usage')).toHaveTextContent('1/5')
    expect(within(page).getByRole('button', { name: 'Editar avaliação' })).toBeVisible()
    expect(within(page).queryByRole('button', { name: 'Avaliar resultado' })).not.toBeInTheDocument()
  })

  it('mostra o resultado seed de uma demanda enviada', async () => {
    renderDemandDetail('d-q1')
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByRole('button', { name: 'Editar avaliação' })).toBeVisible()
    expect(within(page).getByTestId('demand-outcome-card')).toBeVisible()
    expect(within(page).getByTestId('stacked-outcome-tone')).toHaveTextContent('5/5')
    expect(within(page).getByTestId('stacked-outcome-published')).toHaveTextContent('Sim')
    expect(within(page).getByTestId('stacked-outcome-usage')).toHaveTextContent('5/5')
  })

  it('mostra pedido e fato separados e registra interação sem fingir etapa interna', async () => {
    const user = userEvent.setup()
    const { unmount: unmountColetiva } = renderDemandDetail('d-coletiva-prazo')
    let page = await screen.findByTestId('demand-detail')
    expect(within(page).getByTestId('demand-press-request').textContent).not.toEqual(within(page).getByTestId('demand-fact-context').textContent)
    expect(within(page).queryByTestId('primary-workflow-action')).not.toBeInTheDocument()
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(page).getByText(/entrevista deixou de ser exclusiva/i)).toBeVisible()
    unmountColetiva()

    const { unmount: unmountJuridico } = renderDemandDetail('d-juridico-frase')
    page = await screen.findByTestId('demand-detail')
    expect(within(page).getByTestId('demand-press-request')).toBeVisible()
    expect(within(page).getByTestId('demand-fact-context')).toBeVisible()
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    await openInteraction(user, page)
    expect(await screen.findByRole('dialog', { name: 'Registrar interação' })).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Registrar interação' })).not.toBeInTheDocument()
    unmountJuridico()

    renderDemandDetail('d-entrevista-adiada')
    page = await screen.findByTestId('demand-detail')
    expect(within(page).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    await openInteraction(user, page)
    const drawer = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aguardando retorno' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(screen.queryByRole('dialog', { name: 'Registrar interação' })).not.toBeInTheDocument()
    expect(within(page).getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(within(page).queryByText('Enviada')).not.toBeInTheDocument()
  })

  it('mostra o nome completo do responsável no card esquerdo', async () => {
    renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')
    const rail = within(page).getByTestId('demand-summary-rail')
    expect(within(rail).getByText('Noel Ferreira')).toBeVisible()
    expect(within(rail).getByText('Noel Ferreira').textContent).toBe('Noel Ferreira')
  })

  it('mostra o contato cadastrado como PersonDetailedCell com preview da ficha', async () => {
    const user = userEvent.setup()
    renderDemandDetail('d-ceo')
    const page = await screen.findByTestId('demand-detail')
    const contato = within(page).getByTestId('stacked-contato')

    expect(within(contato).queryByRole('link', { name: 'Maria Clara' })).not.toBeInTheDocument()
    await user.hover(within(contato).getByText('Maria Clara'))
    expect(await screen.findByText('maria.clara@technews.com')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ver perfil' })).toBeVisible()
  })

  it('abre a conversão do contato local com nome e redação preenchidos e editáveis', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')
    await user.click(within(page).getByRole('button', { name: 'Cadastrar jornalista' }))

    const drawer = await screen.findByRole('dialog', { name: 'Novo jornalista' })
    const name = within(drawer).getByRole('textbox', { name: 'Nome completo' })
    const outlet = within(drawer).getByRole('textbox', { name: 'Veículo ou redação' })
    expect(name).toHaveValue('Contato não identificado')
    expect(outlet).toHaveValue('Fonte não identificada')
    await user.clear(name)
    await user.type(name, 'Marina Lima')
    expect(name).toHaveValue('Marina Lima')
  })

  it('mostra apuração do seed em OPS-204 e não a apaga ao editar só a classificação', async () => {
    const user = userEvent.setup()
    renderDemandDetail('d-sem-jornalista')
    const page = await screen.findByTestId('demand-detail')

    expect(within(page).getByTestId('demand-investigation')).toHaveTextContent('Confirmar local e impacto')
    expect(within(page).getByTestId('demand-capture-next-step')).toHaveTextContent('Identificar a fonte e validar a ocorrência.')

    await user.click(within(page).getByRole('button', { name: 'Editar' }))
    const capture = await screen.findByRole('dialog', { name: /Editar demanda/ })
    expect(within(capture).queryByRole('group', { name: 'Apuração' })).not.toBeInTheDocument()
    expect(within(capture).queryByRole('textbox', { name: 'Fatos confirmados' })).not.toBeInTheDocument()
    await user.click(within(capture).getByRole('tab', { name: 'Classificação' }))
    expect(within(capture).queryByRole('textbox', { name: 'Próximo passo' })).not.toBeInTheDocument()
    await user.click(within(capture).getByRole('button', { name: 'Salvar alterações' }))

    expect(within(page).getByTestId('demand-investigation')).toHaveTextContent('Confirmar local e impacto')
    expect(within(page).getByTestId('demand-capture-next-step')).toHaveTextContent('Identificar a fonte e validar a ocorrência.')
  })

  it('mostra o card de posicionamento vazio, em rascunho e aprovado', async () => {
    const { unmount: unmountCeo } = renderDemandDetail('d-ceo')
    let page = await screen.findByTestId('demand-detail')
    const emptyCard = within(page).getByTestId('demand-positioning')
    expect(within(emptyCard).getByText('Ainda sem resposta')).toBeVisible()
    expect(within(emptyCard).queryByText('Vazio')).not.toBeInTheDocument()
    expect(within(emptyCard).getByRole('button', { name: 'Escrever posicionamento' })).toBeVisible()
    expect(within(page).getByRole('banner').compareDocumentPosition(emptyCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    unmountCeo()

    const { unmount: unmountRegulacao } = renderDemandDetail('d-regulacao')
    page = await screen.findByTestId('demand-detail')
    const draftCard = within(page).getByTestId('demand-positioning')
    expect(within(draftCard).queryByText('Rascunho')).not.toBeInTheDocument()
    expect(within(draftCard).getByText(/cronograma de adequação regulatória/)).toBeVisible()
    expect(within(draftCard).getByTestId('positioning-attachment')).toHaveTextContent('cronograma-regulatorio.pdf')
    expect(within(draftCard).getByRole('button', { name: 'Ler completo' })).toBeVisible()
    expect(within(draftCard).getByRole('button', { name: 'Atualizar posicionamento' })).toBeVisible()
    expect(within(page).getByRole('heading', { name: 'Versão salva' })).toBeVisible()
    const actions = within(page).getByRole('group', { name: 'Ações da demanda' })
    expect(within(actions).queryByRole('button', { name: 'Atualizar posicionamento' })).not.toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    unmountRegulacao()

    renderDemandDetail('d-entrevista-adiada')
    page = await screen.findByTestId('demand-detail')
    const approvedCard = within(page).getByTestId('demand-positioning')
    expect(within(approvedCard).queryByText(/^Aprovado$/)).not.toBeInTheDocument()
    expect(within(approvedCard).getByText(/fala já liberada/)).toBeVisible()
    expect(within(approvedCard).getByText(/Aprovado por/)).toBeVisible()
  })

  it('salva o texto no card e no histórico, marca Aprovado e fecha o drawer', async () => {
    const user = userEvent.setup()
    const { view } = renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')
    const card = within(page).getByTestId('demand-positioning')
    expect(within(card).getByText('Ainda sem resposta')).toBeVisible()

    await user.click(within(card).getByRole('button', { name: 'Escrever posicionamento' }))
    const positioningDrawer = await screen.findByRole('dialog', { name: 'Escrever posicionamento' })
    fireEvent.change(within(positioningDrawer).getByRole('textbox', { name: 'Texto do posicionamento' }), {
      target: { value: 'Nota oficial da operação.' },
    })
    await user.click(within(positioningDrawer).getByRole('button', { name: 'Salvar versão' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Escrever posicionamento' })).not.toBeInTheDocument())
    expect(within(page).getByTestId('demand-positioning')).toHaveTextContent('Nota oficial da operação.')
    expect(within(page).getByTestId('demand-positioning')).not.toHaveTextContent('Rascunho')
    expect(within(page).getByRole('heading', { name: 'Versão salva' })).toBeVisible()
    expect(within(page).getByText('Texto')).toBeVisible()
    expect(within(page).getAllByText('Nota oficial da operação.').length).toBeGreaterThan(0)

    await openInteraction(user, page)
    const interaction = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(interaction).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aprovado' }))
    await user.type(within(interaction).getByLabelText('Quem aprovou / área'), 'Coordenação')
    await user.type(within(interaction).getByLabelText('Parecer'), 'Liberado internamente.')
    await user.click(within(interaction).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Registrar interação' })).not.toBeInTheDocument())
    expect(within(page).getByTestId('demand-positioning')).toHaveTextContent('Aprovado')
    expect(within(page).getAllByText('Em andamento').length).toBeGreaterThan(0)
    view.unmount()
  })

  it('bloqueia Aprovado sem texto e pré-preenche o envio com a versão atual', async () => {
    const user = userEvent.setup()
    renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')

    await openInteraction(user, page)
    let interaction = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(interaction).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aprovado' }))
    await user.type(within(interaction).getByLabelText('Quem aprovou / área'), 'Coordenação')
    await user.type(within(interaction).getByLabelText('Parecer'), 'Liberado.')
    await user.click(within(interaction).getByRole('button', { name: 'Salvar' }))
    expect(await within(interaction).findByText('Salve o posicionamento (texto ou anexo) antes de registrar a aprovação.')).toBeVisible()
    await user.keyboard('{Escape}')
    const discard = screen.queryByRole('dialog', { name: 'Descartar interação?' })
    if (discard) await user.click(within(discard).getByRole('button', { name: 'Descartar' }))

    await user.click(within(page).getByRole('button', { name: 'Escrever posicionamento' }))
    const positioningDrawer = await screen.findByRole('dialog', { name: 'Escrever posicionamento' })
    fireEvent.change(within(positioningDrawer).getByRole('textbox', { name: 'Texto do posicionamento' }), {
      target: { value: 'Texto atual da nota.' },
    })
    await user.click(within(positioningDrawer).getByRole('button', { name: 'Salvar versão' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Escrever posicionamento' })).not.toBeInTheDocument())

    await openInteraction(user, page)
    interaction = await screen.findByRole('dialog', { name: 'Registrar interação' })
    await user.click(within(interaction).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Resposta enviada' }))
    expect(within(interaction).getByLabelText('Texto enviado')).toHaveValue('Texto atual da nota.')
  })

  it('salva anexo no card e no histórico e abre a leitura completa', async () => {
    const user = userEvent.setup()
    const { view } = renderLocalDemandDetail()
    const page = await screen.findByTestId('demand-detail')
    const file = new File(['nota'], 'nota-oficial.pdf', { type: 'application/pdf' })

    await user.click(within(page).getByRole('button', { name: 'Escrever posicionamento' }))
    const positioningDrawer = await screen.findByRole('dialog', { name: 'Escrever posicionamento' })
    await user.upload(within(positioningDrawer).getByLabelText('Anexo do posicionamento'), file)
    fireEvent.change(within(positioningDrawer).getByRole('textbox', { name: 'Texto do posicionamento' }), {
      target: { value: `${'Parágrafo da nota oficial. '.repeat(20)}Fim.` },
    })
    await user.click(within(positioningDrawer).getByRole('button', { name: 'Salvar versão' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Escrever posicionamento' })).not.toBeInTheDocument())

    const card = within(page).getByTestId('demand-positioning')
    expect(within(card).getByTestId('positioning-attachment')).toHaveTextContent('nota-oficial.pdf')
    expect(within(card).getByRole('button', { name: 'Atualizar posicionamento' })).toBeVisible()
    expect(within(page).getByText('Anexo')).toBeVisible()
    expect(within(page).getByText('Texto')).toBeVisible()

    await user.click(within(card).getByRole('button', { name: 'Ler completo' }))
    const readDrawer = await screen.findByRole('dialog', { name: 'Posicionamento' })
    expect(within(readDrawer).getByText(/Fim\./)).toBeVisible()
    expect(within(readDrawer).getByTestId('positioning-attachment')).toHaveTextContent('nota-oficial.pdf')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Posicionamento' })).not.toBeInTheDocument())
    view.unmount()
  })
})
