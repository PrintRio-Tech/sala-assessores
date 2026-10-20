import { ReleaseNotFoundError } from '../errors/release.errors'
import type { Release } from '../release.entity'
import type { ReleaseRepository } from '../release.repository'

export class GetReleaseById {
  private readonly repo: ReleaseRepository

  constructor(repo: ReleaseRepository) {
    this.repo = repo
  }

  async execute(id: string): Promise<Release> {
    const release = await this.repo.getById(id)
    if (!release) throw new ReleaseNotFoundError()
    return release
  }
}
