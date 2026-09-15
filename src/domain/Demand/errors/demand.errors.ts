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

export class DemandInteractionNotAllowedError extends DomainError {
  readonly code = 'DEMAND_INTERACTION_NOT_ALLOWED'

  constructor(message = 'Não é possível registrar interação em um caso já enviado ou encerrado.') {
    super(message)
  }
}

export class PositioningTextRequiredError extends DomainError {
  readonly code = 'POSITIONING_TEXT_REQUIRED'

  constructor(message = 'Salve o texto do posicionamento antes de registrar a aprovação.') {
    super(message)
  }
}

export class PositioningNotEditableError extends DomainError {
  readonly code = 'POSITIONING_NOT_EDITABLE'

  constructor(message = 'Não é possível alterar o posicionamento de um caso já enviado ou encerrado.') {
    super(message)
  }
}
