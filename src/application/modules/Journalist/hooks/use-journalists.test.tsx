import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { useJournalists } from './use-journalists'

describe('useJournalists', () => {
  it.each([
    ['carolina', 'Carolina Montenegro'],
    ['technews', 'Maria Clara'],
    ['tecnologia', 'Maria Clara'],
    ['repórter especial', 'Carolina Montenegro'],
    ['maria.clara@technews.com', 'Maria Clara'],
  ])('faz busca livre pelos campos pesquisáveis: %s', async (search, expectedName) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useJournalists({ search }), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.map((journalist) => journalist.name)).toEqual([expectedName])
  })

  it('combina veículo, editoria, cargo, status, canal e tema', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useJournalists({
      outletName: 'TechNews',
      desk: 'Tecnologia',
      roleTitle: 'Repórter de Tecnologia',
      status: 'active',
      preferredChannel: 'email',
      topic: 'Startups',
    }), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.map((journalist) => journalist.name)).toEqual(['Maria Clara'])
    expect(result.current.filterOptions.outletNames).toEqual(['TechNews', 'Valor Econômico'])
    expect(result.current.filterOptions.desks).toEqual(['Economia', 'Tecnologia'])
  })

  it.each([
    [{ outletName: 'Valor Econômico' }, ['Carolina Montenegro']],
    [{ desk: 'Economia' }, ['Carolina Montenegro']],
    [{ roleTitle: 'Repórter Especial' }, ['Carolina Montenegro']],
    [{ status: 'active' as const }, ['Carolina Montenegro', 'Maria Clara']],
    [{ preferredChannel: 'email' as const }, ['Maria Clara']],
    [{ topic: 'Startups' }, ['Maria Clara']],
  ])('aplica filtro individual %o', async (filters, expectedNames) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useJournalists(filters), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data.map((journalist) => journalist.name)).toEqual(expectedNames)
  })
})
