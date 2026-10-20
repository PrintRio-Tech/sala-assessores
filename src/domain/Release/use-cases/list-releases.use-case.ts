import { formatDemandCalendarDay } from '@/domain/Demand/demand.entity'

import type { Release } from '../release.entity'
import type { Paginated, ReleaseListParams, ReleaseRepository } from '../release.repository'

function matchesSearch(release: Release, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return (
    release.title.toLowerCase().includes(needle)
    || release.tags.some((tag) => tag.toLowerCase().includes(needle))
    || release.authorName.toLowerCase().includes(needle)
  )
}

function compare(left: string | Date | null, right: string | Date | null, direction: 'asc' | 'desc') {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  const result = left instanceof Date && right instanceof Date
    ? left.getTime() - right.getTime()
    : String(left).localeCompare(String(right), 'pt-BR', { sensitivity: 'base', numeric: true })
  if (result === 0) return 0
  return direction === 'asc' ? result : -result
}

export function selectReleaseList(items: Release[], params: ReleaseListParams = {}): Paginated<Release> {
  const search = params.search ?? ''
  const filtered = items.filter((release) => {
    if (!matchesSearch(release, search)) return false
    if (params.status && release.status !== params.status) return false
    if (params.tags?.length && !params.tags.every((tag) => (
      release.tags.some((item) => item.toLocaleLowerCase('pt-BR') === tag.toLocaleLowerCase('pt-BR'))
    ))) return false
    if (params.journalistId && !release.recipients.some((item) => item.journalistId === params.journalistId)) {
      return false
    }
    if (params.publishedFrom) {
      if (!release.publishedAt || formatDemandCalendarDay(release.publishedAt) < params.publishedFrom) return false
    }
    if (params.publishedTo) {
      if (!release.publishedAt || formatDemandCalendarDay(release.publishedAt) > params.publishedTo) return false
    }
    return true
  })

  const sort = params.sort
  const sorted = sort
    ? [...filtered].sort((left, right) => {
      const field = sort.field === 'authorName' ? 'authorName' : sort.field
      const lv = field === 'publishedAt' ? left.publishedAt : left[field]
      const rv = field === 'publishedAt' ? right.publishedAt : right[field]
      return compare(lv, rv, sort.direction)
    })
    : filtered

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? sorted.length
  const start = (page - 1) * pageSize
  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
  }
}

export class ListReleases {
  private readonly repo: ReleaseRepository

  constructor(repo: ReleaseRepository) {
    this.repo = repo
  }

  execute(params: ReleaseListParams = {}): Promise<Paginated<Release>> {
    return this.repo.list(params)
  }
}
