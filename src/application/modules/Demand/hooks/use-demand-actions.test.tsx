import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { demandService } from '@/application/composition'
import { captureDemand, defaultDemandCapture } from '@/test/demand-fixtures'
import { useDemandActions } from './use-demand-actions'

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useDemandActions', () => {
  it('captura uma demanda no repositório e notifica o sucesso', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDemandActions(), { wrapper })

    act(() => {
      result.current.capture(defaultDemandCapture, { onSuccess })
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    const created = onSuccess.mock.calls[0]?.[0]
    expect(created?.title).toBe('Pedido local')
    expect(await demandService.getById(created.id)).toEqual(created)
  })

  it('revisa uma demanda existente pelo id', async () => {
    const existing = await demandService.getById('d-regulacao')
    const { result } = renderHook(() => useDemandActions(), { wrapper })

    act(() => {
      result.current.revise(existing!, {
        ...defaultDemandCapture,
        subject: 'Título revisado',
        journalistId: existing!.journalistId,
        journalistName: existing!.journalistName,
        outletName: existing!.outletName,
        contactMode: 'known',
        contactName: existing!.journalistName,
        contactOutlet: existing!.outletName,
      })
    })

    await waitFor(async () => {
      expect((await demandService.getById(existing!.id))?.title).toBe('Título revisado')
    })
  })

  it('remove a demanda do repositório', async () => {
    const existing = await captureDemand({ subject: 'Para remover' })
    const onRemoved = vi.fn()
    const { result } = renderHook(() => useDemandActions(), { wrapper })

    act(() => {
      result.current.remove(existing.id, { onSuccess: onRemoved })
    })

    await waitFor(() => expect(onRemoved).toHaveBeenCalled())
    await expect(demandService.getById(existing.id)).rejects.toThrow()
  })
})
