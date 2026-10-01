import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { demandService } from '@/application/composition'
import { currentUser } from '@/application/current-user'
import { captureDemand } from '@/test/demand-fixtures'
import { useSavePositioning } from './use-save-positioning'

describe('useSavePositioning', () => {
  it('grava o texto com o autor atual e persiste no repositório', async () => {
    const demand = await captureDemand()
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useSavePositioning(demand.id), { wrapper })

    act(() => result.current.save({ body: 'Nota da sessão.' }))

    await waitFor(async () => {
      expect((await demandService.getById(demand.id)).positioning?.versions).toHaveLength(1)
    })
    expect((await demandService.getById(demand.id)).positioning).toEqual(expect.objectContaining({
      state: 'draft',
      versions: [expect.objectContaining({
        body: 'Nota da sessão.',
        author: currentUser.name,
      })],
    }))
  })
})
