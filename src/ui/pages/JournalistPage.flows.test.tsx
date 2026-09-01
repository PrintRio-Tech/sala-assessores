import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useJournalist } from '@/application/modules/Journalist/hooks/use-journalist'
import { useRegisterRelationshipEvaluation } from '@/application/modules/Journalist/hooks/use-register-relationship-evaluation'
import { useUpdateJournalist } from '@/application/modules/Journalist/hooks/use-update-journalist'
import { JournalistPage } from './JournalistPage'

vi.mock('@/application/modules/Journalist/hooks/use-journalist', () => ({ useJournalist: vi.fn() }))
vi.mock('@/application/modules/Journalist/hooks/use-update-journalist', () => ({ useUpdateJournalist: vi.fn() }))
vi.mock('@/application/modules/Journalist/hooks/use-register-relationship-evaluation', () => ({ useRegisterRelationshipEvaluation: vi.fn() }))

const journalist = {
  id: 'j-maria', name: 'Maria Clara', roleTitle: 'Repórter', outletName: 'TechNews', desk: 'Tecnologia',
  email: 'maria@tech.test', phone: '+55 11 99999-0000', preferredChannel: 'email' as const,
  bestContactWindow: 'Das 14h às 17h', topics: ['Startups', 'IA'], isActive: true,
  objectiveStats: { totalDemands: 8, solicitedCount: 6, proactiveCount: 2, successRate: 0.75, positioningUsageRate: 0.5 },
  demandHistory: [],
  relationshipEvaluations: [{ id: 'e-1', authorName: 'Ana', recordedAt: new Date('2026-08-20T10:00:00.000Z'), score: 4, traits: ['Analítica'], editorialToneLabel: 'Imparcial / Analítico', notes: 'Registro manual.' }],
}

const update = vi.fn()
const register = vi.fn()

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/jornalistas/j-maria']}>
        <Routes>
          <Route path="/jornalistas" element={<h1>Lista de jornalistas</h1>} />
          <Route path="/jornalistas/:journalistId" element={<JournalistPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('fluxos do perfil do jornalista', () => {
  beforeEach(() => {
    update.mockReset()
    register.mockReset()
    vi.mocked(useJournalist).mockReturnValue({ data: journalist, isLoading: false, error: null, reload: vi.fn() })
    vi.mocked(useUpdateJournalist).mockImplementation((_id, options = {}) => ({
      update: (input) => { update(input); options.onSuccess?.({ ...journalist, ...input }) },
      isPending: false, error: null, reset: vi.fn(),
    }))
    vi.mocked(useRegisterRelationshipEvaluation).mockImplementation((_id, options = {}) => ({
      register: (input) => { register(input); options.onSuccess?.({ ...journalist, relationshipEvaluations: [{ id: 'e-new', ...input }, ...journalist.relationshipEvaluations] }) },
      isPending: false, error: null, reset: vi.fn(),
    }))
  })

  it('oferece retorno acessível e navegável para a lista de jornalistas', async () => {
    renderPage()
    const back = screen.getByRole('link', { name: 'Voltar para jornalistas' })

    expect(back).toHaveAttribute('href', '/jornalistas')
    await userEvent.click(back)
    expect(screen.getByRole('heading', { name: 'Lista de jornalistas' })).toBeVisible()
  })

  it('abre edição pré-preenchida, valida e envia somente dados objetivos', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Editar perfil' }))

    const dialog = screen.getByRole('dialog', { name: 'Editar perfil' })
    expect(within(dialog).getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Maria Clara')
    expect(within(dialog).getByRole('textbox', { name: 'Veículo ou redação' })).toHaveValue('TechNews')
    expect(within(dialog).getByRole('textbox', { name: 'Melhor horário para contato' })).toHaveValue('Das 14h às 17h')
    expect(within(dialog).getByRole('group', { name: 'Temas selecionados' })).toHaveTextContent('Startups')

    await user.clear(within(dialog).getByRole('textbox', { name: 'Nome completo' }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))
    expect(within(dialog).getByText('Informe o nome completo.')).toBeVisible()
    expect(update).not.toHaveBeenCalled()

    await user.type(within(dialog).getByRole('textbox', { name: 'Nome completo' }), 'Maria Editada')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Maria Editada',
      outletName: 'TechNews',
      bestContactWindow: 'Das 14h às 17h',
    }))
    expect(screen.queryByRole('dialog', { name: 'Editar perfil' })).not.toBeInTheDocument()
  })

  it('registra avaliação manual com nota, tom, traços, observações, autor e data explícitos', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Registrar avaliação' }))

    const dialog = screen.getByRole('dialog', { name: 'Registrar avaliação' })
    expect(within(dialog).getByRole('note')).toHaveTextContent(/registro manual e datado.*não é um fato inferido/i)
    await user.type(within(dialog).getByRole('spinbutton', { name: 'Nota de relacionamento' }), '4.5')
    await user.click(within(dialog).getByRole('combobox', { name: 'Tom editorial observado' }))
    await user.click(await screen.findByRole('option', { name: 'Imparcial / Analítico' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Traços observados' }), 'Analítica, Direta')
    await user.type(within(dialog).getByRole('textbox', { name: 'Observações' }), 'Avaliação após contato direto.')
    await user.type(within(dialog).getByRole('textbox', { name: 'Autor do registro' }), 'Ana Paula')
    const date = within(dialog).getByRole('textbox', { name: 'Data do registro' })
    await user.clear(date)
    await user.type(date, '27082026')
    await user.click(within(dialog).getByRole('button', { name: 'Registrar avaliação' }))

    expect(register).toHaveBeenCalledWith({
      score: 4.5,
      editorialToneLabel: 'Imparcial / Analítico',
      traits: ['Analítica', 'Direta'],
      notes: 'Avaliação após contato direto.',
      authorName: 'Ana Paula',
      recordedAt: expect.any(Date),
    })
    expect(screen.queryByRole('dialog', { name: 'Registrar avaliação' })).not.toBeInTheDocument()
  })

  it('exige autor e data e mantém avaliações em região separada dos dados objetivos', async () => {
    renderPage()
    expect(screen.getByRole('region', { name: 'Dados objetivos do jornalista' })).toBeVisible()
    const evaluations = screen.getByRole('region', { name: 'Avaliações registradas' })
    expect(evaluations).toBeVisible()
    expect(within(evaluations).getByText(/20 de ago\./)).not.toHaveTextContent(/\d{2}:\d{2}/)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Registrar avaliação' }))
    const dialog = screen.getByRole('dialog', { name: 'Registrar avaliação' })
    await user.type(within(dialog).getByRole('spinbutton', { name: 'Nota de relacionamento' }), '4')
    await user.click(within(dialog).getByRole('combobox', { name: 'Tom editorial observado' }))
    await user.click(await screen.findByRole('option', { name: 'Imparcial / Analítico' }))
    await user.clear(within(dialog).getByRole('textbox', { name: 'Data do registro' }))
    await user.click(within(dialog).getByRole('button', { name: 'Registrar avaliação' }))

    expect(within(dialog).getByText('Informe o autor do registro.')).toBeVisible()
    expect(within(dialog).getByText('Informe a data do registro.')).toBeVisible()
    expect(register).not.toHaveBeenCalled()
  })
})
