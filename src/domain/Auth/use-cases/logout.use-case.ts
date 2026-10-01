import type { AuthRepository } from '../auth.repository'

export class Logout {
  private readonly repo: AuthRepository

  constructor(repo: AuthRepository) {
    this.repo = repo
  }

  execute() {
    return this.repo.logout()
  }
}
