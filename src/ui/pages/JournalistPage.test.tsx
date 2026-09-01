import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { queryKeys } from '@/application/constants/query-keys'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { JournalistPage } from './JournalistPage'

describe('perfil do jornalista', () => {
  it('deriva contagens, temas e histórico de demandas locais vinculadas sem misturar avaliações manuais', async () => {
    useLocalDemandStore.getState().reset()
    const localDemand = useLocalDemandStore.getState().add({
      subject: 'Demanda local vinculada',
      factContext: 'Contexto confirmado localmente.',
      pressRequest: 'Pedido de posicionamento.',
      requestedDeadline: '2026-08-30T15:00',
      channel: 'email',
      contactMode: 'known',
      contactName: 'Joana Local',
      contactOutlet: 'Jornal Local',
      journalistId: 'j-local-derived',
      journalistName: 'Joana Local',
      outletName: 'Jornal Local',
    })
    useLocalDemandStore.getState().enrich(localDemand.id, {
      topics: ['Mobilidade urbana'],
      responsibleId: 'r-ana',
      responsibleName: 'Ana Paula',
      priority: 'medium',
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    client.setQueryData(queryKeys.journalist('j-local-derived'), {
      id: 'j-local-derived', name: 'Joana Local', roleTitle: 'Repórter', outletName: 'Jornal Local', desk: 'Cidades',
      email: 'joana@local.test', phone: '', preferredChannel: 'email', bestContactWindow: '', topics: ['Cidades'], isActive: true,
      objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
      demandHistory: [],
      relationshipEvaluations: [{ id: 'eval-local', authorName: 'Ana', recordedAt: new Date('2026-08-20T10:00:00.000Z'), score: 4, traits: [], editorialToneLabel: 'Objetiva', notes: 'Avaliação manual.' }],
    })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/jornalistas/j-local-derived']}>
          <Routes><Route path="/jornalistas/:journalistId" element={<JournalistPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Joana Local' })).toBeVisible()
    expect(screen.getByText('Mobilidade urbana')).toBeVisible()
    expect(screen.getByRole('link', { name: /Demanda local vinculada/ })).toBeVisible()
    expect(screen.getByText('Avaliação manual.')).toBeVisible()
    useLocalDemandStore.getState().reset()
  })

  it('recalcula o perfil a partir das múltiplas demandas mock vinculadas', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/jornalistas/j-carolina']}>
          <Routes><Route path="/jornalistas/:journalistId" element={<JournalistPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Carolina Montenegro' })).toBeVisible()
    const activeDemand = screen.getByRole('link', { name: /Crise Logística: Impacto nos Portos/ })
    expect(activeDemand).toBeVisible()
    expect(activeDemand).toHaveTextContent('Em andamento')
    expect(screen.getByText('5 solicitadas · 0 proativas')).toBeVisible()
  })

  it('mantém os fatos objetivos de Maria ao abrir o detalhe pela lista', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/jornalistas/j-maria']}>
          <Routes>
            <Route path="/jornalistas/:journalistId" element={<JournalistPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Maria Clara' })).toBeVisible()
    expect(screen.getByText('E-mail preferencial')).toBeVisible()
    expect(screen.getByRole('img', { name: 'Maria Clara' })).toBeVisible()
    expect(screen.queryByAltText('Carolina Montenegro')).not.toBeInTheDocument()
  })

  it('abre jornalista local com apenas e-mail sem criar link de telefone vazio', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    client.setQueryData(queryKeys.journalist('j-local-email'), {
      id: 'j-local-email', name: 'Joana Local', roleTitle: '', outletName: 'Jornal Local', desk: '',
      email: 'joana@local.test', phone: '', preferredChannel: 'email', bestContactWindow: '', topics: [], isActive: true,
      objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
      demandHistory: [], relationshipEvaluations: [],
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/jornalistas/j-local-email']}>
          <Routes><Route path="/jornalistas/:journalistId" element={<JournalistPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Joana Local' })).toBeVisible()
    expect(screen.getByRole('link', { name: /E-mail preferencial.*joana@local.test/ })).toHaveAttribute('href', 'mailto:joana@local.test')
    expect(screen.queryByRole('link', { name: /^Telefone/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Telefone não informado')).toBeVisible()
  })

  it('mantém retorno para a lista quando o jornalista não existe', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/jornalistas/inexistente']}>
          <Routes><Route path="/jornalistas/:journalistId" element={<JournalistPage />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Jornalista não encontrado')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar para jornalistas' })).toHaveAttribute('href', '/jornalistas')
  })
})
