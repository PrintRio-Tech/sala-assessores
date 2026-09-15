import {
  isActiveDemandStatus,
  type Demand,
} from '../demand.entity'
import type {
  DemandListParams,
  DemandListResult,
  DemandRepository,
} from '../demand.repository'

function matchesSearch(demand: Demand, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true

  return (
    demand.title.toLowerCase().includes(needle) ||
    demand.journalistName.toLowerCase().includes(needle) ||
    demand.code.toLowerCase().includes(needle)
  )
}

export class ListDemands {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(params: DemandListParams = {}): Promise<DemandListResult> {
    const { items } = await this.repo.list(params)
    const lifecycle = params.lifecycle ?? 'active'
    const status = params.status ?? 'all'
    const responsibleId = params.responsibleId ?? 'all'
    const search = params.search ?? ''

    const filteredByCommon = items.filter((demand) => {
      if (!matchesSearch(demand, search)) return false
      if (responsibleId !== 'all' && demand.responsibleId !== responsibleId) {
        return false
      }
      if (params.deadlineOn) {
        const day = demand.deadlineAt.toISOString().slice(0, 10)
        if (day !== params.deadlineOn) return false
      }
      return true
    })

    const activeCount = filteredByCommon.filter((d) => isActiveDemandStatus(d.status)).length
    const historyCount = filteredByCommon.length - activeCount

    const filtered = filteredByCommon.filter((demand) => (
      status === 'all' || demand.status === status
    ))

    const scoped =
      lifecycle === 'all'
        ? filtered
        : filtered.filter((demand) =>
            lifecycle === 'active'
              ? isActiveDemandStatus(demand.status)
              : !isActiveDemandStatus(demand.status),
          )

    return {
      items: scoped,
      total: scoped.length,
      activeCount,
      historyCount,
    }
  }
}
