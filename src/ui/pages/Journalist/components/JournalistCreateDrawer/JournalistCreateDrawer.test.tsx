import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { JournalistCreateDrawer } from './index'
import styles from './styles.module.scss'

function renderDrawer(overrides: Partial<React.ComponentProps<typeof JournalistCreateDrawer>> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onCreate: vi.fn(),
    ...overrides,
  }
  render(<JournalistCreateDrawer {...props} />)
  return props
}

describe('JournalistCreateDrawer', () => {
  it('abre com estrutura acessível, status ativo e composição responsiva do design system', () => {
    renderDrawer({ topicSuggestions: ['Economia Macro', 'Políticas Públicas'] })

    const dialog = screen.getByRole('dialog', { name: 'Novo jornalista' })
    expect(dialog).toHaveAttribute('data-responsive-origin', 'bottom')
    expect(within(dialog).getByRole('form', { name: 'Cadastro de jornalista' })).toBeVisible()
    expect(within(dialog).getByRole('switch', { name: 'Jornalista ativo' })).toBeChecked()
    expect(within(dialog).getByRole('combobox', { name: 'Canal preferencial' })).toHaveTextContent('E-mail')
    expect(within(dialog).getByRole('textbox', { name: 'Temas de cobertura' })).toHaveAttribute('aria-autocomplete', 'list')
    expect(within(dialog).getByRole('textbox', { name: 'Melhor horário para contato' })).toBeVisible()
    expect(within(dialog).queryByText(/separe os temas por vírgulas/i)).not.toBeInTheDocument()
  })

  it('abre a conversão com nome e veículo do contato local preenchidos e editáveis', async () => {
    const onCreate = vi.fn()
    renderDrawer({
      onCreate,
      initialValue: {
        name: 'Marina Lima',
        outletName: 'TV Globo',
      },
    })
    const user = userEvent.setup()
    const name = screen.getByRole('textbox', { name: 'Nome completo' })
    const outlet = screen.getByRole('textbox', { name: 'Veículo ou redação' })

    expect(name).toHaveValue('Marina Lima')
    expect(outlet).toHaveValue('TV Globo')

    await user.clear(name)
    await user.type(name, 'Marina de Lima')
    await user.clear(outlet)
    await user.type(outlet, 'GloboNews')
    await user.type(screen.getByRole('textbox', { name: 'Telefone' }), '+55 85 99999-0000')
    await user.click(screen.getByRole('button', { name: 'Cadastrar jornalista' }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Marina de Lima',
      outletName: 'GloboNews',
    }))
  })

  it('mantém uma única borda no container e torna o input interno visualmente transparente em todos os estados', async () => {
    renderDrawer()
    const user = userEvent.setup()

    const input = screen.getByRole('textbox', { name: 'Temas de cobertura' })
    const container = input.parentElement
    expect(container).toHaveClass(styles.topicControl)
    expect(input).toHaveClass(styles.topicInput)
    expect(input).not.toHaveClass(styles.topicControl)
    expect(container).toHaveAttribute('data-topic-border', 'container')
    expect(input).toHaveAttribute('data-topic-border', 'none')

    await user.click(input)
    expect(container).toHaveAttribute('data-topic-focused', 'true')
    await user.tab()
    expect(container).not.toHaveAttribute('data-topic-focused')
  })

  it('valida obrigatórios, contato e formato do e-mail com foco no primeiro erro', async () => {
    renderDrawer()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cadastrar jornalista' }))
    expect(screen.getByText('Informe o nome completo.')).toBeVisible()
    expect(screen.getByText('Informe o veículo ou redação.')).toBeVisible()
    expect(screen.getByText('Informe pelo menos um e-mail ou telefone.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toHaveFocus()

    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Ribeiro')
    await user.type(screen.getByRole('textbox', { name: 'Veículo ou redação' }), 'Jornal da Cidade')
    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'email-invalido')
    await user.click(screen.getByRole('button', { name: 'Cadastrar jornalista' }))
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveFocus()
  })

  it('adiciona tema livre por Enter, deduplica e remove chips por botão e Backspace', async () => {
    renderDrawer()
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Temas de cobertura' })

    await user.type(input, '  Mobilidade urbana  {Enter}')
    expect(screen.getByRole('group', { name: 'Temas selecionados' })).toHaveTextContent('Mobilidade urbana')

    await user.type(input, 'mobilidade   urbana{Enter}')
    expect(screen.getAllByText('Mobilidade urbana')).toHaveLength(1)

    await user.type(input, 'Cidades{Enter}')
    await user.click(screen.getByRole('button', { name: 'Remover tema Mobilidade urbana' }))
    expect(screen.queryByText('Mobilidade urbana')).not.toBeInTheDocument()

    await user.click(input)
    await user.keyboard('{Backspace}')
    expect(screen.queryByText('Cidades')).not.toBeInTheDocument()
  })

  it('mantém o chip e o input como itens inline dentro do mesmo container de borda', async () => {
    renderDrawer()
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Temas de cobertura' })
    const container = input.closest('[data-topic-border="container"]')

    await user.type(input, 'oi{Enter}')

    const chip = screen.getByRole('button', { name: 'Remover tema oi' }).closest('span')
    expect(container).not.toBeNull()
    expect(chip).not.toBeNull()
    expect(chip?.parentElement).toBe(container)
    expect(input.parentElement).toBe(container)
  })

  it('adiciona uma sugestão real filtrada sem duplicar o tema', async () => {
    renderDrawer({ topicSuggestions: ['Economia Macro', 'Políticas Públicas'] })
    const user = userEvent.setup()
    const input = screen.getByRole('textbox', { name: 'Temas de cobertura' })

    await user.type(input, 'pol')
    const suggestions = screen.getByRole('listbox', { name: 'Sugestões de temas' })
    await user.click(within(suggestions).getByRole('option', { name: 'Políticas Públicas' }))

    expect(screen.getByRole('group', { name: 'Temas selecionados' })).toHaveTextContent('Políticas Públicas')
    expect(input).toHaveValue('')
  })

  it('envia dados normalizados, melhor horário e topics como array', async () => {
    const onCreate = vi.fn()
    renderDrawer({ onCreate, topicSuggestions: ['Cidades'] })
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana Ribeiro')
    await user.type(screen.getByRole('textbox', { name: 'Veículo ou redação' }), 'Jornal da Cidade')
    await user.type(screen.getByRole('textbox', { name: 'Cargo' }), 'Repórter')
    await user.type(screen.getByRole('textbox', { name: 'Editoria' }), 'Cidades')
    await user.type(screen.getByRole('textbox', { name: 'Telefone' }), '+55 11 99999-0000')
    await user.type(screen.getByRole('textbox', { name: 'Melhor horário para contato' }), 'Das 9h às 11h')
    const topics = screen.getByRole('textbox', { name: 'Temas de cobertura' })
    await user.type(topics, 'Mobilidade{Enter}')
    await user.type(topics, 'cid')
    await user.click(screen.getByRole('option', { name: 'Cidades' }))
    await user.click(screen.getByRole('combobox', { name: 'Canal preferencial' }))
    await user.click(await screen.findByRole('option', { name: 'WhatsApp' }))
    await user.click(screen.getByRole('button', { name: 'Cadastrar jornalista' }))

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Joana Ribeiro', outletName: 'Jornal da Cidade', roleTitle: 'Repórter', desk: 'Cidades',
      email: '', phone: '+55 11 99999-0000', preferredChannel: 'whatsapp',
      bestContactWindow: 'Das 9h às 11h', topics: ['Mobilidade', 'Cidades'], isActive: true,
      initialScore: null, initialScoreAuthorName: 'Noel Ferreira',
    })
  })

  it('confirma descarte apenas quando há dados preenchidos e preserva a edição ao voltar', async () => {
    const onOpenChange = vi.fn()
    renderDrawer({ onOpenChange })
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Nome completo' }), 'Joana')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Descartar cadastro?' })
    await user.click(within(confirmation).getByRole('button', { name: 'Continuar editando' }))
    expect(screen.getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Joana')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(within(await screen.findByRole('dialog', { name: 'Descartar cadastro?' })).getByRole('button', { name: 'Descartar' }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
