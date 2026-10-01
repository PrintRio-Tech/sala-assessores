import { describe, expect, it, vi } from 'vitest'

import type { AuthRepository } from '../auth.repository'
import { InvalidEmailError } from '../errors/auth.errors'
import type { Session } from '../session.entity'
import type { User } from '../user.entity'
import { RequestMagicLink } from './request-magic-link.use-case'

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
  requestMagicLink = vi.fn(async () => undefined),
): AuthRepository {
  return {
    requestMagicLink,
    verify: async () => session(),
    refreshSession: async () => session(),
    logout: async () => undefined,
    getSession: async () => null,
    hasStoredToken: () => false,
  }
}

describe('RequestMagicLink', () => {
  it('normaliza o e-mail antes de pedir o código', async () => {
    const requestMagicLink = vi.fn(async () => undefined)
    const useCase = new RequestMagicLink(repository(requestMagicLink))

    await useCase.execute('  Ana@Imprensa.GOV.br  ')

    expect(requestMagicLink).toHaveBeenCalledWith('ana@imprensa.gov.br')
  })

  it('rejeita e-mail inválido sem chamar o repositório', async () => {
    const requestMagicLink = vi.fn(async () => undefined)
    const useCase = new RequestMagicLink(repository(requestMagicLink))

    expect(() => useCase.execute('ana')).toThrow(InvalidEmailError)
    expect(requestMagicLink).not.toHaveBeenCalled()
  })
})
