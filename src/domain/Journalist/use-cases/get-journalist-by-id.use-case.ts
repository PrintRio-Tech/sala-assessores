import { JournalistNotFoundError } from '../errors/journalist.errors'
import type { Journalist } from '../journalist.entity'
import type { JournalistRepository } from '../journalist.repository'

export class GetJournalistById {
  private readonly repo: JournalistRepository

  constructor(repo: JournalistRepository) {
    this.repo = repo
  }

  async execute(id: string): Promise<Journalist> {
    const journalist = await this.repo.getById(id)
    if (!journalist) {
      throw new JournalistNotFoundError()
    }
    return journalist
  }
}
