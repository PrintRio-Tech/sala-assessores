import { beforeEach, describe, expect, it } from 'vitest'

import { ReleaseImportTemplateError } from '@/domain/Release/errors/release.errors'
import { InMemoryReleaseRepository } from './release.repository'

describe('InMemoryReleaseRepository', () => {
  let repo: InMemoryReleaseRepository

  beforeEach(() => {
    repo = new InMemoryReleaseRepository()
  })

  it('recusa arquivo que não é o modelo oficial', async () => {
    await expect(repo.previewRecipientImport({
      releaseId: 'rel-q1',
      filename: 'contatos.csv',
      contentBase64: 'abc',
    })).rejects.toThrow(ReleaseImportTemplateError)

    await expect(repo.previewRecipientImport({
      releaseId: 'rel-q1',
      filename: 'planilha.xlsx',
      contentBase64: 'abc',
    })).rejects.toBeInstanceOf(ReleaseImportTemplateError)
  })

  it('aceita só modelo-destinatarios-release.xlsx', async () => {
    const preview = await repo.previewRecipientImport({
      releaseId: 'rel-q1',
      filename: 'modelo-destinatarios-release.xlsx',
      contentBase64: 'UEsDBBQAAAAI',
    })
    expect(preview.errorCount).toBe(0)
    expect(preview.lines.length).toBeGreaterThan(0)
  })
})
