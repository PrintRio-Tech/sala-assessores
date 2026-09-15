import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { HomePage } from '..'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderHomePage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  mockNavigate.mockReset()
  useLocalDemandStore.getState().reset()
})

describe('HomePage', () => {
  it('exibe saudação com nome do usuário', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { name: /Olá, Noel Ferreira/i, level: 1 })).toBeInTheDocument()
  })

  it('exibe subtítulo do mês', () => {
    renderHomePage()
    expect(screen.getByText(/O que foi realizado neste mês\?/i)).toBeInTheDocument()
  })

  it('exibe três KPIs iguais com valor headline e linha de apoio', () => {
    renderHomePage()

    const metrics = screen.getByRole('region', { name: 'Indicadores do mês' })
    const demandsValue = within(metrics).getByText('8')
    expect(demandsValue.className).toMatch(/_lg_/)
    expect(within(metrics).getByText('Demandas em setembro')).toBeInTheDocument()
    expect(within(metrics).getByText('5 em andamento')).toBeInTheDocument()

    const positioningsValue = within(metrics).getByText('3')
    expect(positioningsValue.className).toMatch(/_lg_/)
    expect(within(metrics).getByText('Posicionamentos enviados')).toBeInTheDocument()
    expect(within(metrics).getByText('Taxa de aprovação 86%')).toBeInTheDocument()

    const interactionsValue = within(metrics).getByText('12')
    expect(interactionsValue.className).toMatch(/_lg_/)
    expect(within(metrics).getByText('Interações com jornalistas')).toBeInTheDocument()
    expect(within(metrics).getByText('E-mail, telefone, reunião')).toBeInTheDocument()

    expect(metrics.querySelectorAll('[class*="_elevated_"]')).toHaveLength(3)
    expect(metrics.querySelector('[class*="_primary_"]')).toBeNull()

    const kpiCard = within(metrics).getByText('8').closest('[data-kpi-card]')
    expect(kpiCard).not.toBeNull()
    expect(kpiCard?.className).toMatch(/metricCard/)
  })

  it('exibe seção "Continuar de onde parou" sem ação duplicada de Nova demanda', () => {
    renderHomePage()

    const heading = screen.getByRole('heading', { name: /Continuar de onde parou/i, level: 2 })
    const section = heading.closest('section')
    if (!section) throw new Error('Continue section not found')

    expect(within(section).queryByRole('button', { name: /Nova demanda/i })).not.toBeInTheDocument()
    expect(within(section).queryByRole('heading', { name: /Nova demanda/i })).not.toBeInTheDocument()
  })

  it('exibe lista de demandas em andamento', () => {
    renderHomePage()
    expect(screen.getByText('TEC-889')).toBeInTheDocument()
    expect(screen.getByText('Entrevista exclusiva: CEO TechCorp')).toBeInTheDocument()
    expect(screen.getByText('ECO-442')).toBeInTheDocument()
    expect(screen.getByText('Crise Logística: Impacto nos Portos')).toBeInTheDocument()
  })

  it('exibe uma única ocorrência visível de Nova demanda', () => {
    renderHomePage()

    expect(screen.getAllByRole('heading', { name: 'Nova demanda' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /Nova demanda/i })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre o drawer de captura pelo ActionTile primary', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const actions = screen.getByRole('region', { name: 'Ações rápidas' })
    expect(within(actions).queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
    expect(actions.querySelector('[data-layout="horizontal"]')).toBeNull()

    await user.click(within(actions).getByRole('button', { name: 'Iniciar registro: Nova demanda' }))

    const drawer = await screen.findByRole('dialog', { name: /Nova demanda/ })
    expect(drawer).toBeVisible()
    expect(mockNavigate).not.toHaveBeenCalledWith('/demandas')
  })

  it('exibe quatro ActionTiles de ações rápidas', () => {
    renderHomePage()

    const actions = screen.getByRole('region', { name: 'Ações rápidas' })
    expect(within(actions).getByRole('heading', { name: /Ações rápidas/i, level: 2 })).toBeInTheDocument()
    expect(within(actions).getByRole('heading', { name: 'Nova demanda' })).toBeInTheDocument()
    expect(within(actions).getByRole('heading', { name: 'Novo jornalista' })).toBeInTheDocument()
    expect(within(actions).getByRole('heading', { name: 'Ver demandas' })).toBeInTheDocument()
    expect(within(actions).getByRole('heading', { name: 'Ver relatórios' })).toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: 'Cadastrar mídia: Novo jornalista' })).toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: 'Consultar casos: Ver demandas' })).toBeInTheDocument()
    expect(within(actions).getByRole('button', { name: 'Resultados mensais: Ver relatórios' })).toBeInTheDocument()
  })

  it('navega para demanda ao clicar em item da lista', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const demandItem = screen.getByText('Entrevista exclusiva: CEO TechCorp').closest('button')
    if (!demandItem) throw new Error('Demand item not found')

    await user.click(demandItem)
    expect(mockNavigate).toHaveBeenCalledWith('/demandas/d-ceo')
  })

  it('navega para jornalistas pelo tile de jornalista', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: 'Cadastrar mídia: Novo jornalista' }))
    expect(mockNavigate).toHaveBeenCalledWith('/jornalistas')
  })

  it('navega para demandas pelo tile de demandas', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: 'Consultar casos: Ver demandas' }))
    expect(mockNavigate).toHaveBeenCalledWith('/demandas')
  })

  it('navega para relatórios pelo tile de relatórios', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: 'Resultados mensais: Ver relatórios' }))
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios')
  })
})
