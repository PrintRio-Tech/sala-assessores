import { describe, expect, it } from 'vitest'

import {
  AuthRateLimitedError,
  InvalidEmailError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'

import { diagnoseMagicLinkRequestError } from './otp-resend-diagnostics'

describe('diagnoseMagicLinkRequestError', () => {
  it('não revela se o e-mail existe no rate limit', () => {
    const diag = diagnoseMagicLinkRequestError(new AuthRateLimitedError(), 'request')
    expect(diag.kind).toBe('RATE_LIMITED')
    expect(diag.toast.description).not.toMatch(/cadastrad|inexistent|encontr/i)
    expect(JSON.stringify(diag)).not.toContain('@')
  })

  it('trata indisponibilidade e rede sem enumerar o e-mail', () => {
    const unavailable = diagnoseMagicLinkRequestError(
      new SessionUnavailableError(),
      'request',
    )
    expect(unavailable.kind).toBe('UNAVAILABLE')
    expect(unavailable.toast.title).toBe('Não foi possível enviar')

    const network = diagnoseMagicLinkRequestError(new TypeError('Failed to fetch'), 'resend')
    expect(network.kind).toBe('NETWORK')
    expect(network.toast.title).toBe('Falha ao reenviar')
  })

  it('deixa e-mail inválido como validação de formulário', () => {
    const diag = diagnoseMagicLinkRequestError(new InvalidEmailError(), 'request')
    expect(diag.kind).toBe('VALIDATION')
  })
})
