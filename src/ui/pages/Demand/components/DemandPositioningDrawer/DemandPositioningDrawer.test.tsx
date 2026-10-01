import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { demandService } from '@/application/composition'
import { currentUser } from '@/application/current-user'
import { captureDemand } from '@/test/demand-fixtures'
import { DemandPositioningDrawer } from './index'

async function renderDrawer(initialBody = '', onOpenChange = vi.fn()) {
  const demand = await captureDemand({
    subject: 'Caso local',
    factContext: 'Fato.',
    pressRequest: 'Pedido.',
    contactName: 'Contato',
    contactOutlet: 'Redação',
    journalistName: 'Contato',
    outletName: 'Redação',
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <DemandPositioningDrawer
        demandId={demand.id}
        demandCode={demand.code}
        demandTitle={demand.title}
        initialBody={initialBody}
        open
        onOpenChange={onOpenChange}
      />
    </QueryClientProvider>,
  )
  return { demand, onOpenChange }
}

describe('DemandPositioningDrawer', () => {
  it('exige o corpo e grava uma versão com o autor atual', async () => {
    const { demand, onOpenChange } = await renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Escrever posicionamento' })

    await user.click(within(drawer).getByRole('button', { name: 'Salvar versão' }))
    expect(within(drawer).getByRole('alert')).toHaveTextContent('Inclua o arquivo, o texto, ou os dois.')
    expect((await demandService.getById(demand.id)).positioning?.state).toBe('empty')

    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Texto do posicionamento' }), {
      target: { value: 'Nota oficial da sessão.' },
    })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar versão' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect((await demandService.getById(demand.id)).positioning).toEqual(
      expect.objectContaining({
        state: 'draft',
        versions: [expect.objectContaining({
          body: 'Nota oficial da sessão.',
          author: currentUser.name,
        })],
      }),
    )
  })

  it('fecha de verdade após salvar, mesmo com o formulário dirty', async () => {
    const onOpenChange = vi.fn()
    await renderDrawer('', onOpenChange)
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Escrever posicionamento' })

    fireEvent.change(within(drawer).getByRole('textbox', { name: 'Texto do posicionamento' }), {
      target: { value: 'Versão para fechar o drawer.' },
    })
    await user.click(within(drawer).getByRole('button', { name: 'Salvar versão' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(screen.queryByRole('dialog', { name: 'Descartar alterações?' })).not.toBeInTheDocument()
  })

  it('salva só com anexo e aceita texto junto', async () => {
    const { demand, onOpenChange } = await renderDrawer()
    const user = userEvent.setup()
    const drawer = screen.getByRole('dialog', { name: 'Escrever posicionamento' })
    const file = new File(['nota'], 'nota-oficial.pdf', { type: 'application/pdf' })

    await user.upload(within(drawer).getByLabelText('Anexo do posicionamento'), file)
    await user.click(within(drawer).getByRole('button', { name: 'Salvar versão' }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect((await demandService.getById(demand.id)).positioning?.versions.at(-1)).toEqual(
      expect.objectContaining({
        body: '',
        attachment: expect.objectContaining({
          filename: 'nota-oficial.pdf',
          contentType: 'application/pdf',
          sizeBytes: file.size,
        }),
      }),
    )
  })
})
