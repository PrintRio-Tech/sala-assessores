import { describe, expect, it, vi } from 'vitest'

import type { AuthRepository, VerifyCodeInput } from '../auth.repository'
import { InvalidEmailError, InvalidMagicLinkError } from '../errors/auth.errors'
import type { Session } from '../session.entity'
import type { User } from '../user.entity'
import { VerifyMagicLink } from './verify-magic-link.use-case'

const user: User = {
  id: 'user-1',
  personId: 'person-1',
  email: 'ana@imprensa.gov.br',
  emails: ['ana@imprensa.gov.br'],
  name: 'Ana',
  role: 'advisor',
  app: 'imprensa',
  isAdmin: false,
}

function session(): Session {
  return {
    user,
    token: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date('2026-09-22T23:00:00.000Z'),
  }
}

function repository(
  verify = vi.fn(async (_input: VerifyCodeInput) => session()),
): AuthRepository {
  return {
    requestMagicLink: async () => undefined,
    verify,
    refreshSession: async () => session(),
    logout: async () => undefined,
    getSession: async () => null,
    hasStoredToken: () => false,
  }
}

describe('VerifyMagicLink', () => {
  it('envia e-mail normalizado e o OTP de 6 dígitos', async () => {
    const verify = vi.fn(async () => session())
    const useCase = new VerifyMagicLink(repository(verify))

    await useCase.execute({ email: '  Ana@Imprensa.GOV.br  ', code: '482913' })

    expect(verify).toHaveBeenCalledWith({
      email: 'ana@imprensa.gov.br',
      code: '482913',
    })
  })

  it('rejeita código que não tem 6 dígitos sem chamar o repositório', async () => {
    const verify = vi.fn(async () => session())
    const useCase = new VerifyMagicLink(repository(verify))

    expect(() =>
      useCase.execute({ email: 'ana@imprensa.gov.br', code: '12345' }),
    ).toThrow(InvalidMagicLinkError)
    expect(() =>
      useCase.execute({ email: 'ana@imprensa.gov.br', code: 'abcdef' }),
    ).toThrow(InvalidMagicLinkError)
    expect(verify).not.toHaveBeenCalled()
  })

  it('rejeita e-mail inválido', async () => {
    const verify = vi.fn(async () => session())
    const useCase = new VerifyMagicLink(repository(verify))

    expect(() => useCase.execute({ email: 'ana', code: '123456' })).toThrow(
      InvalidEmailError,
    )
    expect(verify).not.toHaveBeenCalled()
  })
})
