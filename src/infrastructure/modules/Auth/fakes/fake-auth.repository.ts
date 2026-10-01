import type { AuthRepository, VerifyCodeInput } from '@/domain/Auth/auth.repository'
import type { Session } from '@/domain/Auth/session.entity'
import type { User } from '@/domain/Auth/user.entity'
import {
  AuthRateLimitedError,
  InvalidMagicLinkError,
  SessionExpiredError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  hasStoredAuthTokens,
  persistSessionTokens,
} from '@/infrastructure/http/auth-token-storage'

const ACCESS_TTL_MS = 15 * 60 * 1000

export type FakeAuthRepositoryOptions = {
  members?: User[]
}

export class FakeAuthRepository implements AuthRepository {
  private readonly members = new Map<string, User>()
  private readonly issuedCodes = new Map<string, string>()
  private readonly sessions = new Map<
    string,
    { user: User; accessToken: string }
  >()
  private rateLimited = new Set<string>()
  private unavailable = false
  private codeSequence = 0
  private tokenSequence = 0

  constructor(options: FakeAuthRepositoryOptions = {}) {
    for (const member of options.members ?? []) {
      this.members.set(member.email, member)
    }
  }

  issuedCodeFor(email: string): string | undefined {
    return this.issuedCodes.get(email.trim().toLowerCase())
  }

  rateLimit(email: string) {
    this.rateLimited.add(email.trim().toLowerCase())
  }

  clearRateLimit() {
    this.rateLimited.clear()
  }

  goUnavailable() {
    this.unavailable = true
  }

  goAvailable() {
    this.unavailable = false
  }

  revokeRefresh() {
    this.sessions.clear()
  }

  async requestMagicLink(email: string): Promise<void> {
    this.assertAvailable()
    if (this.rateLimited.has(email)) {
      throw new AuthRateLimitedError()
    }
    this.codeSequence += 1
    const code = String(100000 + (this.codeSequence % 900000))
    this.issuedCodes.set(email, code)
  }

  async verify(input: VerifyCodeInput): Promise<Session> {
    this.assertAvailable()
    const expected = this.issuedCodes.get(input.email)
    const member = this.members.get(input.email)
    if (!member || !expected || expected !== input.code) {
      throw new InvalidMagicLinkError()
    }
    this.issuedCodes.delete(input.email)
    return this.storeSession(this.buildSession(member))
  }

  async refreshSession(): Promise<Session> {
    this.assertAvailable()
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new SessionExpiredError()
    }
    const current = this.sessions.get(refreshToken)
    if (!current) {
      clearAuthTokens()
      throw new SessionExpiredError()
    }
    this.sessions.delete(refreshToken)
    return this.storeSession(this.buildSession(current.user))
  }

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken()
    clearAuthTokens()
    if (refreshToken) this.sessions.delete(refreshToken)
  }

  hasStoredToken(): boolean {
    return hasStoredAuthTokens()
  }

  async getSession(): Promise<Session | null> {
    this.assertAvailable()
    const accessToken = getAuthToken()
    const refreshToken = getRefreshToken()
    if (!accessToken && !refreshToken) return null

    if (refreshToken) {
      const current = this.sessions.get(refreshToken)
      if (current && accessToken === current.accessToken) {
        return {
          user: current.user,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + ACCESS_TTL_MS),
        }
      }
      try {
        return await this.refreshSession()
      } catch (error) {
        if (error instanceof SessionUnavailableError) throw error
        clearAuthTokens()
        return null
      }
    }

    clearAuthTokens()
    return null
  }

  private assertAvailable() {
    if (this.unavailable) throw new SessionUnavailableError()
  }

  private buildSession(user: User): Session {
    this.tokenSequence += 1
    return {
      user,
      token: `access-${this.tokenSequence}`,
      refreshToken: `refresh-${this.tokenSequence}`,
      expiresAt: new Date(Date.now() + ACCESS_TTL_MS),
    }
  }

  private storeSession(session: Session): Session {
    persistSessionTokens(session)
    this.sessions.set(session.refreshToken, {
      user: session.user,
      accessToken: session.token,
    })
    return session
  }
}
