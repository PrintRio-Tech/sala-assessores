import { ReleaseNotFoundError } from '../errors/release.errors'
import type { Release } from '../release.entity'
import type { ReleaseRepository, ReleaseUpdate } from '../release.repository'
import { assertReleaseForm } from './validate-release-form.use-case'

export class UpdateRelease {
  private readonly repo: ReleaseRepository

  constructor(repo: ReleaseRepository) {
    this.repo = repo
  }

  async execute(id: string, input: ReleaseUpdate, journalistIds: string[]): Promise<Release> {
    assertReleaseForm({
      title: input.title,
      subtitle: input.subtitle,
      body: input.body,
      tags: input.tags,
      status: input.status,
      publishedDate: '',
      journalistIds,
    })
    const release = await this.repo.update(id, input)
    if (!release) throw new ReleaseNotFoundError()
    const withRecipients = await this.repo.setRecipients(id, journalistIds)
    if (!withRecipients) throw new ReleaseNotFoundError()
    return withRecipients
  }
}
