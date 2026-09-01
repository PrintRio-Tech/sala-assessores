import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLocalDemandStore } from '../stores/local-demand.store'
import { useRegisterInteraction } from './use-register-interaction'

describe('useRegisterInteraction', () => {
  beforeEach(() => useLocalDemandStore.getState().reset())

  it('registra Noel Ferreira como autor atual sem substituir os participantes externos', async () => {
    const demand = useLocalDemandStore.getState().add({
      subject: 'Pedido local', factContext: 'Contexto', pressRequest: 'Pedido', requestedDeadline: '2026-08-28',
      channel: 'Telefone', contactMode: 'local', contactName: 'Maria Clara', contactOutlet: 'Redação',
      journalistId: '', journalistName: 'Maria Clara', outletName: 'Redação',
    })
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useRegisterInteraction(demand.id), { wrapper })

    act(() => result.current.register({
      occurredAt: new Date('2026-08-28T14:30:00.000Z'),
      result: 'waiting_response',
      participants: 'Maria Clara; Redação',
    }))

    await waitFor(() => expect(useLocalDemandStore.getState().records[0]?.interactions).toHaveLength(1))
    expect(useLocalDemandStore.getState().records[0]?.interactions[0]).toEqual(expect.objectContaining({
      recordedBy: 'Noel Ferreira',
      participants: 'Maria Clara; Redação',
    }))
  })
})
