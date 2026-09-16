import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { useJournalist } from '@/application/modules/Journalist/hooks/use-journalist'
import { useJournalists } from '@/application/modules/Journalist/hooks/use-journalists'
import { useRegisterDemandOutcome } from '@/application/modules/Demand/hooks/use-register-demand-outcome'
import { useUpdateJournalist } from '@/application/modules/Journalist/hooks/use-update-journalist'
import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { JournalistPage } from '..'

vi.mock('@/application/modules/Journalist/hooks/use-journalist', () => ({ useJournalist: vi.fn() }))
vi.mock('@/application/modules/Journalist/hooks/use-journalists', () => ({ useJournalists: vi.fn() }))
vi.mock('@/application/modules/Journalist/hooks/use-update-journalist', () => ({ useUpdateJournalist: vi.fn() }))
vi.mock('@/application/modules/Demand/hooks/use-register-demand-outcome', () => ({ useRegisterDemandOutcome: vi.fn() }))

const journalist = {
  id: 'j-maria', name: 'Maria Clara', roleTitle: 'Repórter', outletName: 'TechNews', desk: 'Tecnologia',
  email: 'maria@tech.test', phone: '+55 11 99999-0000', preferredChannel: 'email' as const,
  bestContactWindow: 'Das 14h às 17h', topics: ['Startups', 'IA'], isActive: true,
  objectiveStats: { totalDemands: 8, solicitedCount: 6, proactiveCount: 2, successRate: 0.75, positioningUsageRate: 0.5 },
  demandHistory: [
    {
      demandId: 'd-closed',
      title: 'Pauta encerrada sem envio',
      status: 'closed_without_send',
      occurredAt: new Date('2026-08-18T12:00:00.000Z'),
      kindLabel: 'Demanda registrada',
      outcomeLabel: null,
    },
  ],
  relationshipEvaluations: [{ id: 'e-1', authorName: 'Ana', recordedAt: new Date('2026-08-20T10:00:00.000Z'), score: 4, traits: ['Analítica'], editorialToneLabel: 'Imparcial / Analítico', notes: 'Registro manual.' }],
  caseOutcomes: [],
  relationshipScore: 4,
  relationshipScoreLabel: '4.0',
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
    useLocalDemandStore.getState().reset()
    update.mockReset()
    register.mockReset()
    vi.mocked(useJournalist).mockReturnValue({ data: journalist, isLoading: false, error: null, reload: vi.fn() })
    vi.mocked(useJournalists).mockReturnValue({
      data: [journalist],
      filterOptions: { outletNames: [], desks: [], roleTitles: [], topics: [] },
      isLoading: false,
      error: null,
      reload: vi.fn(),
    })
    vi.mocked(useUpdateJournalist).mockImplementation((_id, options = {}) => ({
      update: (input) => { update(input); options.onSuccess?.({ ...journalist, ...input }) },
      isPending: false, error: null, reset: vi.fn(),
    }))
    vi.mocked(useRegisterDemandOutcome).mockImplementation((_id, options = {}) => ({
      register: (input) => { register(input); options.onSuccess?.() },
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
    await user.clear(within(dialog).getByRole('textbox', { name: 'Nome completo' }))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))
    expect(within(dialog).getByText('Informe o nome completo.')).toBeVisible()
    await user.type(within(dialog).getByRole('textbox', { name: 'Nome completo' }), 'Maria Clara Silva')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Maria Clara Silva',
      email: 'maria@tech.test',
      phone: '+55 11 99999-0000',
      preferredChannel: 'email',
      topics: ['Startups', 'IA'],
      outletName: 'TechNews',
      bestContactWindow: 'Das 14h às 17h',
    }))
    expect(screen.queryByRole('dialog', { name: 'Editar perfil' })).not.toBeInTheDocument()
  })

  it('registra resultado de pauta com o mesmo formulário da demanda', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Avaliar resultado' }))

    const dialog = screen.getByRole('dialog', { name: 'Avaliar resultado' })
    expect(within(dialog).getByRole('note')).toHaveTextContent(/registro manual.*fica no caso/i)
    await user.click(within(dialog).getByRole('combobox', { name: 'Pauta' }))
    await user.click(await screen.findByRole('option', { name: 'Pauta encerrada sem envio' }))
    const toneGroup = within(dialog).getByRole('radiogroup', { name: 'Qual foi o tom da matéria?' })
    await user.click(within(toneGroup).getByRole('radio', { name: '4 de 5' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Foi publicado?' }))
    await user.click(await screen.findByRole('option', { name: 'Não' }))
    expect(within(dialog).queryByRole('radiogroup', { name: 'Como o material foi aproveitado?' })).not.toBeInTheDocument()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'O que aconteceu nesta pauta?' }), {
      target: { value: 'Redação não aproveitou o material.' },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Salvar avaliação' }))

    expect(register).toHaveBeenCalledWith({
      demandId: 'd-closed',
      toneScore: 4,
      published: 'no',
      usageScore: null,
      resultSummary: 'Redação não aproveitou o material.',
    })
    expect(screen.queryByRole('dialog', { name: 'Avaliar resultado' })).not.toBeInTheDocument()
  })

  it('exige a pauta e mantém avaliações em região separada dos dados objetivos', async () => {
    renderPage()
    expect(screen.getByRole('region', { name: 'Dados objetivos do jornalista' })).toBeVisible()
    const evaluations = screen.getByRole('region', { name: 'Avaliações registradas' })
    expect(evaluations).toBeVisible()
    expect(within(evaluations).getByText(/20 de ago\./)).not.toHaveTextContent(/\d{2}:\d{2}/)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Avaliar resultado' }))
    const dialog = screen.getByRole('dialog', { name: 'Avaliar resultado' })
    const toneGroup = within(dialog).getByRole('radiogroup', { name: 'Qual foi o tom da matéria?' })
    await user.click(within(toneGroup).getByRole('radio', { name: '4 de 5' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Foi publicado?' }))
    await user.click(await screen.findByRole('option', { name: 'Sim' }))
    const usageGroup = within(dialog).getByRole('radiogroup', { name: 'Como o material foi aproveitado?' })
    await user.click(within(usageGroup).getByRole('radio', { name: '5 de 5' }))
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'O que aconteceu nesta pauta?' }), {
      target: { value: 'Resumo sem pauta.' },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Salvar avaliação' }))

    expect(within(dialog).getByText('Selecione a pauta avaliada.')).toBeVisible()
    expect(register).not.toHaveBeenCalled()
  })

  it('cria nova demanda a partir do perfil com journalistId já vinculado', async () => {
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Nova demanda' }))

    const dialog = await screen.findByRole('dialog', { name: /Nova demanda/ })
    expect(dialog).toBeVisible()

    const journalistField = within(dialog).getByRole('combobox', { name: 'Quem entrou em contato?' })
    expect(journalistField).toHaveValue('Maria Clara')
    expect(within(dialog).getByRole('region', { name: 'Contexto do contato' })).toHaveTextContent('Maria Clara')

    await user.click(within(dialog).getByRole('combobox', { name: 'Canal de entrada' }))
    await user.click(await screen.findByRole('option', { name: 'E-mail' }))
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }))

    await user.type(within(dialog).getByRole('textbox', { name: 'Assunto' }), 'Novo caso de teste')
    await user.type(within(dialog).getByRole('textbox', { name: 'O que aconteceu?' }), 'Contexto do caso')
    await user.type(within(dialog).getByRole('textbox', { name: 'O que foi pedido pela imprensa?' }), 'Posicionamento solicitado')
    await user.type(within(dialog).getByRole('textbox', { name: 'Prazo solicitado' }), '01092026')
    await user.click(within(dialog).getByRole('button', { name: 'Continuar' }))
    await user.click(within(dialog).getByRole('button', { name: 'Concluir captura' }))

    const localDemands = useLocalDemandStore.getState().records
    expect(localDemands).toHaveLength(1)
    expect(localDemands[0].journalistId).toBe('j-maria')
    expect(localDemands[0].journalistName).toBe('Maria Clara')
    expect(localDemands[0].outletName).toBe('TechNews')
  })
})
