import { currentUser } from '@/application/current-user'
import type { Journalist } from '@/domain/Journalist/journalist.entity'
import type { Release } from '@/domain/Release/release.entity'
import { uniqueJournalistIds } from '@/domain/Release/release.entity'
import { InvalidReleaseInputError, ReleaseImportTemplateError } from '@/domain/Release/errors/release.errors'
import type {
  NewRelease,
  RecipientImportPreview,
  ReleaseListParams,
  ReleaseRecipientTemplate,
  ReleaseRepository,
  ReleaseUpdate,
} from '@/domain/Release/release.repository'
import { selectReleaseList } from '@/domain/Release/use-cases/list-releases.use-case'
import { mockReleases } from '@/infrastructure/mock/release-seed'
import { InMemoryJournalistRepository } from '@/infrastructure/modules/Journalist/journalist.repository'

const TEMPLATE_NAME = 'modelo-destinatarios-release.xlsx'
const TEMPLATE: ReleaseRecipientTemplate = {
  filename: TEMPLATE_NAME,
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  contentBase64: 'UEsDBBQAAAAI',
}

export class InMemoryReleaseRepository implements ReleaseRepository {
  private readonly records: Release[]
  private sequence: number
  private readonly journalists: () => Promise<Journalist[]>

  constructor(journalists?: () => Promise<Journalist[]>) {
    this.records = mockReleases.map((item) => ({
      ...item,
      tags: [...item.tags],
      recipients: item.recipients.map((recipient) => ({ ...recipient })),
    }))
    this.sequence = this.records.length
    this.journalists = journalists ?? (async () => (await new InMemoryJournalistRepository().list()).items)
  }

  async list(params: ReleaseListParams = {}) {
    return selectReleaseList(this.records, params)
  }

  async getById(id: string) {
    return this.records.find((item) => item.id === id) ?? null
  }

  async create(input: NewRelease): Promise<Release> {
    this.sequence += 1
    const now = new Date()
    const release: Release = {
      id: `rel-${now.getTime()}-${this.sequence}`,
      code: `REL-${String(this.sequence).padStart(3, '0')}`,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      body: input.body,
      status: input.status,
      tags: [...input.tags],
      publishedAt: input.status === 'sent' ? (input.publishedAt ?? now) : input.publishedAt,
      authorUserId: input.authorUserId || currentUser.id,
      authorName: input.authorName || currentUser.name,
      recipients: await this.recipientsFrom(uniqueJournalistIds(input.journalistIds), now),
      createdAt: now,
      updatedAt: now,
    }
    this.records.unshift(release)
    return release
  }

  async update(id: string, input: ReleaseUpdate) {
    const current = await this.getById(id)
    if (!current) return null
    const now = new Date()
    const next: Release = {
      ...current,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      body: input.body,
      tags: [...input.tags],
      status: input.status,
      publishedAt: input.status === 'sent' ? (input.publishedAt ?? current.publishedAt ?? now) : input.publishedAt,
      updatedAt: now,
    }
    return this.replace(id, next)
  }

  async remove(id: string) {
    const index = this.records.findIndex((item) => item.id === id)
    if (index >= 0) this.records.splice(index, 1)
  }

  async setRecipients(id: string, journalistIds: string[]) {
    const current = await this.getById(id)
    if (!current) return null
    if (current.status === 'sent' && uniqueJournalistIds(journalistIds).length < 1) {
      throw new InvalidReleaseInputError('Informe pelo menos um destinatário para enviar o release.')
    }
    const now = new Date()
    return this.replace(id, {
      ...current,
      recipients: await this.recipientsFrom(uniqueJournalistIds(journalistIds), now, current),
      updatedAt: now,
    })
  }

  async getRecipientImportTemplate() {
    return TEMPLATE
  }

  async previewRecipientImport(input: { releaseId: string; filename: string; contentBase64: string }): Promise<RecipientImportPreview> {
    this.assertTemplateFile(input)
    const journalists = await this.journalists()
    const journalist = journalists[0]
    return {
      matchedCount: journalist ? 1 : 0,
      createCount: journalist ? 0 : 1,
      errorCount: 0,
      skippedCount: 0,
      lines: journalist
        ? [{
          rowNumber: 2,
          name: journalist.name,
          outletName: journalist.outletName,
          email: journalist.email,
          phone: journalist.phone,
          action: 'match',
          journalistId: journalist.id,
          error: null,
        }]
        : [{
          rowNumber: 2,
          name: 'Novo contato',
          outletName: 'Redação',
          email: 'novo@example.test',
          phone: '',
          action: 'create',
          journalistId: null,
          error: null,
        }],
    }
  }

  async commitRecipientImport(id: string, input: { filename: string; contentBase64: string }) {
    const preview = await this.previewRecipientImport({ releaseId: id, ...input })
    const ids = preview.lines.map((line) => line.journalistId).filter((value): value is string => Boolean(value))
    if (ids.length === 0) return this.getById(id)
    return this.setRecipients(id, ids)
  }

  private assertTemplateFile(input: { filename: string; contentBase64: string }) {
    const filename = input.filename.trim().toLocaleLowerCase('pt-BR')
    if (!filename.endsWith('.xlsx') || filename !== TEMPLATE_NAME) {
      throw new ReleaseImportTemplateError()
    }
    if (!input.contentBase64.trim()) throw new ReleaseImportTemplateError()
  }

  private async recipientsFrom(ids: string[], now: Date, current?: Release) {
    const journalists = await this.journalists()
    const previous = new Map((current?.recipients ?? []).map((item) => [item.journalistId, item]))
    return ids.map((journalistId) => {
      const existing = previous.get(journalistId)
      if (existing) return existing
      const journalist = journalists.find((item) => item.id === journalistId)
      return {
        journalistId,
        addedAt: now,
        name: journalist?.name ?? null,
        outletName: journalist?.outletName ?? null,
      }
    })
  }

  private replace(id: string, release: Release) {
    const index = this.records.findIndex((item) => item.id === id)
    if (index < 0) return null
    this.records[index] = release
    return release
  }
}
