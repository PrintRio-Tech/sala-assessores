import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { DemandListParams } from '@/domain/Demand/demand.repository'
import { isActiveDemandStatus, type Demand } from '@/domain/Demand/demand.entity'
import { useLocalDemandStore, type LocalDemandCapture } from '../stores/local-demand.store'

export type DemandListItem = Demand | (LocalDemandCapture & { kind: 'local' })

function matchesLocal(record: LocalDemandCapture, params: DemandListParams) {
  const lifecycle = params.lifecycle ?? 'active'
  const query = params.search?.trim().toLocaleLowerCase('pt-BR')
  if (query && ![record.subject, record.factContext, record.pressRequest, record.journalistName, record.outletName, record.id]
    .some((value) => value.toLocaleLowerCase('pt-BR').includes(query))) return false
  if (params.status && params.status !== 'all' && params.status !== record.status) return false
  if (params.responsibleId && params.responsibleId !== 'all' && params.responsibleId !== record.responsibleId) return false
  if (params.deadlineOn && record.requestedDeadline !== params.deadlineOn) return false
  if (lifecycle === 'active' && !isActiveDemandStatus(record.status)) return false
  if (lifecycle === 'history' && isActiveDemandStatus(record.status)) return false
  return true
}

function asListItem(record: LocalDemandCapture): DemandListItem {
  return { ...record, kind: 'local' }
}

export function useDemands(params: DemandListParams = {}) {
  const query = useQuery({
    queryKey: queryKeys.demands(params),
    queryFn: () => demandService.list({ ...params, lifecycle: 'all' }),
  })
  const localRecords = useLocalDemandStore((state) => state.records)
  const localItems = localRecords.filter((record) => matchesLocal(record, params)).map(asListItem)
  const localItemsWithoutLifecycle = localRecords.filter((record) => matchesLocal(record, { ...params, lifecycle: 'all' }))
  const localIds = new Set(localRecords.map((record) => record.id))
  const remoteItemsWithoutLifecycle = (query.data?.items ?? []).filter((record) => !localIds.has(record.id))
  const lifecycle = params.lifecycle ?? 'active'
  const remoteItems = remoteItemsWithoutLifecycle.filter((record) => (
    lifecycle === 'all'
      ? true
      : lifecycle === 'active'
        ? isActiveDemandStatus(record.status)
        : !isActiveDemandStatus(record.status)
  ))
  const data = [...localItems, ...remoteItems]

  return {
    data,
    total: data.length,
    activeCount: remoteItemsWithoutLifecycle.filter((record) => isActiveDemandStatus(record.status)).length + localItemsWithoutLifecycle.filter((record) => isActiveDemandStatus(record.status)).length,
    historyCount: remoteItemsWithoutLifecycle.filter((record) => !isActiveDemandStatus(record.status)).length + localItemsWithoutLifecycle.filter((record) => !isActiveDemandStatus(record.status)).length,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
