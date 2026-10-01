import type { AuthRepository } from '../auth.repository'
import { InvalidEmailError } from '../errors/auth.errors'
import { isValidEmail, normalizeEmail } from '../user.entity'

export class RequestMagicLink {
  private readonly repo: AuthRepository

  constructor(repo: AuthRepository) {
    this.repo = repo
  }

  execute(email: string) {
    if (!isValidEmail(email)) {
      throw new InvalidEmailError()
    }
    return this.repo.requestMagicLink(normalizeEmail(email))
  }
}
