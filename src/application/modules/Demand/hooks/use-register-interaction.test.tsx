import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { demandService } from '@/application/composition'
import { captureDemand } from '@/test/demand-fixtures'
import { interactionClosesCase, useRegisterInteraction } from './use-register-interaction'

describe('interactionClosesCase', () => {
  it('encerra o caso apenas para resposta enviada ou encerramento sem envio', () => {
    expect(interactionClosesCase('response_sent')).toBe(true)
    expect(interactionClosesCase('closed_without_send')).toBe(true)
    expect(interactionClosesCase('waiting_response')).toBe(false)
    expect(interactionClosesCase('approved')).toBe(false)
    expect(interactionClosesCase('')).toBe(false)
  })
})

describe('useRegisterInteraction', () => {
  it('registra Noel Ferreira como autor atual sem substituir os participantes externos', async () => {
    const demand = await captureDemand()
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useRegisterInteraction(demand.id), { wrapper })

    act(() => result.current.register({
      occurredAt: new Date('2026-08-28T14:30:00.000Z'),
      result: 'waiting_response',
      participants: 'Maria Clara; Redação',
    }))

    await waitFor(async () => {
      expect((await demandService.getById(demand.id)).interactions).toHaveLength(1)
    })
    expect((await demandService.getById(demand.id)).interactions[0]).toEqual(expect.objectContaining({
      recordedBy: 'Noel Ferreira',
      participants: 'Maria Clara; Redação',
    }))
  })
})
