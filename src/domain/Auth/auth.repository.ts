import type { Session } from './session.entity'

export type VerifyCodeInput = {
  email: string
  code: string
}

export interface AuthRepository {
  requestMagicLink(email: string): Promise<void>
  verify(input: VerifyCodeInput): Promise<Session>
  refreshSession(): Promise<Session>
  logout(): Promise<void>
  getSession(): Promise<Session | null>
  hasStoredToken(): boolean
}
