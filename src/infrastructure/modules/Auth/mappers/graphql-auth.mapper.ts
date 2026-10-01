import type { Session } from '@/domain/Auth/session.entity'
import type { User } from '@/domain/Auth/user.entity'

import {
  graphqlSessionDtoSchema,
  type GraphQLSessionDto,
  type GraphQLUserDto,
} from '../DTOs/graphql-auth.dto'

export function fromGraphQLUser(user: GraphQLUserDto): User {
  return {
    id: user.id,
    personId: user.personId,
    email: user.email,
    emails: [...user.emails],
    name: user.name,
    role: user.role,
    app: user.app,
    isAdmin: user.isAdmin,
  }
}

export function fromGraphQLSession(session: GraphQLSessionDto): Session {
  const parsed = graphqlSessionDtoSchema.parse(session)

  return {
    user: fromGraphQLUser(parsed.user),
    token: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }
}
