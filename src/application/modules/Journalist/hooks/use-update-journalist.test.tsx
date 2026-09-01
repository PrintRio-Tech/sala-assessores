import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { journalistService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { Paginated } from '@/domain/Journalist/journalist.repository'
import { useUpdateJournalist } from './use-update-journalist'

const base: Journalist = {
  id: 'j-1', name: 'Maria', roleTitle: 'Repórter', outletName: 'Jornal', desk: 'Cidades', email: 'maria@jornal.test', phone: '', preferredChannel: 'email', bestContactWindow: 'Tarde', topics: [], isActive: true,
  objectiveStats: { totalDemands: 1, solicitedCount: 1, proactiveCount: 0, successRate: 1, positioningUsageRate: 1 }, demandHistory: [], relationshipEvaluations: [],
}

describe('useUpdateJournalist', () => {
  it('substitui o mesmo ID no detalhe e na lista preservando total e ordem', async () => {
    const updated = { ...base, name: 'Maria Editada' }
    const spy = vi.spyOn(journalistService, 'update').mockResolvedValue(updated)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    const other = { ...base, id: 'j-2', name: 'Outro' }
    client.setQueryData<Paginated<Journalist>>(queryKeys.journalists, { items: [other, base], total: 2 })
    client.setQueryData(queryKeys.journalist(base.id), base)
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useUpdateJournalist(base.id, { onSuccess }), { wrapper })

    act(() => result.current.update({ ...base, name: ' Maria Editada ' }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(updated))

    expect(client.getQueryData(queryKeys.journalist(base.id))).toEqual(updated)
    expect(client.getQueryData<Paginated<Journalist>>(queryKeys.journalists)).toEqual({ items: [other, updated], total: 2 })
    spy.mockRestore()
  })
})
