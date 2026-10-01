import type { AuthRepository } from '../auth.repository'

export class RefreshSession {
  private readonly repo: AuthRepository

  constructor(repo: AuthRepository) {
    this.repo = repo
  }

  execute() {
    return this.repo.refreshSession()
  }
}
