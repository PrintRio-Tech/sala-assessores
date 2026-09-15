import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useLocalDemandStore } from '@/application/modules/Demand/stores/local-demand.store'
import { DemandInteractionDrawer } from './index'

afterEach(() => {
  cleanup()
  useLocalDemandStore.getState().reset()
})

function renderDrawer(positioningBody = '', onOpenChange = vi.fn()) {
  const demand = useLocalDemandStore.getState().add({
    subject: 'Caso local',
    factContext: 'Fato.',
    pressRequest: 'Pedido.',
    requestedDeadline: '2026-08-28',
    channel: 'Telefone',
    contactMode: 'local',
    contactName: 'Contato',
    contactOutlet: 'Redação',
    journalistId: '',
    journalistName: 'Contato',
    outletName: 'Redação',
  })
  if (positioningBody) useLocalDemandStore.getState().savePositioning(demand.id, { body: positioningBody })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <DemandInteractionDrawer
        demandId={demand.id}
        demandCode={demand.code}
        demandTitle={demand.subject}
        positioningBody={useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.positioning.versions.at(-1)?.body ?? ''}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  )
  return { demand, onOpenChange }
}

describe('DemandInteractionDrawer', () => {
  it('não pede versão ao registrar encaminhamento', async () => {
    renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encaminhado' }))

    expect(within(drawer).queryByRole('textbox', { name: /versão/i })).not.toBeInTheDocument()
    expect(within(drawer).getByLabelText('Para quem/qual área?')).toBeVisible()
    expect(within(drawer).getByLabelText('O que foi encaminhado?')).toBeVisible()
    expect(within(drawer).getByLabelText('Próximo passo')).toBeVisible()
  })

  it('exige quem aprovou e o parecer para Aprovado, e recusa sem texto salvo', async () => {
    const { demand } = renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aprovado' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(within(drawer).getByText('Informe quem aprovou ou a área.')).toBeVisible()

    await user.type(within(drawer).getByLabelText('Quem aprovou / área'), 'Coordenação')
    await user.type(within(drawer).getByLabelText('Parecer'), 'Liberado internamente.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(await within(drawer).findByText('Salve o texto do posicionamento antes de registrar a aprovação.')).toBeVisible()
    expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.interactions).toEqual([])

    useLocalDemandStore.getState().savePositioning(demand.id, { body: 'Nota da sessão.' })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.positioning.state).toBe('approved'))
    expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.status).toBe('in_progress')
    expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.interactions.at(-1)?.result).toBe('approved')
  })

  it('exige canal, destinatário e texto na resposta enviada, pré-preenche o corpo e fecha o caso', async () => {
    const { demand, onOpenChange } = renderDrawer('Nota oficial.')
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Resposta enviada' }))
    expect(within(drawer).queryByRole('combobox', { name: 'Tipo de interação' })).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Próximo passo')).not.toBeInTheDocument()
    expect(within(drawer).queryByRole('button', { name: 'Salvar e registrar outra' })).not.toBeInTheDocument()
    expect(within(drawer).getByLabelText('Texto enviado')).toHaveValue('Nota oficial.')
    await user.type(within(drawer).getByLabelText('Canal'), 'E-mail')
    await user.type(within(drawer).getByLabelText('Destinatário'), 'redacao@exemplo.com')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.status).toBe('sent'))
    expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.positioning.state).toBe('sent')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('só encerra sem resposta depois da confirmação explícita', async () => {
    const { demand, onOpenChange } = renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encerrado sem resposta' }))
    await user.type(within(drawer).getByLabelText('Motivo do encerramento'), 'A pauta perdeu atualidade.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(within(drawer).getByText('Confirme o encerramento sem resposta enviada.')).toBeVisible()
    expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.status).toBe('in_progress')

    await user.click(within(drawer).getByRole('checkbox', { name: 'Confirmo o encerramento sem resposta enviada' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(useLocalDemandStore.getState().records.find((item) => item.id === demand.id)?.status).toBe('closed_without_send'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
