import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { journalistService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { Paginated } from '@/domain/Journalist/journalist.repository'
import { useCreateJournalist } from './use-create-journalist'

describe('useCreateJournalist', () => {
  it('atualiza lista e detalhe no cache sem reload após criar na sessão', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    await client.prefetchQuery({ queryKey: queryKeys.journalists, queryFn: () => journalistService.list() })
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateJournalist({ onSuccess }), { wrapper })

    act(() => result.current.create({
      name: 'Joana Cache', roleTitle: '', outletName: 'Jornal Teste', desk: '',
      email: 'joana-cache@jornal.test', phone: '', preferredChannel: 'email',
      bestContactWindow: 'Das 9h às 11h',
      topics: [], isActive: true,
    }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    const created = onSuccess.mock.calls[0]?.[0] as Journalist
    expect(created.bestContactWindow).toBe('Das 9h às 11h')
    const list = client.getQueryData<Paginated<Journalist>>(queryKeys.journalists)
    expect(list?.items[0]).toEqual(created)
    expect(list?.total).toBe(3)
    expect(client.getQueryData(queryKeys.journalist(created.id))).toEqual(created)
  })
})
