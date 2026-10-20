import type { ReleaseListSort, ReleaseSortField } from '@/domain/Release/release.repository'
import type { ReleaseStatus } from '@/domain/Release/release.entity'
import type { ReleaseListParams } from '@/domain/Release/release.repository'

export type ListSort<TField extends string = string> = {
  field: TField
  direction: 'asc' | 'desc'
}

export function nextListSort<TField extends string>(
  current: ListSort<TField> | undefined,
  field: TField,
): ListSort<TField> {
  if (current?.field !== field) return { field, direction: 'asc' }
  return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}

export const RELEASE_COLUMN_SORT_FIELD = {
  title: 'title',
  status: 'status',
  publishedAt: 'publishedAt',
  author: 'authorName',
} as const satisfies Record<string, ReleaseSortField>

export type ReleaseFilterValues = {
  search: string
  status: string | null
  tags: string[]
  publishedFrom: string | null
  publishedTo: string | null
  sort: ListSort<ReleaseSortField> | null
  page: number
}

export function sortFromReleaseColumn(
  current: ListSort<ReleaseSortField> | null,
  columnId: string,
): ListSort<ReleaseSortField> | null {
  const field = RELEASE_COLUMN_SORT_FIELD[columnId as keyof typeof RELEASE_COLUMN_SORT_FIELD]
  if (!field) return current
  return nextListSort(current ?? undefined, field)
}

const RELEASE_SORT_TO_COLUMN: Partial<Record<ReleaseSortField, string>> = {
  title: 'title',
  status: 'status',
  publishedAt: 'publishedAt',
  authorName: 'author',
}

export function tableSortFromReleaseSort(
  sort: ListSort<ReleaseSortField> | null,
): { key: string; direction: 'asc' | 'desc' } | undefined {
  if (!sort) return undefined
  const key = RELEASE_SORT_TO_COLUMN[sort.field]
  if (!key) return undefined
  return { key, direction: sort.direction }
}

export function buildReleaseListParams(
  filters: ReleaseFilterValues,
  pagination?: { page?: number; pageSize?: number },
): ReleaseListParams {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status ? filters.status as ReleaseStatus : undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    publishedFrom: filters.publishedFrom ?? undefined,
    publishedTo: filters.publishedTo ?? undefined,
    page: pagination?.page,
    pageSize: pagination?.pageSize,
    sort: (filters.sort ?? undefined) as ReleaseListSort | undefined,
  }
}

export function hasActiveReleaseFilters(filters: ReleaseFilterValues): boolean {
  return (
    filters.search.trim().length > 0
    || filters.status != null
    || filters.tags.length > 0
    || filters.publishedFrom != null
    || filters.publishedTo != null
  )
}

export function countNonSearchReleaseFilters(filters: ReleaseFilterValues): number {
  let count = 0
  if (filters.status != null) count += 1
  count += filters.tags.length
  if (filters.publishedFrom != null || filters.publishedTo != null) count += 1
  return count
}

export function countAdvancedReleaseFilters(filters: ReleaseFilterValues): number {
  let count = filters.tags.length
  if (filters.status != null) count += 1
  return count
}
