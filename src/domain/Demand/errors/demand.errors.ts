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

  constructor(message = 'Salve o posicionamento (texto ou anexo) antes de registrar a aprovação.') {
    super(message)
  }
}

export class PositioningNotEditableError extends DomainError {
  readonly code = 'POSITIONING_NOT_EDITABLE'

  constructor(message = 'Não é possível alterar o posicionamento de um caso já enviado ou encerrado.') {
    super(message)
  }
}

export class DemandOutcomeNotAllowedError extends DomainError {
  readonly code = 'DEMAND_OUTCOME_NOT_ALLOWED'

  constructor(message = 'Só é possível avaliar o resultado depois que o caso for enviado ou encerrado.') {
    super(message)
  }
}

export class InvalidDemandOutcomeError extends DomainError {
  readonly code = 'DEMAND_OUTCOME_INVALID'

  constructor(message: string) {
    super(message)
  }
}

export class InvalidDemandInputError extends DomainError {
  readonly code = 'INVALID_INPUT'

  constructor(message = 'Não foi possível gravar a demanda com os dados informados.') {
    super(message)
  }
}

export class PositioningAttachmentTooLargeError extends DomainError {
  readonly code = 'POSITIONING_ATTACHMENT_TOO_LARGE'

  constructor(message = 'O anexo pode ter no máximo 20 MB.') {
    super(message)
  }
}

export class AttachmentStorageUnavailableError extends DomainError {
  readonly code = 'STORAGE_UNAVAILABLE'

  constructor(message = 'O armazenamento de anexos não está disponível.') {
    super(message)
  }
}
