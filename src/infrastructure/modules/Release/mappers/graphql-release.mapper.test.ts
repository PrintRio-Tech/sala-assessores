import { describe, expect, it } from 'vitest'

import {
  COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION,
  CREATE_RELEASE_MUTATION,
  DELETE_RELEASE_MUTATION,
  PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION,
  RELEASES_QUERY,
  UPDATE_RELEASE_MUTATION,
} from '../graphql/release.queries'
import { toCreateReleaseInput, toReleasesFilter, toUpdateReleaseInput } from './graphql-release.mapper'

describe('contrato GraphQL de Release (Nexo)', () => {
  it('envia só ReleasesFilter do BFF, sem tags nem paginação', () => {
    expect(toReleasesFilter({
      search: ' trimestre ',
      status: 'sent',
      tags: ['esg'],
      journalistId: 'j-carolina',
      publishedFrom: '2026-08-01',
      publishedTo: '2026-08-31',
      page: 2,
      pageSize: 20,
    })).toEqual({
      search: 'trimestre',
      status: 'sent',
      journalistId: 'j-carolina',
      publishedFrom: '2026-08-01',
      publishedTo: '2026-08-31',
    })
    expect(RELEASES_QUERY).toContain('$filter: ReleasesFilter')
    expect(toReleasesFilter({ tags: ['esg'] })).not.toHaveProperty('tags')
  })

  it('createRelease não envia publishedAt nem autor', () => {
    const input = toCreateReleaseInput({
      title: 'Título',
      subtitle: 'Sub',
      body: '<p>Corpo</p>',
      tags: ['economia'],
      status: 'in_progress',
      publishedAt: new Date('2026-08-01T12:00:00.000Z'),
      journalistIds: ['j-carolina'],
      authorUserId: 'r-noel',
      authorName: 'Noel Ferreira',
    })
    expect(input).toEqual({
      title: 'Título',
      subtitle: 'Sub',
      body: '<p>Corpo</p>',
      tags: ['economia'],
      status: 'in_progress',
      journalistIds: ['j-carolina'],
    })
    expect(CREATE_RELEASE_MUTATION).toContain('$input: CreateReleaseInput!')
    expect(JSON.stringify(input)).not.toContain('publishedAt')
    expect(JSON.stringify(input)).not.toContain('author')
  })

  it('updateRelease envia só título, subtítulo, corpo, tags e status', () => {
    const input = toUpdateReleaseInput({
      title: 'Título',
      subtitle: 'Sub',
      body: '<p>Corpo</p>',
      tags: ['economia'],
      status: 'sent',
      publishedAt: new Date('2026-08-01T12:00:00.000Z'),
    })
    expect(input).toEqual({
      title: 'Título',
      subtitle: 'Sub',
      body: '<p>Corpo</p>',
      tags: ['economia'],
      status: 'sent',
    })
    expect(UPDATE_RELEASE_MUTATION).toContain('$input: UpdateReleaseInput!')
  })

  it('importa destinatários com releaseId e devolve o release no delete', () => {
    expect(PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION).toContain('$releaseId: ID!')
    expect(PREVIEW_RELEASE_RECIPIENT_IMPORT_MUTATION).toContain('previewReleaseRecipientImport(releaseId: $releaseId, filename: $filename, contentBase64: $contentBase64)')
    expect(COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION).toContain('$releaseId: ID!')
    expect(COMMIT_RELEASE_RECIPIENT_IMPORT_MUTATION).toContain('commitReleaseRecipientImport(releaseId: $releaseId, filename: $filename, contentBase64: $contentBase64)')
    expect(DELETE_RELEASE_MUTATION).toMatch(/deleteRelease\(id: \$id\) \{\s*[\s\S]*id/)
    expect(DELETE_RELEASE_MUTATION).toContain('title')
  })
})
