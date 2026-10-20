import { DomainError } from '@/domain/shared/errors/domain-error'

export class ReleaseNotFoundError extends DomainError {
  readonly code = 'RELEASE_NOT_FOUND'

  constructor(message = 'Release não encontrado.') {
    super(message)
  }
}

export class InvalidReleaseInputError extends DomainError {
  readonly code = 'INVALID_INPUT'

  constructor(message = 'Não foi possível gravar o release com os dados informados.') {
    super(message)
  }
}

export class ReleaseImportTemplateError extends DomainError {
  readonly code = 'INVALID_INPUT'

  constructor(message = 'Use o modelo oficial. Baixe o template.') {
    super(message)
  }
}
