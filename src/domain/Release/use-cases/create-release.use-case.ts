import type { Release } from '../release.entity'
import type { NewRelease, ReleaseRepository } from '../release.repository'
import { assertReleaseForm } from './validate-release-form.use-case'

export class CreateRelease {
  private readonly repo: ReleaseRepository

  constructor(repo: ReleaseRepository) {
    this.repo = repo
  }

  execute(input: NewRelease): Promise<Release> {
    assertReleaseForm({
      title: input.title,
      subtitle: input.subtitle,
      body: input.body,
      tags: input.tags,
      status: input.status,
      publishedDate: '',
      journalistIds: input.journalistIds,
    }, { isCreate: true })
    return this.repo.create(input)
  }
}
