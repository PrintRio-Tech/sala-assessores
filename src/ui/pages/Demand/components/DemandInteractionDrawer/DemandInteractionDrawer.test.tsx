import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { demandService } from '@/application/composition'
import { currentUser } from '@/application/current-user'
import { captureDemand } from '@/test/demand-fixtures'
import { DemandInteractionDrawer } from './index'

afterEach(() => {
  cleanup()
})

async function renderDrawer(positioningBody = '', onOpenChange = vi.fn()) {
  const demand = await captureDemand({
    subject: 'Caso local',
    factContext: 'Fato.',
    pressRequest: 'Pedido.',
    contactName: 'Contato',
    contactOutlet: 'Redação',
    journalistName: 'Contato',
    outletName: 'Redação',
  })
  if (positioningBody) {
    await demandService.savePositioning(demand.id, { body: positioningBody, author: currentUser.name })
  }
  const latest = await demandService.getById(demand.id)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <DemandInteractionDrawer
        demandId={demand.id}
        demandCode={demand.code}
        demandTitle={demand.title}
        positioningBody={latest.positioning?.versions.at(-1)?.body ?? ''}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  )
  return { demand, onOpenChange }
}

describe('DemandInteractionDrawer', () => {
  it('não pede versão ao registrar encaminhamento', async () => {
    await renderDrawer()
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
    const { demand } = await renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Aprovado' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(within(drawer).getByText('Informe quem aprovou ou a área.')).toBeVisible()

    await user.type(within(drawer).getByLabelText('Quem aprovou / área'), 'Coordenação')
    await user.type(within(drawer).getByLabelText('Parecer'), 'Liberado internamente.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(await within(drawer).findByText('Salve o posicionamento (texto ou anexo) antes de registrar a aprovação.')).toBeVisible()
    expect((await demandService.getById(demand.id)).interactions).toEqual([])

    await demandService.savePositioning(demand.id, { body: 'Nota da sessão.', author: currentUser.name })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    await waitFor(async () => {
      expect((await demandService.getById(demand.id)).positioning?.state).toBe('approved')
    })
    expect((await demandService.getById(demand.id)).status).toBe('in_progress')
    expect((await demandService.getById(demand.id)).interactions.at(-1)?.result).toBe('approved')
  })

  it('exige canal, destinatário e texto na resposta enviada, pré-preenche o corpo e fecha o caso', async () => {
    const { demand, onOpenChange } = await renderDrawer('Nota oficial.')
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

    await waitFor(async () => {
      expect((await demandService.getById(demand.id)).status).toBe('sent')
    })
    expect((await demandService.getById(demand.id)).positioning?.state).toBe('sent')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('só encerra sem resposta depois da confirmação explícita', async () => {
    const { demand, onOpenChange } = await renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Registrar interação' })

    await user.click(within(drawer).getByRole('combobox', { name: 'Resultado da interação' }))
    await user.click(await screen.findByRole('option', { name: 'Encerrado sem resposta' }))
    await user.type(within(drawer).getByLabelText('Motivo do encerramento'), 'A pauta perdeu atualidade.')
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))
    expect(within(drawer).getByText('Confirme o encerramento sem resposta enviada.')).toBeVisible()
    expect((await demandService.getById(demand.id)).status).toBe('in_progress')

    await user.click(within(drawer).getByRole('checkbox', { name: 'Confirmo o encerramento sem resposta enviada' }))
    await user.click(within(drawer).getByRole('button', { name: 'Salvar' }))

    await waitFor(async () => {
      expect((await demandService.getById(demand.id)).status).toBe('closed_without_send')
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
