import { AuthForbiddenError, SessionExpiredError } from '@/domain/Auth/errors/auth.errors'
import {
  AttachmentStorageUnavailableError,
  DemandNotFoundError,
  InvalidDemandInputError,
} from '@/domain/Demand/errors/demand.errors'
import { InvalidJournalistError, JournalistNotFoundError } from '@/domain/Journalist/errors/journalist.errors'

type GraphqlErrorLike = {
  message?: string
  errors?: Array<{
    message?: string
    extensions?: { code?: unknown; metadata?: { code?: unknown } }
  }>
}

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

function graphqlMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const message = (error as GraphqlErrorLike).message
    if (message?.trim()) return message
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function mapOperationalGraphqlError(error: unknown, surface: 'demand' | 'journalist'): never {
  const codes = graphqlCodes(error)
  const message = graphqlMessage(error, 'Falha ao falar com o BFF.')

  if (codes.includes('UNAUTHENTICATED')) throw new SessionExpiredError()
  if (codes.includes('FORBIDDEN')) throw new AuthForbiddenError()
  if (codes.includes('NOT_FOUND')) {
    throw surface === 'journalist' ? new JournalistNotFoundError() : new DemandNotFoundError()
  }
  if (codes.includes('CONFLICT')) {
    throw new InvalidJournalistError('Já existe um jornalista ativo com este e-mail.')
  }
  if (codes.includes('INVALID_INPUT')) {
    throw surface === 'journalist'
      ? new InvalidJournalistError(message)
      : new InvalidDemandInputError(message)
  }
  if (codes.includes('STORAGE_UNAVAILABLE')) {
    throw new AttachmentStorageUnavailableError(message)
  }
  throw error instanceof Error ? error : new Error(message)
}
