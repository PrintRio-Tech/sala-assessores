import { DomainError } from '@/domain/shared/errors/domain-error'

export class JournalistNotFoundError extends DomainError {
  readonly code = 'JOURNALIST_NOT_FOUND'

  constructor(message = 'Jornalista não encontrado.') {
    super(message)
  }
}

export class InvalidRelationshipEvaluationError extends DomainError {
  readonly code = 'RELATIONSHIP_EVALUATION_INVALID'

  constructor(message = 'Avaliação de relacionamento inválida.') {
    super(message)
  }
}

export class InvalidJournalistError extends DomainError {
  readonly code = 'JOURNALIST_INVALID'

  constructor(message = 'Dados do jornalista inválidos.') {
    super(message)
  }
}
