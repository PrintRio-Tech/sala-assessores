import type { AuthRepository, VerifyCodeInput } from '@/domain/Auth/auth.repository'
import { GetSession } from '@/domain/Auth/use-cases/get-session.use-case'
import { Logout } from '@/domain/Auth/use-cases/logout.use-case'
import { RefreshSession } from '@/domain/Auth/use-cases/refresh-session.use-case'
import { RequestMagicLink } from '@/domain/Auth/use-cases/request-magic-link.use-case'
import { VerifyMagicLink } from '@/domain/Auth/use-cases/verify-magic-link.use-case'

export class AuthService {
  private readonly repo: AuthRepository
  private readonly requestMagicLinkUseCase: RequestMagicLink
  private readonly verifyMagicLinkUseCase: VerifyMagicLink
  private readonly refreshSessionUseCase: RefreshSession
  private readonly logoutUseCase: Logout
  private readonly getSessionUseCase: GetSession

  constructor(repo: AuthRepository) {
    this.repo = repo
    this.requestMagicLinkUseCase = new RequestMagicLink(repo)
    this.verifyMagicLinkUseCase = new VerifyMagicLink(repo)
    this.refreshSessionUseCase = new RefreshSession(repo)
    this.logoutUseCase = new Logout(repo)
    this.getSessionUseCase = new GetSession(repo)
  }

  requestMagicLink(email: string) {
    return this.requestMagicLinkUseCase.execute(email)
  }

  verify(input: VerifyCodeInput) {
    return this.verifyMagicLinkUseCase.execute(input)
  }

  refreshSession() {
    return this.refreshSessionUseCase.execute()
  }

  logoutUser() {
    return this.logoutUseCase.execute()
  }

  getSession() {
    return this.getSessionUseCase.execute()
  }

  hasStoredToken() {
    return this.repo.hasStoredToken()
  }
}
