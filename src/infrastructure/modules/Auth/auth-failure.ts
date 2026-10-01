import {
  AuthForbiddenError,
  AuthRateLimitedError,
  InvalidEmailError,
  InvalidMagicLinkError,
  SessionExpiredError,
  SessionUnavailableError,
} from '@/domain/Auth/errors/auth.errors'

type GraphqlErrorLike = {
  errors?: Array<{
    extensions?: { code?: unknown; metadata?: { code?: unknown } }
  }>
}

export type AuthFailureKind = 'revoked' | 'unavailable' | 'rate_limited' | 'invalid'

function graphqlCodes(error: unknown): string[] {
  if (typeof error !== 'object' || error === null) return []
  const errors = (error as GraphqlErrorLike).errors
  if (!Array.isArray(errors)) return []
  return errors.flatMap((item) => {
    const code = item.extensions?.code
    const metadata = item.extensions?.metadata?.code
    return [code, metadata].filter((value): value is string => typeof value === 'string')
  })
}

export function classifyAuthFailure(error: unknown): AuthFailureKind {
  if (error instanceof AuthRateLimitedError) return 'rate_limited'
  if (error instanceof SessionUnavailableError) return 'unavailable'
  if (error instanceof SessionExpiredError || error instanceof AuthForbiddenError) {
    return 'revoked'
  }

  const codes = graphqlCodes(error)
  if (codes.includes('RATE_LIMITED')) return 'rate_limited'
  if (codes.includes('UNAUTHENTICATED') || codes.includes('FORBIDDEN')) return 'revoked'
  if (codes.includes('INVALID_INPUT')) return 'invalid'
  return 'unavailable'
}

export function mapAuthGraphqlError(
  error: unknown,
  surface: 'request' | 'verify' | 'refresh' | 'session',
): never {
  const kind = classifyAuthFailure(error)

  if (kind === 'rate_limited') throw new AuthRateLimitedError()
  if (kind === 'invalid') {
    throw surface === 'request' ? new InvalidEmailError() : new InvalidMagicLinkError()
  }
  if (kind === 'revoked') {
    if (surface === 'verify') {
      const codes = graphqlCodes(error)
      if (codes.includes('FORBIDDEN')) throw new AuthForbiddenError()
      throw new InvalidMagicLinkError()
    }
    throw new SessionExpiredError()
  }
  throw new SessionUnavailableError()
}
