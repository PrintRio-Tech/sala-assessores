import { beforeEach, describe, expect, it } from 'vitest'

import { useDemandFilters } from './demand.store'

describe('Demand filters', () => {
  beforeEach(() => {
    useDemandFilters.getState().reset()
  })

  it('descarta status incompatível ao alternar o ciclo e volta à primeira página', () => {
    const store = useDemandFilters.getState()
    store.setStatus('sent')
    store.setPage(2)
    store.setLifecycle('active')

    expect(useDemandFilters.getState()).toMatchObject({
      lifecycle: 'active',
      status: 'all',
      page: 1,
    })

    useDemandFilters.getState().setStatus('in_progress')
    useDemandFilters.getState().setPage(2)
    useDemandFilters.getState().setLifecycle('history')

    expect(useDemandFilters.getState()).toMatchObject({
      lifecycle: 'history',
      status: 'all',
      page: 1,
    })
  })

  it('returns to the first page whenever a filter or lifecycle changes', () => {
    const store = useDemandFilters.getState()

    store.setPage(2)
    store.setSearch('energia')
    expect(useDemandFilters.getState().page).toBe(1)

    useDemandFilters.getState().setPage(2)
    useDemandFilters.getState().setLifecycle('history')
    expect(useDemandFilters.getState().page).toBe(1)
  })

  it('restores every filter and pagination to the initial state', () => {
    const store = useDemandFilters.getState()

    store.setSearch('energia')
    store.setStatus('sent')
    store.setResponsibleId('r-ana')
    store.setPage(2)
    store.reset()

    expect(useDemandFilters.getState()).toMatchObject({
      search: '',
      status: 'all',
      responsibleId: 'all',
      lifecycle: 'active',
      page: 1,
    })
  })
})
