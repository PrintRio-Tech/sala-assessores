export const AUTH_TOKEN_KEY = 'sala_assessores_auth_token'
export const AUTH_REFRESH_TOKEN_KEY = 'sala_assessores_refresh_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
  localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
}

export function hasStoredAuthTokens(): boolean {
  return getAuthToken() !== null || getRefreshToken() !== null
}

export function persistSessionTokens(session: {
  token: string
  refreshToken: string
}): void {
  setAuthTokens(session.token, session.refreshToken)
}
