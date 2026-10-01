import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { auth } from '@/application/composition'
import { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'

import { useLogin } from './use-login'

const MEMBER_EMAIL = 'ana@imprensa.gov.br'

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
  let fake: FakeAuthRepository

  beforeEach(() => {
    localStorage.clear()
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

  it('pede o código na API e devolve o e-mail normalizado', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useLogin({ onSuccess }), { wrapper })

    act(() => result.current.login('  Ana@Imprensa.gov.br  '))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(MEMBER_EMAIL))
    expect(fake.issuedCodeFor(MEMBER_EMAIL)).toMatch(/^\d{6}$/)
    expect(result.current.isPending).toBe(false)
  })
})
