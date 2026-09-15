import { useQuery } from '@tanstack/react-query'

import { journalistService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { Journalist } from '@/domain/Journalist/journalist.entity'

export type { Journalist }
export type JournalistStatusFilter = 'active' | 'inactive'

export interface JournalistFilters {
  search?: string
  outletName?: string
  desk?: string
  roleTitle?: string
  status?: JournalistStatusFilter
  preferredChannel?: 'email' | 'whatsapp' | 'phone'
  topic?: string
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'pt-BR'))
}

export function useJournalists(filters: JournalistFilters = {}) {
  const query = useQuery({
    queryKey: queryKeys.journalists,
    queryFn: () => journalistService.list(),
  })

  const items = query.data?.items ?? []
  const term = normalizeSearch(filters.search ?? '')
  const data = items.filter((journalist) => {
    const matchesSearch = !term || [
      journalist.name,
      journalist.outletName,
      journalist.desk,
      journalist.roleTitle,
      journalist.email,
    ].some((value) => normalizeSearch(value).includes(term))

    return matchesSearch
      && (!filters.outletName || journalist.outletName === filters.outletName)
      && (!filters.desk || journalist.desk === filters.desk)
      && (!filters.roleTitle || journalist.roleTitle === filters.roleTitle)
      && (!filters.status || (filters.status === 'active' ? journalist.isActive : !journalist.isActive))
      && (!filters.preferredChannel || journalist.preferredChannel === filters.preferredChannel)
      && (!filters.topic || journalist.topics.includes(filters.topic))
  })

  return {
    data,
    filterOptions: {
      outletNames: uniqueSorted(items.map((journalist) => journalist.outletName)),
      desks: uniqueSorted(items.map((journalist) => journalist.desk)),
      roleTitles: uniqueSorted(items.map((journalist) => journalist.roleTitle)),
      topics: uniqueSorted(items.flatMap((journalist) => journalist.topics)),
    },
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
