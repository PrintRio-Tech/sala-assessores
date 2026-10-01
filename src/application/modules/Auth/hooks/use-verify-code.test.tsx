import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { auth } from '@/application/composition'
import { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'

import { useVerifyCode } from './use-verify-code'

const MEMBER_EMAIL = 'ana@imprensa.gov.br'

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useVerifyCode', () => {
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

  it('autentica só com o OTP emitido, não com qualquer 6 dígitos', async () => {
    await auth.service.requestMagicLink(MEMBER_EMAIL)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useVerifyCode({ onSuccess }), { wrapper })

    act(() => result.current.verify({ code: '000000', email: MEMBER_EMAIL }))
    await waitFor(() => expect(result.current.error?.message).toMatch(/inválido/i))
    expect(onSuccess).not.toHaveBeenCalled()
    expect(auth.service.hasStoredToken()).toBe(false)

    act(() =>
      result.current.verify({
        code: fake.issuedCodeFor(MEMBER_EMAIL)!,
        email: MEMBER_EMAIL,
      }),
    )
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(auth.service.hasStoredToken()).toBe(true)
    expect(result.current.isPending).toBe(false)
  })
})
