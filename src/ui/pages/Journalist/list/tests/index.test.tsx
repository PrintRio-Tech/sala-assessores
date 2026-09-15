import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useCreateJournalist } from '@/application/modules/Journalist/hooks/use-create-journalist'
import { JournalistsPage } from '..'

vi.mock('@/application/modules/Journalist/hooks/use-journalists', () => ({
  useJournalists: vi.fn(),
}))
vi.mock('@/application/modules/Journalist/hooks/use-create-journalist', () => ({
  useCreateJournalist: vi.fn(),
}))

const journalists = [
  {
    id: 'j-carolina',
    name: 'Carolina Montenegro',
    roleTitle: 'Repórter Especial',
    outletName: 'Valor Econômico',
    desk: 'Economia',
    email: 'c.montenegro@valor.com.br',
    phone: '+55 (11) 98765-4321',
    preferredChannel: 'whatsapp' as const,
    bestContactWindow: 'Manhã',
    topics: ['Economia Macro'],
    isActive: true,
    objectiveStats: { totalDemands: 142, solicitedCount: 80, proactiveCount: 62, successRate: 0.78, positioningUsageRate: 0.65 },
    demandHistory: [],
    relationshipEvaluations: [{ id: 'eval-1', authorName: 'Ana', recordedAt: new Date('2026-07-01'), score: 4.8, traits: [], editorialToneLabel: 'Imparcial', notes: 'Registro manual.' }],
  },
  {
    id: 'j-maria',
    name: 'Maria Clara',
    roleTitle: 'Repórter de Tecnologia',
    outletName: 'TechNews',
    desk: 'Tecnologia',
    email: 'maria.clara@technews.com',
    phone: '+55 (21) 98888-1001',
    preferredChannel: 'email' as const,
    bestContactWindow: 'Tarde',
    topics: ['Startups'],
    isActive: true,
    objectiveStats: { totalDemands: 28, solicitedCount: 20, proactiveCount: 8, successRate: 0.71, positioningUsageRate: 0.54 },
    demandHistory: [],
    relationshipEvaluations: [],
  },
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `j-extra-${index + 1}`,
    name: index === 3 ? 'João Inativo' : `Contato Extra ${index + 1}`,
    roleTitle: index === 3 ? 'Editor' : 'Correspondente',
    outletName: index === 3 ? 'Agência Pública' : 'Rede Nacional',
    desk: index === 3 ? 'Política' : 'Geral',
    email: `contato${index + 1}@redacao.com`,
    phone: `+55 (11) 90000-000${index + 1}`,
    preferredChannel: index === 3 ? 'phone' as const : 'whatsapp' as const,
    bestContactWindow: 'Tarde',
    topics: index === 3 ? ['Políticas Públicas'] : ['Notícias'],
    isActive: index !== 3,
    objectiveStats: { totalDemands: index + 1, solicitedCount: index + 1, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
    demandHistory: [],
    relationshipEvaluations: [],
  })),
]

