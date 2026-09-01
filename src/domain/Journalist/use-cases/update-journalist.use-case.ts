import { JournalistNotFoundError } from '../errors/journalist.errors'
import { normalizeAndValidateJournalistProfile } from '../journalist-profile'
import type { Journalist } from '../journalist.entity'
import type {
  JournalistRepository,
  UpdateJournalistInput,
} from '../journalist.repository'

export class UpdateJournalist {
  private readonly repo: JournalistRepository

  constructor(repo: JournalistRepository) {
    this.repo = repo
  }

  execute(id: string, input: UpdateJournalistInput): Promise<Journalist> {
    const normalized = normalizeAndValidateJournalistProfile(input)
    return this.persist(id, normalized)
  }

  private async persist(id: string, input: UpdateJournalistInput): Promise<Journalist> {
    const journalist = await this.repo.updateProfile(id, input)
    if (!journalist) throw new JournalistNotFoundError()
    return journalist
  }
}
