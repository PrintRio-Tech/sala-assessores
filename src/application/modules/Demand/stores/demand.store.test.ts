import { beforeEach, describe, expect, it } from 'vitest'

import { useDemandFilters } from './demand.store'

describe('Demand filters', () => {
  beforeEach(() => {
    useDemandFilters.getState().reset()
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
    store.setStatus('approved')
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
