import { DomainError } from '@/domain/shared/errors/domain-error'

export class DemandNotFoundError extends DomainError {
  readonly code = 'DEMAND_NOT_FOUND'

  constructor(message = 'Demanda não encontrada.') {
    super(message)
  }
}

export class InvalidExternalInteractionError extends DomainError {
  readonly code = 'EXTERNAL_INTERACTION_INVALID'

  constructor(message: string) {
    super(message)
  }
}
