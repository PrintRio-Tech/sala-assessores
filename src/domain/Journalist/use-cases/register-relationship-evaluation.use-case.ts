import { JournalistNotFoundError } from '../errors/journalist.errors'
import {
  assertRelationshipEvaluation,
  type Journalist,
} from '../journalist.entity'
import { normalizeJournalistTopics } from '../journalist-profile'
import type {
  JournalistRepository,
  NewRelationshipEvaluation,
} from '../journalist.repository'

export class RegisterRelationshipEvaluation {
  private readonly repo: JournalistRepository

  constructor(repo: JournalistRepository) {
    this.repo = repo
  }

  execute(id: string, input: NewRelationshipEvaluation): Promise<Journalist> {
    const normalized: NewRelationshipEvaluation = {
      ...input,
      authorName: input.authorName.trim(),
      editorialToneLabel: input.editorialToneLabel.trim(),
      traits: normalizeJournalistTopics(input.traits),
      notes: input.notes.trim(),
    }
    assertRelationshipEvaluation(normalized)
    return this.persist(id, normalized)
  }

  private async persist(id: string, input: NewRelationshipEvaluation): Promise<Journalist> {
    const journalist = await this.repo.addRelationshipEvaluation(id, input)
    if (!journalist) throw new JournalistNotFoundError()
    return journalist
  }
}
