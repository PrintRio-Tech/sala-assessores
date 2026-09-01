import { create } from 'zustand'

import type { DemandStatus } from '@/domain/Demand/demand.entity'

interface DemandFiltersState {
  search: string
  status: DemandStatus | 'all'
  responsibleId: string | 'all'
  lifecycle: 'active' | 'history'
  deadlineOn: string
  page: number
  setSearch: (value: string) => void
  setStatus: (value: DemandStatus | 'all') => void
  setResponsibleId: (value: string | 'all') => void
  setLifecycle: (value: 'active' | 'history') => void
  setDeadlineOn: (value: string) => void
  setPage: (page: number) => void
  clearFilters: () => void
  reset: () => void
}

const initialState = {
  search: '',
  status: 'all' as const,
  responsibleId: 'all' as const,
  lifecycle: 'active' as const,
  deadlineOn: '',
  page: 1,
}

function firstPageState<T extends object>(state: T): T & { page: number } {
  return { ...state, page: 1 }
}

export const useDemandFilters = create<DemandFiltersState>((set) => ({
  ...initialState,
  setSearch: (search) => set(firstPageState({ search })),
  setStatus: (status) => set(firstPageState({ status })),
  setResponsibleId: (responsibleId) => set(firstPageState({ responsibleId })),
  setLifecycle: (lifecycle) => set(firstPageState({ lifecycle })),
  setDeadlineOn: (deadlineOn) => set(firstPageState({ deadlineOn })),
  setPage: (page) => set({ page }),
  clearFilters: () => set((state) => ({
    search: initialState.search,
    status: initialState.status,
    responsibleId: initialState.responsibleId,
    deadlineOn: initialState.deadlineOn,
    page: 1,
    lifecycle: state.lifecycle,
  })),
  reset: () => set(initialState),
}))
