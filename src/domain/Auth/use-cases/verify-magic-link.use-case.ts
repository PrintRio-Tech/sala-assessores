import type { AuthRepository, VerifyCodeInput } from '../auth.repository'
import { InvalidEmailError, InvalidMagicLinkError } from '../errors/auth.errors'
import { isValidEmail, normalizeEmail } from '../user.entity'

const OTP_PATTERN = /^\d{6}$/

export class VerifyMagicLink {
  private readonly repo: AuthRepository

  constructor(repo: AuthRepository) {
    this.repo = repo
  }

  execute(input: VerifyCodeInput) {
    if (!isValidEmail(input.email)) {
      throw new InvalidEmailError()
    }
    if (!OTP_PATTERN.test(input.code.trim())) {
      throw new InvalidMagicLinkError()
    }
    return this.repo.verify({
      email: normalizeEmail(input.email),
      code: input.code.trim(),
    })
  }
}
