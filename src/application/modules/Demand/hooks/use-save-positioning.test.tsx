import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { currentUser } from '@/application/current-user'
import { useLocalDemandStore } from '../stores/local-demand.store'
import { useSavePositioning } from './use-save-positioning'

describe('useSavePositioning', () => {
  beforeEach(() => useLocalDemandStore.getState().reset())

  it('grava o texto com o autor atual e persiste na sessão local', async () => {
    const demand = useLocalDemandStore.getState().add({
      subject: 'Pedido local', factContext: 'Contexto', pressRequest: 'Pedido', requestedDeadline: '2026-08-28',
      channel: 'Telefone', contactMode: 'local', contactName: 'Maria Clara', contactOutlet: 'Redação',
      journalistId: '', journalistName: 'Maria Clara', outletName: 'Redação',
    })
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useSavePositioning(demand.id), { wrapper })

    act(() => result.current.save({ body: 'Nota da sessão.' }))

    await waitFor(() => expect(useLocalDemandStore.getState().records[0]?.positioning.versions).toHaveLength(1))
    expect(useLocalDemandStore.getState().records[0]?.positioning).toEqual(expect.objectContaining({
      state: 'draft',
      versions: [expect.objectContaining({
        body: 'Nota da sessão.',
        author: currentUser.name,
      })],
    }))
  })
})
