import type { Release, ReleaseStatus } from './release.entity'

export type ReleaseSortField = 'title' | 'status' | 'publishedAt' | 'authorName'
export type SortDirection = 'asc' | 'desc'
export type ReleaseListSort = { field: ReleaseSortField; direction: SortDirection }

export interface ReleaseListParams {
  search?: string
  status?: ReleaseStatus
  tags?: string[]
  publishedFrom?: string
  publishedTo?: string
  journalistId?: string
  sort?: ReleaseListSort
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
}

export type NewRelease = {
  title: string
  subtitle: string
  body: string
  tags: string[]
  status: ReleaseStatus
  publishedAt: Date | null
  journalistIds: string[]
  authorUserId: string
  authorName: string
}

export type ReleaseUpdate = {
  title: string
  subtitle: string
  body: string
  tags: string[]
  status: ReleaseStatus
  publishedAt: Date | null
}

export type RecipientImportLine = {
  rowNumber: number
  name: string
  outletName: string
  email: string
  phone: string
  action: 'match' | 'create' | 'error'
  journalistId: string | null
  error: string | null
}

export type RecipientImportPreview = {
  matchedCount: number
  createCount: number
  errorCount: number
  skippedCount: number
  lines: RecipientImportLine[]
}

export type ReleaseRecipientTemplate = {
  filename: string
  contentType: string
  contentBase64: string
}

export interface ReleaseRepository {
  list(params?: ReleaseListParams): Promise<Paginated<Release>>
  getById(id: string): Promise<Release | null>
  create(input: NewRelease): Promise<Release>
  update(id: string, input: ReleaseUpdate): Promise<Release | null>
  remove(id: string): Promise<void>
  setRecipients(id: string, journalistIds: string[]): Promise<Release | null>
  getRecipientImportTemplate(): Promise<ReleaseRecipientTemplate>
  previewRecipientImport(input: { releaseId: string; filename: string; contentBase64: string }): Promise<RecipientImportPreview>
  commitRecipientImport(releaseId: string, input: { filename: string; contentBase64: string }): Promise<Release | null>
}
