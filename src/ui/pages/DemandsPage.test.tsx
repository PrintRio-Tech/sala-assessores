import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { DemandsPage } from './DemandsPage'
import { DemandDetailPage } from './DemandDetailPage'
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

function renderDemandFlow() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/demandas']}>
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
    })
    useLocalDemandStore.getState().enrich(local.id, {
      responsibleId: 'r-noel',
      responsibleName: 'Noel Ferreira',
      priority: 'critical',
      nextStep: 'Validar posicionamento.',
    })

    const { unmount } = renderDemandsPage()

    const activeRow = (await screen.findAllByRole('link', { name: 'Atualização operacional local' }))[0].closest('tr')
    expect(activeRow).not.toBeNull()
    expect(within(activeRow!).getByText('Em andamento')).toBeVisible()
    expect(within(activeRow!).getByText('Noel Ferreira')).toBeVisible()
    expect(within(activeRow!).getByText('P1 · Crítica')).toBeVisible()
    expect(within(activeRow!).queryByText('Rascunho local')).not.toBeInTheDocument()

    unmount()
    useLocalDemandStore.getState().closeWithoutSend(local.id, {
      reason: 'Pedido perdeu a atualidade.',
      closedBy: 'Noel Ferreira',
    })
    renderDemandsPage('/demandas?lifecycle=history&status=closed_without_send')

    const historyRow = (await screen.findAllByRole('link', { name: 'Atualização operacional local' }))[0].closest('tr')
    expect(historyRow).not.toBeNull()
    expect(within(historyRow!).getByText('Encerrada sem envio')).toBeVisible()
    expect(within(historyRow!).getByText('Noel Ferreira')).toBeVisible()
    expect(within(historyRow!).getByText('P1 · Crítica')).toBeVisible()
  })

  it('usa reticências tipográficas no texto de apoio da busca', () => {
    renderDemandsPage()

    expect(screen.getByRole('textbox', { name: 'Busca por texto' })).toHaveAttribute(
      'placeholder',
      'Pesquisar título, jornalista ou ID…',
    )
  })

  it('restaura busca, status, responsável, prazo e ciclo a partir da URL', async () => {
    renderDemandsPage('/demandas?q=energia&status=approved&responsible=r-ana&deadline=2026-08-24&lifecycle=history')

    expect(screen.getByRole('textbox', { name: 'Busca por texto' })).toHaveValue('energia')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Aprovada')
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

  it('oferece no Histórico filtros explícitos para enviadas e encerradas sem envio', async () => {
    renderDemandsPage('/demandas?lifecycle=history')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Enviadas' }))
    expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent('status=sent')

    await user.click(screen.getByRole('button', { name: 'Encerradas sem envio' }))
    expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent('status=closed_without_send')
    expect(screen.queryByText(/pasta/i)).not.toBeInTheDocument()
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
    expect(within(drawer).getByRole('tab', { name: 'Caso' })).toBeVisible()
    expect(within(drawer).getByRole('tab', { name: 'Pedido' })).toBeVisible()
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
    await user.click(within(drawer).getByRole('button', { name: 'Continuar' }))
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' }), { target: { value: 'A TV Globo pediu um posicionamento.' } })
    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Prazo solicitado' }), { target: { value: '18/08/2026' } })
    await user.click(within(drawer).getByRole('button', { name: 'Concluir captura' }))
    const detail = await screen.findByTestId('demand-detail')
    expect(within(detail).getByRole('heading', { name: 'Acidente na operação' })).toBeVisible()
    expect(within(detail).getAllByText('Rascunho').length).toBeGreaterThan(0)
    expect(within(detail).getByText('Houve um acidente e a apuração inicial está em andamento.')).toBeVisible()
    expect(within(detail).getByText('A TV Globo pediu um posicionamento.')).toBeVisible()
    expect(within(detail).getAllByText(/Joana Ribeiro/).length).toBeGreaterThan(0)
    expect(within(detail).getAllByText(/18\/08\/2026/).length).toBeGreaterThan(0)
    expect(within(detail).getAllByText(/Joana Ribeiro · TV Globo/).length).toBeGreaterThan(0)
    await user.click(within(detail).getByRole('link', { name: 'Voltar às demandas' }))
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

    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()

    const search = screen.getByRole('textbox', { name: 'Busca por texto' })
    fireEvent.change(search, { target: { value: 'TechCorp' } })

    const clear = await screen.findByRole('button', { name: 'Limpar filtros' })
    fireEvent.click(clear)

    expect(search).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
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

  it('navegação lista para detalhe e volta preserva filtros e paginação', async () => {
    renderDemandFlow()
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Busca por texto' }), 'regulação')
    const firstDemand = (await screen.findAllByRole('link', { name: /regulação/i }))[0]
    await user.click(firstDemand)

    const detail = await screen.findByTestId('demand-detail')
    expect(within(detail).getByRole('heading', { level: 1 })).toBeVisible()

    await user.click(within(detail).getByRole('link', { name: 'Voltar às demandas' }))

    expect(await screen.findByRole('heading', { name: 'Todas as demandas' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Busca por texto' })).toHaveValue('regulação')
  })

})
