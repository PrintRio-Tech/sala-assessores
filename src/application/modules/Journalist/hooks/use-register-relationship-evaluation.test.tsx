import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { journalistService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { Paginated } from '@/domain/Journalist/journalist.repository'
import { useRegisterRelationshipEvaluation } from './use-register-relationship-evaluation'

const base: Journalist = {
  id: 'j-1', name: 'Maria', roleTitle: '', outletName: 'Jornal', desk: '', email: 'maria@jornal.test', phone: '', preferredChannel: 'email', bestContactWindow: '', topics: [], isActive: true,
  objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 }, demandHistory: [], relationshipEvaluations: [],
}

describe('useRegisterRelationshipEvaluation', () => {
  it('sincroniza a nova avaliação no detalhe e no mesmo item da lista', async () => {
    const evaluation = { id: 'e-1', authorName: 'Ana', recordedAt: new Date('2026-08-27'), score: 4, traits: ['Direta'], editorialToneLabel: 'Imparcial', notes: 'Registro.' }
    const updated = { ...base, relationshipEvaluations: [evaluation] }
    const spy = vi.spyOn(journalistService, 'registerEvaluation').mockResolvedValue(updated)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    client.setQueryData<Paginated<Journalist>>(queryKeys.journalists, { items: [base], total: 1 })
    client.setQueryData(queryKeys.journalist(base.id), base)
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useRegisterRelationshipEvaluation(base.id), { wrapper })

    act(() => result.current.register({ ...evaluation, id: undefined } as never))
    await waitFor(() => expect(result.current.isPending).toBe(false))

    expect(client.getQueryData(queryKeys.journalist(base.id))).toEqual(updated)
    expect(client.getQueryData<Paginated<Journalist>>(queryKeys.journalists)).toEqual({ items: [updated], total: 1 })
    spy.mockRestore()
  })
})
