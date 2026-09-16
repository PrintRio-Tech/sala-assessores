import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, Link } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { DemandDetailPage, DemandsPage } from '@/ui/pages/Demand'
import { useDemandFilters } from '@/application/modules/Demand/stores/demand.store'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="URL atual">{`${location.pathname}${location.search}`}</output>
}

function renderDemandsPage(initialEntry = '/demandas') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <DemandsPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderDemandFlow(initialEntry = '/demandas') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Link to="/demandas">Ir à lista de demandas</Link>
        <Routes>
          <Route path="/demandas" element={<DemandsPage />} />
          <Route path="/demandas/:demandId" element={<DemandDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  useDemandFilters.getState().reset()
  useLocalDemandStore.getState().reset()
})

async function openDemandActions(user: ReturnType<typeof userEvent.setup>, title: string) {
  await screen.findAllByRole('link', { name: title })
  const [trigger] = screen.getAllByRole('button', { name: `Ações de ${title}` })
  await user.click(trigger!)
}

describe('cabeçalho da lista de demandas', () => {
  it('reflete estado, responsável e prioridade atuais de uma demanda local na lista e no histórico', async () => {
    const local = useLocalDemandStore.getState().add({
      subject: 'Atualização operacional local',
      factContext: 'Fato confirmado.',
      pressRequest: 'Pedido de posicionamento.',
      requestedDeadline: '2026-08-30',
      channel: 'E-mail',
      contactMode: 'local',
      contactName: 'Contato da redação',
      contactOutlet: 'Jornal Teste',
      journalistId: '',
      journalistName: 'Contato da redação',
      outletName: 'Jornal Teste',
      priority: 'critical',
      enrichment: { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: 'Validar posicionamento.' },
    })

    const { unmount } = renderDemandsPage()

    const activeRow = (await screen.findAllByRole('link', { name: 'Atualização operacional local' }))[0].closest('tr')
    expect(activeRow).not.toBeNull()
    expect(within(activeRow!).getByText('Em andamento')).toBeVisible()
    expect(within(activeRow!).getByText('Noel Ferreira')).toBeVisible()
    expect(within(activeRow!).getByText('P0 · Crítica')).toBeVisible()
    expect(within(activeRow!).queryByText('Rascunho local')).not.toBeInTheDocument()

    unmount()
    useLocalDemandStore.getState().registerInteraction(local.id, {
      occurredAt: new Date('2026-08-30T18:00:00.000Z'),
      result: 'closed_without_send',
      summary: 'Pedido perdeu a atualidade.',
    })
    renderDemandsPage('/demandas?lifecycle=history&status=closed_without_send')

    const historyRow = (await screen.findAllByRole('link', { name: 'Atualização operacional local' }))[0].closest('tr')
    expect(historyRow).not.toBeNull()
    expect(within(historyRow!).getByText('Encerrada sem envio')).toBeVisible()
    expect(within(historyRow!).getByText('Noel Ferreira')).toBeVisible()
    expect(within(historyRow!).getByText('P0 · Crítica')).toBeVisible()
  })

  it('usa reticências tipográficas no texto de apoio da busca', () => {
    renderDemandsPage()

    expect(screen.getByRole('textbox', { name: 'Busca por texto' })).toHaveAttribute(
      'placeholder',
      'Pesquisar título, jornalista ou ID…',
    )
  })

  it('restaura busca, status, responsável, prazo e ciclo a partir da URL', async () => {
    renderDemandsPage('/demandas?q=energia&status=sent&responsible=r-ana&deadline=2026-08-24&lifecycle=history')

    expect(screen.getByRole('textbox', { name: 'Busca por texto' })).toHaveValue('energia')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Enviadas')
    expect(screen.getByRole('combobox', { name: 'Responsável' })).toHaveTextContent('Ana Paula')
    expect(screen.getByRole('textbox', { name: 'Prazo' })).toHaveValue('24/08/2026')
    expect(screen.getByRole('tab', { name: /Histórico/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('persiste alterações dos filtros e da aba na URL', async () => {
    renderDemandsPage()
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Busca por texto' }), 'energia')
    await user.click(screen.getByRole('combobox', { name: 'Responsável' }))
    await user.click(await screen.findByRole('option', { name: 'Ana Paula' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Prazo' }), { target: { value: '24/08/2026' } })
    await user.click(screen.getByRole('tab', { name: /Histórico/ }))

    const url = screen.getByRole('status', { name: 'URL atual' }).textContent ?? ''
    expect(url).toContain('q=energia')
    expect(url).toContain('responsible=r-ana')
    expect(url).toContain('deadline=2026-08-24')
    expect(url).toContain('lifecycle=history')
  })

  it('oferece no Histórico o status contextual Todos, Enviadas e Encerradas sem envio', async () => {
    renderDemandsPage('/demandas?lifecycle=history')
    const user = userEvent.setup()

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('option', { name: 'Todos' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Enviadas' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Encerradas sem envio' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Rascunho' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Aprovada' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Enviadas' }))
    expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent('status=sent')

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Encerradas sem envio' }))
    expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent('status=closed_without_send')
    expect(screen.queryByText('Mostrar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviadas' })).not.toBeInTheDocument()
  })

  it('remove o modo lado a lado e mantém uma única ação primária explícita', () => {
    renderDemandsPage()

    const heading = screen.getByRole('heading', { name: 'Todas as demandas' })
    const header = heading.closest('header')

    expect(header).not.toBeNull()
    expect(within(header!).queryByRole('button', { name: 'Modo lado a lado' })).not.toBeInTheDocument()

    expect(within(header!).queryByRole('button', { name: 'Nova demanda' })).not.toBeInTheDocument()

    const createAction = screen.getByRole('button', { name: 'Começar' })
    expect(createAction).toHaveAttribute('type', 'button')
    const createRegion = screen.getByRole('region', { name: 'Nova demanda' })
    expect(createRegion).toBeVisible()
    expect(createRegion.querySelector('[data-layout="horizontal"][data-width="wide"]')).not.toBeNull()
    const createTitle = within(createRegion).getByRole('heading', { name: 'Nova demanda' })
    expect(createTitle.className).toMatch(/_sm_/)
    expect(createTitle).toHaveAttribute('data-typography', 'compact')
    expect(createRegion.querySelector('[data-create-icon] > span')).toHaveStyle({ width: '24px', height: '24px' })
    const createSupport = screen.getByText('Registre a entrada e mantenha o contexto.')
    expect(createSupport).toBeVisible()
    expect(createSupport.className).toMatch(/_labelMd_/)
    expect(createAction.querySelector('[aria-hidden="true"]')).toHaveStyle({
      maskImage: 'url("/icons/home/arrow-forward.svg")',
    })
  })

  it('abre o fluxo horizontal com três decisões e valida o contato antes de avançar', async () => {
    renderDemandsPage()
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    expect(within(drawer).getByRole('tablist')).toBeVisible()
    expect(within(drawer).getByRole('tab', { name: 'Contato' })).toHaveAttribute('aria-selected', 'true')
    expect(within(drawer).getByRole('tab', { name: 'Pedido' })).toBeVisible()
    expect(within(drawer).getByRole('tab', { name: 'Classificação' })).toBeVisible()
    expect(within(drawer).queryByRole('tab', { name: 'Caso' })).not.toBeInTheDocument()
    expect(within(drawer).getByRole('combobox', { name: 'Canal de entrada' })).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' })).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Prioridade' })).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Canal de entrada' })).toBeVisible()
    expect(within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' })).toBeVisible()
    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de contato' })).not.toBeInTheDocument()
    expect(within(drawer).queryByText('Não identificado / ainda não cadastrado')).not.toBeInTheDocument()

    expect(within(drawer).getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('permite registrar contato local estruturado e conclui com DatePicker no detalhe', async () => {
    useLocalDemandStore.getState().reset()
    renderDemandFlow()
    const user = userEvent.setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    const contactSearch = within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' })
    await user.type(contactSearch, 'Joana Ribeiro')
    await user.click(await screen.findByRole('button', { name: 'Adicionar Joana Ribeiro como novo contato' }))
    expect(within(drawer).getByRole('textbox', { name: 'Quem entrou em contato?' })).toHaveValue('Joana Ribeiro')
    expect(within(drawer).getByRole('button', { name: 'Continuar' })).toBeDisabled()
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Redação ou veículo' }), { target: { value: 'TV Globo' } })
    await user.click(within(drawer).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'Telefone' }))
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Assunto' }), { target: { value: 'Acidente na operação' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que aconteceu?' }), { target: { value: 'Houve um acidente e a apuração inicial está em andamento.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' }), { target: { value: 'A TV Globo pediu um posicionamento.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Prazo solicitado' }), { target: { value: '18/08/2026' } })
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    await user.click(within(drawer).getByRole('button', { name: 'Concluir captura' }))
    const detail = await screen.findByTestId('demand-detail')
    expect(within(detail).getByRole('heading', { name: 'Acidente na operação' })).toBeVisible()
    expect(within(detail).getAllByText('Em andamento').length).toBeGreaterThan(0)
    expect(within(detail).getByRole('button', { name: 'Registrar interação' })).toBeVisible()
    expect(within(detail).queryByRole('button', { name: 'Completar informações' })).not.toBeInTheDocument()
    expect(within(detail).getByRole('heading', { name: 'Demanda registrada' })).toBeVisible()
    expect(within(detail).getByTestId('demand-fact-context')).toHaveTextContent('Houve um acidente e a apuração inicial está em andamento.')
    expect(within(detail).getByTestId('demand-press-request')).toHaveTextContent('A TV Globo pediu um posicionamento.')
    expect(within(within(detail).getByTestId('demand-summary-rail')).queryByText(/Houve um acidente/)).not.toBeInTheDocument()
    expect(within(detail).getAllByText(/Joana Ribeiro/).length).toBeGreaterThan(0)
    expect(within(detail).getAllByText(/18\/08\/26/).length).toBeGreaterThan(0)
    expect(within(detail).getByText('TV Globo')).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Ir à lista de demandas' }))
    expect((await screen.findAllByText('Acidente na operação')).length).toBeGreaterThan(0)
  })

  it('pesquisa e seleciona contato cadastrado no primeiro passo', async () => {
    renderDemandsPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    const contact = within(drawer).getByRole('combobox', { name: 'Quem entrou em contato?' })
    await user.type(contact, 'Maria')
    expect(await screen.findByRole('option', { name: 'Maria Clara' })).toBeVisible()
    await user.click(screen.getByRole('option', { name: 'Maria Clara' }))
    expect(within(drawer).getByRole('region', { name: 'Contexto do contato' })).toHaveTextContent('Maria Clara')
  })

  it('only exposes clear after a filter diverges and restores the initial list', async () => {
    renderDemandsPage()

    const clear = screen.getByRole('button', { name: 'Limpar filtros' })
    expect(clear).toBeDisabled()

    const search = screen.getByRole('textbox', { name: 'Busca por texto' })
    fireEvent.change(search, { target: { value: 'TechCorp' } })

    expect(clear).toBeEnabled()
    fireEvent.click(clear)

    expect(search).toHaveValue('')
    expect(clear).toBeDisabled()
  })

  it('renders an accessible paginator and detailed responsible assignment', async () => {
    renderDemandsPage()

    const pagination = screen.getByRole('navigation', { name: 'Paginação das demandas' })
    expect(pagination).not.toBeNull()
    const firstPageSummary = await within(pagination!).findByText(/^1–4 de \d+$/)
    expect(firstPageSummary).toBeVisible()
    const total = firstPageSummary.textContent?.match(/de (\d+)$/)?.[1]
    expect(total).toBeDefined()
    const next = within(pagination!).getByRole('button', { name: 'Próxima página' })
    expect(next).toBeEnabled()
    const responsible = (await screen.findAllByText('Ana Paula'))[0]
    expect(responsible.closest('span')?.className).toMatch(/inlineName/)

    fireEvent.click(next)

    expect(await within(pagination!).findByText(new RegExp(`^5–\\d+ de ${total}$`))).toBeVisible()
    expect(screen.getAllByText('Impactos da nova regulamentação no setor').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Entrevista exclusiva: CEO TechCorp')).toHaveLength(0)
  })

  it('coloca as abas de ciclo antes de uma única área de filtros e lista os filtros aplicados', async () => {
    renderDemandsPage()
    const user = userEvent.setup()

    const tabs = screen.getByRole('tablist', { name: 'Ciclo das demandas' })
    const filters = screen.getByRole('region', { name: 'Filtros de demandas' })
    expect(tabs.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('Mostrar')).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('option', { name: 'Todos os status' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Em andamento' })).toBeVisible()
    expect(screen.queryByRole('option', { name: 'Rascunho' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Aprovada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Enviadas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Encerradas sem envio' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('region', { name: 'Filtros aplicados' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Busca por texto' }), { target: { value: 'energia' } })
    const applied = await screen.findByRole('region', { name: 'Filtros aplicados' })
    expect(applied).toHaveTextContent('Busca: energia')
  })

  it('remove combinações inválidas de status ao alternar o ciclo', async () => {
    renderDemandsPage('/demandas?status=draft')
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: /Histórico/ }))

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Todos')
    expect(screen.getByRole('status', { name: 'URL atual' })).not.toHaveTextContent('status=draft')
    expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent('lifecycle=history')
  })

  it('sanitiza status de histórico inválido ao restaurar a URL', async () => {
    renderDemandsPage('/demandas?lifecycle=history&status=approved')

    expect(await screen.findByRole('combobox', { name: 'Status' })).toHaveTextContent('Todos')
    expect(screen.getByRole('status', { name: 'URL atual' })).not.toHaveTextContent('status=approved')
  })

  it('não zera o contador de ativas ao filtrar Enviadas no histórico', async () => {
    renderDemandsPage()
    const user = userEvent.setup()
    await screen.findAllByRole('link', { name: 'Entrevista exclusiva: CEO TechCorp' })
    const activeCount = screen.getByRole('tab', { name: /Demandas ativas/ }).textContent
    const historyCount = screen.getByRole('tab', { name: /Histórico/ }).textContent

    await user.click(screen.getByRole('tab', { name: /Histórico/ }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Enviadas' }))

    expect(screen.getByRole('tab', { name: /Demandas ativas/ })).toHaveTextContent(activeCount ?? '')
    expect(screen.getByRole('tab', { name: /Histórico/ })).toHaveTextContent(historyCount ?? '')
    expect(screen.getByRole('tab', { name: /Demandas ativas/ })).not.toHaveTextContent(/0/)
    expect(screen.getAllByRole('link', { name: 'Resultados do Q1 2024' }).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('link', { name: 'Consulta sobre indicador descontinuado' })).toHaveLength(0)
  })

  it('abre, edita e salva a demanda na própria listagem, inclusive no histórico', async () => {
    renderDemandFlow()
    const user = userEvent.setup()

    await openDemandActions(user, 'Entrevista exclusiva: CEO TechCorp')
    await user.click(await screen.findByRole('menuitem', { name: 'Abrir' }))
    expect(await screen.findByTestId('demand-detail')).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Ir à lista de demandas' }))

    await openDemandActions(user, 'Entrevista exclusiva: CEO TechCorp')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const editDrawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    await user.click(within(editDrawer).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.click(within(editDrawer).getByRole('button', { name: 'Continuar' }))
    expect(within(editDrawer).getByRole('textbox', { name: 'Assunto' })).toHaveValue('Entrevista exclusiva: CEO TechCorp')
    fireEvent.change(within(editDrawer).getByRole('textbox', { name: 'Assunto' }), { target: { value: 'Entrevista exclusiva atualizada' } })
    fireEvent.change(within(editDrawer).getByRole('textbox', { name: 'O que aconteceu?' }), { target: { value: 'Pedido de entrevista exclusiva.' } })
    await user.click(within(editDrawer).getByRole('button', { name: 'Continuar' }))
    await user.click(within(editDrawer).getByRole('button', { name: 'Salvar alterações' }))

    expect((await screen.findAllByRole('link', { name: 'Entrevista exclusiva atualizada' })).length).toBeGreaterThan(0)
    expect(screen.queryAllByRole('link', { name: 'Entrevista exclusiva: CEO TechCorp' })).toHaveLength(0)

    await user.click(screen.getByRole('tab', { name: /Histórico/ }))
    await openDemandActions(user, 'Resultados do Q1 2024')
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const historyDrawer = await screen.findByRole('dialog', { name: /Editar demanda/ })
    await user.click(within(historyDrawer).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.click(within(historyDrawer).getByRole('button', { name: 'Continuar' }))
    expect(within(historyDrawer).getByRole('textbox', { name: 'Assunto' })).toHaveValue('Resultados do Q1 2024')
    fireEvent.change(within(historyDrawer).getByRole('textbox', { name: 'Assunto' }), { target: { value: 'Resultados do Q1 corrigidos' } })
    fireEvent.change(within(historyDrawer).getByRole('textbox', { name: 'O que aconteceu?' }), { target: { value: 'Envio de release com resultados.' } })
    await user.click(within(historyDrawer).getByRole('button', { name: 'Continuar' }))
    await user.click(within(historyDrawer).getByRole('button', { name: 'Salvar alterações' }))

    expect(screen.queryByRole('dialog', { name: /Descartar captura/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Descartar alterações/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Nova demanda/ })).not.toBeInTheDocument()
    const historyRow = (await screen.findAllByRole('link', { name: 'Resultados do Q1 corrigidos' }))[0].closest('tr')
    expect(historyRow).not.toBeNull()
    expect(within(historyRow!).getByText('Enviada')).toBeVisible()
  })

  it('cancela a exclusão sem alterar a lista e confirma removendo com paginação coerente', async () => {
    renderDemandsPage()
    const user = userEvent.setup()
    await screen.findAllByRole('link', { name: 'Entrevista exclusiva: CEO TechCorp' })
    const initialActive = screen.getByRole('tab', { name: /Demandas ativas/ }).textContent ?? ''

    await openDemandActions(user, 'Entrevista exclusiva: CEO TechCorp')
    await user.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    const confirm = await screen.findByRole('dialog', { name: /Excluir demanda/ })
    expect(confirm).toHaveTextContent('Entrevista exclusiva: CEO TechCorp')
    expect(confirm).toHaveTextContent('TEC-889')
    await user.click(within(confirm).getByRole('button', { name: 'Cancelar' }))

    expect(screen.getAllByRole('link', { name: 'Entrevista exclusiva: CEO TechCorp' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: /Demandas ativas/ })).toHaveTextContent(initialActive)

    const pagination = screen.getByRole('navigation', { name: 'Paginação das demandas' })
    const firstPageSummary = await within(pagination).findByText(/^1–4 de \d+$/)
    const total = Number(firstPageSummary.textContent?.match(/de (\d+)$/)?.[1])
    fireEvent.click(within(pagination).getByRole('button', { name: 'Próxima página' }))
    expect(await within(pagination).findByText(new RegExp(`^5–\\d+ de ${total}$`))).toBeVisible()

    await openDemandActions(user, 'Impactos da nova regulamentação no setor')
    await user.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    await user.click(within(await screen.findByRole('dialog', { name: /Excluir demanda/ })).getByRole('button', { name: 'Excluir' }))

    await openDemandActions(user, 'Ocorrência operacional em apuração')
    await user.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    await user.click(within(await screen.findByRole('dialog', { name: /Excluir demanda/ })).getByRole('button', { name: 'Excluir' }))

    expect(await within(pagination).findByText(new RegExp(`de ${total - 2}$`))).toBeVisible()
    expect(screen.queryAllByRole('link', { name: 'Impactos da nova regulamentação no setor' })).toHaveLength(0)
    expect(screen.queryAllByRole('link', { name: 'Ocorrência operacional em apuração' })).toHaveLength(0)
    expect(screen.getByRole('tab', { name: /Demandas ativas/ })).not.toHaveTextContent(initialActive)
  })

  it('mantém a exclusão ao abrir o detalhe e ao voltar para a lista', async () => {
    const user = userEvent.setup()
    const { unmount } = renderDemandFlow()

    await openDemandActions(user, 'Relatório ESG: Setor de Energia')
    await user.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    await user.click(within(await screen.findByRole('dialog', { name: /Excluir demanda/ })).getByRole('button', { name: 'Excluir' }))
    expect(screen.queryAllByRole('link', { name: 'Relatório ESG: Setor de Energia' })).toHaveLength(0)

    unmount()
    const detail = renderDemandFlow('/demandas/d-esg')
    expect(await screen.findByText('Demanda não encontrada')).toBeVisible()

    detail.unmount()
    renderDemandFlow('/demandas')
    expect(screen.queryAllByRole('link', { name: 'Relatório ESG: Setor de Energia' })).toHaveLength(0)
  })

})
