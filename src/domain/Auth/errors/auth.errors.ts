import { DomainError } from '@/domain/shared/errors/domain-error'

export class InvalidEmailError extends DomainError {
  readonly code = 'AUTH_INVALID_EMAIL'

  constructor(message = 'Informe um e-mail válido.') {
    super(message)
  }
}

export class InvalidMagicLinkError extends DomainError {
  readonly code = 'AUTH_INVALID_MAGIC_LINK'

  constructor(message = 'Código inválido ou expirado. Solicite um novo código.') {
    super(message)
  }
}

export class AuthForbiddenError extends DomainError {
  readonly code = 'AUTH_FORBIDDEN'

  constructor(message = 'Não foi possível entrar com este e-mail.') {
    super(message)
  }
}

export class AuthRateLimitedError extends DomainError {
  readonly code = 'AUTH_RATE_LIMITED'

  constructor(
    message = 'Para sua segurança, espere alguns instantes antes de solicitar outro código.',
  ) {
    super(message)
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = 'AUTH_SESSION_EXPIRED'

  constructor(message = 'Sua sessão expirou. Faça login novamente.') {
    super(message)
  }
}

export class SessionUnavailableError extends DomainError {
  readonly code = 'AUTH_SESSION_UNAVAILABLE'

  constructor(
    message = 'Não foi possível confirmar sua sessão. Tente novamente em instantes.',
  ) {
    super(message)
  }
}
