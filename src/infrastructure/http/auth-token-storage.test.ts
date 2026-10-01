import { beforeEach, describe, expect, it } from 'vitest'

import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  hasStoredAuthTokens,
  persistSessionTokens,
} from './auth-token-storage'

describe('auth-token-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persiste access e refresh em chaves da Sala', () => {
    persistSessionTokens({ token: 'access-1', refreshToken: 'refresh-1' })

    expect(AUTH_TOKEN_KEY).toBe('sala_assessores_auth_token')
    expect(AUTH_REFRESH_TOKEN_KEY).toBe('sala_assessores_refresh_token')
    expect(getAuthToken()).toBe('access-1')
    expect(getRefreshToken()).toBe('refresh-1')
    expect(hasStoredAuthTokens()).toBe(true)
  })

  it('limpa os dois tokens no logout local', () => {
    persistSessionTokens({ token: 'access-1', refreshToken: 'refresh-1' })
    clearAuthTokens()

    expect(getAuthToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(hasStoredAuthTokens()).toBe(false)
  })
})
