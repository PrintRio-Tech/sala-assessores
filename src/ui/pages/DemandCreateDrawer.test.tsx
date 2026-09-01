import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { NewLocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
import { DemandCreateDrawer } from './DemandCreateDrawer'

const mockJournalists: Journalist[] = [
  {
    id: 'j-1',
    name: 'Maria Silva',
    email: 'maria@exemplo.com',
    phone: '11999999999',
    outletName: 'Jornal Exemplo',
    desk: 'Política',
    relationshipStatus: 'active',
    evaluations: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'j-2',
    name: 'João Santos',
    email: 'joao@teste.com',
    phone: '11888888888',
    outletName: 'TV Teste',
    desk: 'Economia',
    relationshipStatus: 'active',
    evaluations: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
]

describe('DemandCreateDrawer', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onCapture: vi.fn<[NewLocalDemandCapture]>(),
    journalists: mockJournalists,
    journalistsLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o drawer quando aberto', () => {
    render(<DemandCreateDrawer {...defaultProps} />)
    expect(screen.getByText('Nova demanda')).toBeInTheDocument()
    expect(screen.getByLabelText('Quem entrou em contato?')).toBeInTheDocument()
  })

  it('não renderiza quando fechado', () => {
    render(<DemandCreateDrawer {...defaultProps} open={false} />)
    expect(screen.queryByText('Nova demanda')).not.toBeInTheDocument()
  })

  it('permite pular o cadastro de contato e completar a captura sem jornalista', async () => {
    const user = userEvent.setup()
    const onCapture = vi.fn<[NewLocalDemandCapture]>()
    render(<DemandCreateDrawer {...defaultProps} onCapture={onCapture} />)

    await user.click(screen.getByText('Receber sem contato cadastrado'))

    expect(screen.getByText(/Recebimento sem contato cadastrado/)).toBeInTheDocument()

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('E-mail'))

    await user.click(screen.getByText('Continuar'))

    const subjectInput = screen.getByLabelText('Assunto')
    await user.type(subjectInput, 'Assunto teste')

    const factInput = screen.getByLabelText('O que aconteceu?')
    await user.type(factInput, 'Contexto do fato')

    await user.click(screen.getByText('Continuar'))

    const requestInput = screen.getByLabelText('O que foi pedido pela imprensa?')
    await user.type(requestInput, 'Pedido da imprensa')

    const deadlineInput = screen.getByLabelText('Prazo solicitado')
    await user.type(deadlineInput, '2026-09-15')

    await user.click(screen.getByText('Concluir captura'))

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          contactMode: 'local',
          contactName: 'Sem contato cadastrado',
          contactOutlet: '',
          subject: 'Assunto teste',
          factContext: 'Contexto do fato',
          pressRequest: 'Pedido da imprensa',
          requestedDeadline: '2026-09-15',
          channel: 'E-mail',
          journalistId: '',
          tags: [],
        }),
      )
    })
  })

  it('permite adicionar tags sugeridas e tags personalizadas', async () => {
    const user = userEvent.setup()
    const onCapture = vi.fn<[NewLocalDemandCapture]>()
    render(<DemandCreateDrawer {...defaultProps} onCapture={onCapture} initialJournalistId="j-1" />)

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('E-mail'))
    await user.click(screen.getByText('Continuar'))

    await user.type(screen.getByLabelText('Assunto'), 'Teste')
    await user.type(screen.getByLabelText('O que aconteceu?'), 'Fato teste')
    await user.click(screen.getByText('Continuar'))

    await user.type(screen.getByLabelText('O que foi pedido pela imprensa?'), 'Pedido teste')
    await user.type(screen.getByLabelText('Prazo solicitado'), '2026-09-15')

    await user.click(screen.getByRole('button', { name: 'acidente' }))
    await user.click(screen.getByRole('button', { name: 'operação' }))

    const tagInput = screen.getByPlaceholderText('Digite uma tag e pressione Enter')
    await user.type(tagInput, 'tag-personalizada{Enter}')

    await user.click(screen.getByText('Concluir captura'))

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['acidente', 'operação', 'tag-personalizada'],
        }),
      )
    })
  })

  it('permite remover tags adicionadas', async () => {
    const user = userEvent.setup()
    render(<DemandCreateDrawer {...defaultProps} initialJournalistId="j-1" />)

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('E-mail'))
    await user.click(screen.getByText('Continuar'))

    await user.type(screen.getByLabelText('Assunto'), 'Teste')
    await user.type(screen.getByLabelText('O que aconteceu?'), 'Fato')
    await user.click(screen.getByText('Continuar'))

    await user.click(screen.getByRole('button', { name: 'acidente' }))
    await user.click(screen.getByRole('button', { name: 'operação' }))

    expect(screen.getByText('acidente')).toBeInTheDocument()
    expect(screen.getByText('operação')).toBeInTheDocument()

    const chips = screen.getAllByRole('button', { name: /remover/i })
    await user.click(chips[0])

    expect(screen.queryByText('acidente')).not.toBeInTheDocument()
    expect(screen.getByText('operação')).toBeInTheDocument()
  })

  it('permite registrar contato local quando nenhum jornalista é encontrado', async () => {
    const user = userEvent.setup()
    const onCapture = vi.fn<[NewLocalDemandCapture]>()
    render(<DemandCreateDrawer {...defaultProps} onCapture={onCapture} />)

    const searchInput = screen.getByPlaceholderText('Buscar contato ou redação')
    await user.type(searchInput, 'Novo Contato')

    await user.click(screen.getByText(/Adicionar Novo Contato como novo contato/))

    expect(screen.getByLabelText('Quem entrou em contato?')).toHaveValue('Novo Contato')

    await user.type(screen.getByLabelText('Redação ou veículo'), 'Nova Redação')

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('Telefone'))

    await user.click(screen.getByText('Continuar'))

    await user.type(screen.getByLabelText('Assunto'), 'Teste contato local')
    await user.type(screen.getByLabelText('O que aconteceu?'), 'Fato')
    await user.click(screen.getByText('Continuar'))

    await user.type(screen.getByLabelText('O que foi pedido pela imprensa?'), 'Pedido')
    await user.type(screen.getByLabelText('Prazo solicitado'), '2026-09-15')
    await user.click(screen.getByText('Concluir captura'))

    await waitFor(() => {
      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          contactMode: 'local',
          contactName: 'Novo Contato',
          contactOutlet: 'Nova Redação',
          journalistId: '',
        }),
      )
    })
  })

  it('valida campos obrigatórios em cada etapa', async () => {
    const user = userEvent.setup()
    render(<DemandCreateDrawer {...defaultProps} />)

    await user.click(screen.getByText('Continuar'))

    expect(screen.getByText('Informe o canal de entrada.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('E-mail'))

    await user.click(screen.getByText('Continuar'))

    expect(screen.getByText('Informe o contato ou registre-o localmente.')).toBeInTheDocument()
  })

  it('exibe confirmação ao tentar descartar com alterações', async () => {
    const user = userEvent.setup()
    render(<DemandCreateDrawer {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('Buscar contato ou redação'), 'Teste')

    await user.click(screen.getByText('Cancelar'))

    expect(screen.getByText('Descartar captura?')).toBeInTheDocument()
    expect(screen.getByText('As informações preenchidas nesta entrada serão perdidas.')).toBeInTheDocument()
  })

  it('mantém separação clara entre fato e pedido', async () => {
    const user = userEvent.setup()
    render(<DemandCreateDrawer {...defaultProps} initialJournalistId="j-1" />)

    await user.click(screen.getByLabelText('Canal de entrada'))
    await user.click(screen.getByText('E-mail'))
    await user.click(screen.getByText('Continuar'))

    expect(screen.getByLabelText('Assunto')).toBeInTheDocument()
    expect(screen.getByLabelText('O que aconteceu?')).toBeInTheDocument()
    expect(screen.getByText('Registre o fato recebido.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Assunto'), 'Assunto')
    await user.type(screen.getByLabelText('O que aconteceu?'), 'Fato')
    await user.click(screen.getByText('Continuar'))

    expect(screen.getByLabelText('O que foi pedido pela imprensa?')).toBeInTheDocument()
    expect(screen.getByLabelText('Prazo solicitado')).toBeInTheDocument()
  })
})
