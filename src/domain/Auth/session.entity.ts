import type { User } from './user.entity'

export interface Session {
  user: User
  token: string
  refreshToken: string
  expiresAt: Date
}
