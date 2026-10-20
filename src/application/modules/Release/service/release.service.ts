import type {
  NewRelease,
  RecipientImportPreview,
  ReleaseListParams,
  ReleaseRecipientTemplate,
  ReleaseRepository,
  ReleaseUpdate,
} from '@/domain/Release/release.repository'
import { CreateRelease } from '@/domain/Release/use-cases/create-release.use-case'
import { GetReleaseById } from '@/domain/Release/use-cases/get-release-by-id.use-case'
import { ListReleases } from '@/domain/Release/use-cases/list-releases.use-case'
import { UpdateRelease } from '@/domain/Release/use-cases/update-release.use-case'

export class ReleaseService {
  private readonly listReleases: ListReleases
  private readonly getReleaseById: GetReleaseById
  private readonly createRelease: CreateRelease
  private readonly updateRelease: UpdateRelease
  private readonly repo: ReleaseRepository

  constructor(repo: ReleaseRepository) {
    this.repo = repo
    this.listReleases = new ListReleases(repo)
    this.getReleaseById = new GetReleaseById(repo)
    this.createRelease = new CreateRelease(repo)
    this.updateRelease = new UpdateRelease(repo)
  }

  list(params: ReleaseListParams = {}) {
    return this.listReleases.execute(params)
  }

  getById(id: string) {
    return this.getReleaseById.execute(id)
  }

  create(input: NewRelease) {
    return this.createRelease.execute(input)
  }

  update(id: string, input: ReleaseUpdate, journalistIds: string[]) {
    return this.updateRelease.execute(id, input, journalistIds)
  }

  remove(id: string) {
    return this.repo.remove(id)
  }

  setRecipients(id: string, journalistIds: string[]) {
    return this.repo.setRecipients(id, journalistIds)
  }

  getRecipientImportTemplate(): Promise<ReleaseRecipientTemplate> {
    return this.repo.getRecipientImportTemplate()
  }

  previewRecipientImport(input: { releaseId: string; filename: string; contentBase64: string }): Promise<RecipientImportPreview> {
    return this.repo.previewRecipientImport(input)
  }

  commitRecipientImport(releaseId: string, input: { filename: string; contentBase64: string }) {
    return this.repo.commitRecipientImport(releaseId, input)
  }

  async listTags(search?: string) {
    const { items } = await this.list({ pageSize: 500 })
    const needle = search?.trim().toLocaleLowerCase('pt-BR') ?? ''
    return [...new Set(items.flatMap((item) => item.tags))]
      .filter((tag) => !needle || tag.toLocaleLowerCase('pt-BR').includes(needle))
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
  }
}
