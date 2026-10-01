import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/application/composition'
import { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'

import { useSession } from './use-session'

const MEMBER_EMAIL = 'ana@imprensa.gov.br'

let queryClient: QueryClient

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useSession', () => {
  let fake: FakeAuthRepository

  beforeEach(() => {
    localStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    fake = new FakeAuthRepository({
      members: [
        {
          id: 'user-1',
          personId: 'person-1',
          email: MEMBER_EMAIL,
          emails: [MEMBER_EMAIL],
          name: 'Ana',
          role: 'advisor',
          app: 'imprensa',
          isAdmin: false,
        },
      ],
    })
    auth.use(fake)
  })

  it('expõe sessão vazia quando não autenticado', () => {
    const { result } = renderHook(() => useSession(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.session).toBeNull()
  })

  it('expõe a sessão real e permite sair pelo logout da API', async () => {
    await auth.service.requestMagicLink(MEMBER_EMAIL)
    await auth.service.verify({
      email: MEMBER_EMAIL,
      code: fake.issuedCodeFor(MEMBER_EMAIL)!,
    })

    const { result } = renderHook(() => useSession(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    expect(result.current.session).toEqual({
      email: MEMBER_EMAIL,
      name: 'Ana',
    })

    act(() => result.current.logout())
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false))
    expect(auth.service.hasStoredToken()).toBe(false)
  })

  it('expõe nome nulo quando a sessão real não tem nome, sem fallback de e-mail', async () => {
    fake = new FakeAuthRepository({
      members: [
        {
          id: 'user-2',
          personId: 'person-2',
          email: MEMBER_EMAIL,
          emails: [MEMBER_EMAIL],
          name: null,
          role: 'advisor',
          app: 'imprensa',
          isAdmin: false,
        },
      ],
    })
    auth.use(fake)

    await auth.service.requestMagicLink(MEMBER_EMAIL)
    await auth.service.verify({
      email: MEMBER_EMAIL,
      code: fake.issuedCodeFor(MEMBER_EMAIL)!,
    })

    const { result } = renderHook(() => useSession(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    expect(result.current.session).toEqual({
      email: MEMBER_EMAIL,
      name: null,
    })
  })
})
