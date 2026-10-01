import { beforeEach, describe, expect, it } from 'vitest'

import { AuthService } from '@/application/modules/Auth/service/auth.service'
import {
  AuthRateLimitedError,
  InvalidMagicLinkError,
  SessionExpiredError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'
import { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'

import {
  clearAuthTokens,
  hasStoredAuthTokens,
} from '@/infrastructure/http/auth-token-storage'

const MEMBER_EMAIL = 'ana@imprensa.gov.br'

describe('fluxo de auth com fake API coerente', () => {
  let fake: FakeAuthRepository
  let auth: AuthService

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
    auth = new AuthService(fake)
  })

  it('aceita request de e-mail desconhecido (anti-enum) e recusa qualquer OTP de 6 dígitos', async () => {
    await expect(auth.requestMagicLink('fantasma@imprensa.gov.br')).resolves.toBeUndefined()

    await expect(
      auth.verify({ email: 'fantasma@imprensa.gov.br', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidMagicLinkError)
    expect(hasStoredAuthTokens()).toBe(false)
  })

  it('só autentica o OTP emitido para aquele e-mail, não qualquer 6 dígitos', async () => {
    await auth.requestMagicLink(MEMBER_EMAIL)

    await expect(
      auth.verify({ email: MEMBER_EMAIL, code: '000000' }),
    ).rejects.toBeInstanceOf(InvalidMagicLinkError)

    const issued = fake.issuedCodeFor(MEMBER_EMAIL)
    expect(issued).toMatch(/^\d{6}$/)
    expect(issued).not.toBe('000000')

    const session = await auth.verify({ email: MEMBER_EMAIL, code: issued! })
    expect(session.user.email).toBe(MEMBER_EMAIL)
    expect(session.user.app).toBe('imprensa')
    expect(hasStoredAuthTokens()).toBe(true)
    expect(auth.hasStoredToken()).toBe(true)
  })

  it('no resend invalida o código anterior', async () => {
    await auth.requestMagicLink(MEMBER_EMAIL)
    const first = fake.issuedCodeFor(MEMBER_EMAIL)!
    await auth.requestMagicLink(MEMBER_EMAIL)
    const second = fake.issuedCodeFor(MEMBER_EMAIL)!
    expect(second).not.toBe(first)

    await expect(
      auth.verify({ email: MEMBER_EMAIL, code: first }),
    ).rejects.toBeInstanceOf(InvalidMagicLinkError)

    const session = await auth.verify({ email: MEMBER_EMAIL, code: second })
    expect(session.user.email).toBe(MEMBER_EMAIL)
  })

  it('expõe a sessão, rotaciona o refresh e limpa no logout', async () => {
    await auth.requestMagicLink(MEMBER_EMAIL)
    await auth.verify({ email: MEMBER_EMAIL, code: fake.issuedCodeFor(MEMBER_EMAIL)! })

    const current = await auth.getSession()
    expect(current?.user.email).toBe(MEMBER_EMAIL)

    const rotated = await auth.refreshSession()
    expect(rotated.refreshToken).not.toBe(current?.refreshToken)
    expect(rotated.token).not.toBe(current?.token)
    expect((await auth.getSession())?.user.email).toBe(MEMBER_EMAIL)

    await auth.logoutUser()
    expect(hasStoredAuthTokens()).toBe(false)
    expect(await auth.getSession()).toBeNull()
  })

  it('propaga rate limit e indisponibilidade sem autenticar', async () => {
    fake.rateLimit(MEMBER_EMAIL)
    await expect(auth.requestMagicLink(MEMBER_EMAIL)).rejects.toBeInstanceOf(
      AuthRateLimitedError,
    )

    fake.clearRateLimit()
    fake.goUnavailable()
    await expect(auth.requestMagicLink(MEMBER_EMAIL)).rejects.toBeInstanceOf(
      SessionUnavailableError,
    )
    expect(hasStoredAuthTokens()).toBe(false)
  })

  it('refresh revogado limpa a sessão', async () => {
    await auth.requestMagicLink(MEMBER_EMAIL)
    await auth.verify({ email: MEMBER_EMAIL, code: fake.issuedCodeFor(MEMBER_EMAIL)! })
    fake.revokeRefresh()

    await expect(auth.refreshSession()).rejects.toBeInstanceOf(SessionExpiredError)
    expect(hasStoredAuthTokens()).toBe(false)
    clearAuthTokens()
  })
})
