import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import type { ListSort, ReleaseFilterValues } from '../utils/release-list-params'
import type { ReleaseSortField } from '@/domain/Release/release.repository'

interface ReleaseFiltersState extends ReleaseFilterValues {
  selectedReleaseId: string | null
  setSearch: (search: string) => void
  setStatus: (status: string | null) => void
  setTags: (tags: string[]) => void
  setPublishedFrom: (publishedFrom: string | null) => void
  setPublishedTo: (publishedTo: string | null) => void
  setSort: (sort: ListSort<ReleaseSortField> | null) => void
  setPage: (page: number) => void
  setSelectedReleaseId: (id: string | null) => void
  resetFilters: () => void
  resetAdvancedFilters: () => void
  resetNonSearchFilters: () => void
  reset: () => void
}

const filterDefaults: ReleaseFilterValues = {
  search: '',
  status: null,
  tags: [],
  publishedFrom: null,
  publishedTo: null,
  sort: null,
  page: 1,
}

const initialState = {
  ...filterDefaults,
  selectedReleaseId: null as string | null,
}

export const useReleaseFilters = create<ReleaseFiltersState>((set) => ({
  ...initialState,
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setTags: (tags) => set({ tags, page: 1 }),
  setPublishedFrom: (publishedFrom) => set({ publishedFrom, page: 1 }),
  setPublishedTo: (publishedTo) => set({ publishedTo, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  setSelectedReleaseId: (selectedReleaseId) => set({ selectedReleaseId }),
  resetFilters: () => set({ ...filterDefaults }),
  resetAdvancedFilters: () => set({ status: null, tags: [], page: 1 }),
  resetNonSearchFilters: () => set({
    status: null,
    tags: [],
    publishedFrom: null,
    publishedTo: null,
    page: 1,
  }),
  reset: () => set(initialState),
}))

export function selectReleaseFilterValues(state: ReleaseFiltersState): ReleaseFilterValues {
  return {
    search: state.search,
    status: state.status,
    tags: state.tags,
    publishedFrom: state.publishedFrom,
    publishedTo: state.publishedTo,
    sort: state.sort,
    page: state.page,
  }
}

export function useReleaseFilterValues() {
  return useReleaseFilters(useShallow(selectReleaseFilterValues))
}