const mockedUseJournalists = vi.mocked(useJournalists)
const mockedUseCreateJournalist = vi.mocked(useCreateJournalist)
const createJournalist = vi.fn()

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/jornalistas']}>
        <Routes>
          <Route path="/jornalistas" element={<JournalistsPage />} />
          <Route path="/jornalistas/:journalistId" element={<h1>Perfil aberto</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('lista de jornalistas', () => {
  beforeEach(() => {
    createJournalist.mockReset()
    mockedUseCreateJournalist.mockReturnValue({
      create: createJournalist,
      isPending: false,
      error: null,
      reset: vi.fn(),
    })
    mockedUseJournalists.mockImplementation((filters = {}) => {
      const term = filters.search?.toLocaleLowerCase('pt-BR') ?? ''
      const data = journalists.filter((journalist) => {
        const matchesSearch = !term || [journalist.name, journalist.outletName, journalist.desk, journalist.roleTitle, journalist.email]
          .some((value) => value.toLocaleLowerCase('pt-BR').includes(term))
        return matchesSearch
          && (!filters.outletName || journalist.outletName === filters.outletName)
          && (!filters.desk || journalist.desk === filters.desk)
          && (!filters.roleTitle || journalist.roleTitle === filters.roleTitle)
          && (!filters.status || (filters.status === 'active' ? journalist.isActive : !journalist.isActive))
          && (!filters.preferredChannel || journalist.preferredChannel === filters.preferredChannel)
          && (!filters.topic || journalist.topics.includes(filters.topic))
      })
      return {
        data,
        filterOptions: {
          outletNames: [...new Set(journalists.map((item) => item.outletName))].sort(),
          desks: [...new Set(journalists.map((item) => item.desk))].sort(),
          roleTitles: [...new Set(journalists.map((item) => item.roleTitle))].sort(),
          topics: [...new Set(journalists.flatMap((item) => item.topics))].sort(),
        },
        isLoading: false,
        error: null,
        reload: vi.fn(),
      }
    })
  })

  it('mostra fatos objetivos úteis para triagem sem inventar avaliação ausente', () => {
    renderPage()
    const table = screen.getByRole('table')
    const carolinaRow = within(table).getByText('Carolina Montenegro').closest('tr')

    expect(screen.getByRole('heading', { name: 'Jornalistas' })).toBeVisible()
    expect(carolinaRow).not.toBeNull()
    expect(within(carolinaRow!).getByText('Valor Econômico · Economia')).toBeVisible()
    expect(within(carolinaRow!).getByText('WhatsApp')).toBeVisible()
    expect(within(carolinaRow!).getByText('142')).toBeVisible()
    expect(within(carolinaRow!).getByText('1 avaliação registrada')).toBeVisible()
    expect(within(table).getAllByText('Sem avaliação registrada').length).toBeGreaterThan(0)
    expect(screen.getByText(/6 jornalistas encontrados/)).toHaveAttribute('aria-live', 'polite')
  })

  it('expõe Novo jornalista como ação primária acessível e responsiva no cabeçalho', () => {
    renderPage()
    const heading = screen.getByRole('heading', { name: 'Jornalistas' })
    const header = heading.closest('header')

    expect(header).not.toBeNull()
    const createRegion = within(header!).getByRole('region', { name: 'Novo jornalista' })
    expect(createRegion.querySelector('[data-layout="horizontal"][data-width="wide"]')).not.toBeNull()
    expect(createRegion.querySelector('[data-create-icon]')).toHaveAttribute('aria-hidden', 'true')
    const createButton = within(createRegion).getByRole('button', { name: 'Novo jornalista' })
    expect(createButton).toHaveAttribute('type', 'button')
    expect(createButton.className).toMatch(/_secondary_/)
  })

  it('abre o formulário real, cadastra e fecha após sucesso sem navegar', async () => {
    mockedUseCreateJournalist.mockImplementation((options = {}) => ({
      create: (input) => {
        createJournalist(input)
        options.onSuccess?.({
          id: 'j-local-test', ...input,
          bestContactWindow: '',
          objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
          demandHistory: [], relationshipEvaluations: [],
        })
      },
      isPending: false,
      error: null,
      reset: vi.fn(),
    }))
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Novo jornalista' }))

    const dialog = await screen.findByRole('dialog', { name: 'Novo jornalista' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Temas de cobertura' }), 'eco')
    expect(within(dialog).getByRole('option', { name: 'Economia Macro' })).toBeVisible()
    await user.clear(within(dialog).getByRole('textbox', { name: 'Temas de cobertura' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Nome completo' }), 'Joana Nova')
    await user.type(within(dialog).getByRole('textbox', { name: 'Veículo ou redação' }), 'Jornal Teste')
    await user.type(within(dialog).getByRole('textbox', { name: 'E-mail' }), 'joana@teste.dev')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar jornalista' }))

    expect(createJournalist).toHaveBeenCalledWith(expect.objectContaining({ name: 'Joana Nova', outletName: 'Jornal Teste' }))
    expect(screen.queryByRole('dialog', { name: 'Novo jornalista' })).not.toBeInTheDocument()
    expect(document.querySelector('h1')).toHaveTextContent('Jornalistas')
  })

  it.each(['carolina', 'TechNews', 'Tecnologia', 'Repórter Especial', 'maria.clara@technews.com'])('busca livre: %s', (term) => {
    renderPage()

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar jornalistas' }), { target: { value: term } })

    const expectedName = term === 'carolina' || term === 'Repórter Especial' ? 'Carolina Montenegro' : 'Maria Clara'
    const table = screen.getByRole('table')
    expect(within(table).getByText(expectedName)).toBeVisible()
    expect(within(table).queryByText(expectedName === 'Maria Clara' ? 'Carolina Montenegro' : 'Maria Clara')).not.toBeInTheDocument()
  })

  it('expõe veículo e editoria e combina os filtros essenciais', async () => {
    renderPage()
    const user = userEvent.setup()

    expect(screen.getByRole('combobox', { name: 'Veículo' })).toBeVisible()
    expect(screen.getByRole('combobox', { name: 'Editoria' })).toBeVisible()
    await user.click(screen.getByRole('combobox', { name: 'Veículo' }))
    await user.click(await screen.findByRole('option', { name: 'TechNews' }))
    await user.click(screen.getByRole('combobox', { name: 'Editoria' }))
    await user.click(await screen.findByRole('option', { name: 'Tecnologia' }))

    expect(within(screen.getByRole('table')).getByText('Maria Clara')).toBeVisible()
    expect(within(screen.getByRole('table')).queryByText('Carolina Montenegro')).not.toBeInTheDocument()
  })

  it('revela e combina filtros avançados usando somente campos do jornalista', async () => {
    renderPage()
    const user = userEvent.setup()

    expect(screen.queryByRole('combobox', { name: 'Cargo' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mais filtros' }))
    expect(screen.getByRole('button', { name: 'Menos filtros' })).toHaveAttribute('aria-expanded', 'true')

    for (const [label, option] of [
      ['Cargo', 'Repórter de Tecnologia'],
      ['Status', 'Ativos'],
      ['Canal preferencial', 'E-mail'],
      ['Tema', 'Startups'],
    ] as const) {
      await user.click(screen.getByRole('combobox', { name: label }))
      await user.click(await screen.findByRole('option', { name: option }))
    }

    expect(within(screen.getByRole('table')).getByText('Maria Clara')).toBeVisible()
    expect(screen.getByText('1 jornalista encontrado')).toBeVisible()
  })

  it('filtra inativos e limpa todos os filtros', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Mais filtros' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Inativos' }))
    expect(within(screen.getByRole('table')).getByText('João Inativo')).toBeVisible()
    await user.type(screen.getByRole('textbox', { name: 'Buscar jornalistas' }), 'joão')
    expect(screen.getByText(/1 jornalista encontrado/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getByText(/6 jornalistas encontrados/)).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Buscar jornalistas' })).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Todos os status')
  })

  it('pagina no cliente e volta à primeira página ao filtrar', async () => {
    renderPage()
    const user = userEvent.setup()

    expect(screen.getByRole('navigation', { name: 'Paginação dos jornalistas' })).toHaveTextContent('1–5 de 6')
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByRole('navigation', { name: 'Paginação dos jornalistas' })).toHaveTextContent('6–6 de 6')
    expect(within(screen.getByRole('table')).getByText('João Inativo')).toBeVisible()

    await user.type(screen.getByRole('textbox', { name: 'Buscar jornalistas' }), 'carolina')
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
    expect(within(screen.getByRole('table')).getByText('Carolina Montenegro')).toBeVisible()
  })

  it('mostra contador de filtros aplicados quando há resultados filtrados', async () => {
    renderPage()
    const user = userEvent.setup()
    
    expect(screen.getByText(/6 jornalistas encontrados/)).toBeVisible()
    expect(screen.queryByText(/filtrado de/)).not.toBeInTheDocument()
    
    await user.click(screen.getByRole('combobox', { name: 'Veículo' }))
    await user.click(await screen.findByRole('option', { name: 'TechNews' }))
    
    expect(screen.getByText(/1 jornalista encontrado/)).toBeVisible()
    expect(screen.getByText(/filtrado de 6 cadastros/)).toBeVisible()
  })

  it('mantém conteúdo e ação nas composições desktop e mobile do DataTable', () => {
    renderPage()
    expect(screen.getAllByText('Carolina Montenegro')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Abrir perfil' })).toHaveLength(10)
  })

  it('reserva área segura mobile para rolar o filtro Tema acima da navegação inferior', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Mais filtros' }))

    const topic = screen.getByRole('combobox', { name: 'Tema' })
    const advancedFilters = topic.closest('[data-mobile-safe-area]')

    expect(advancedFilters).toHaveAttribute('data-mobile-safe-area', 'bottom-navigation')
  })

  it('distingue cadastro vazio de busca sem resultado e mostra contador de filtros', () => {
    const view = renderPage()
    expect(screen.getByText(/6 jornalistas encontrados/)).toBeVisible()
    
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar jornalistas' }), { target: { value: 'inexistente' } })
    expect(within(screen.getByRole('table')).getByText('Nenhum jornalista corresponde aos filtros.')).toBeVisible()
    expect(screen.getByText('Nenhum resultado para os filtros aplicados')).toBeVisible()

    mockedUseJournalists.mockReturnValue({ data: [], filterOptions: { outletNames: [], desks: [], roleTitles: [], topics: [] }, isLoading: false, error: null, reload: vi.fn() })
    view.rerender(
      <MemoryRouter initialEntries={['/jornalistas']}>
        <JournalistsPage />
      </MemoryRouter>,
    )
    expect(within(screen.getByRole('table')).getByText('Nenhum jornalista cadastrado.')).toBeVisible()
  })

  it('leva ao perfil pela ação da linha', async () => {
    renderPage()
    await userEvent.click(screen.getAllByRole('button', { name: 'Abrir perfil' })[0])
    expect(await screen.findByRole('heading', { name: 'Perfil aberto' })).toBeVisible()
  })

  it('trata loading e erro com retry', () => {
    const reload = vi.fn()
    mockedUseJournalists.mockReturnValue({ data: [], filterOptions: { outletNames: [], desks: [], roleTitles: [], topics: [] }, isLoading: true, error: null, reload })
    const view = renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando jornalistas')

    mockedUseJournalists.mockReturnValue({ data: [], filterOptions: { outletNames: [], desks: [], roleTitles: [], topics: [] }, isLoading: false, error: new Error('falha'), reload })
    view.rerender(
      <MemoryRouter initialEntries={['/jornalistas']}>
        <JournalistsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
