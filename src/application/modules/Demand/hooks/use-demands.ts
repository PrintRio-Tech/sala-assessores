import { useQuery } from '@tanstack/react-query'

import { demandService } from '@/application/composition'
import { queryKeys } from '@/application/constants/query-keys'
import type { DemandListParams } from '@/domain/Demand/demand.repository'
import { isActiveDemandStatus, type Demand } from '@/domain/Demand/demand.entity'
import { useLocalDemandStore, type LocalDemandCapture } from '../stores/local-demand.store'

export type DemandListItem = Demand | (LocalDemandCapture & { kind: 'local' })

function matchesCommon(record: LocalDemandCapture, params: DemandListParams) {
  const query = params.search?.trim().toLocaleLowerCase('pt-BR')
  if (query && ![record.subject, record.factContext, record.pressRequest, record.journalistName, record.outletName, record.id]
    .some((value) => value.toLocaleLowerCase('pt-BR').includes(query))) return false
  if (params.responsibleId && params.responsibleId !== 'all' && params.responsibleId !== record.responsibleId) return false
  if (params.deadlineOn && record.requestedDeadline !== params.deadlineOn) return false
  return true
}

function matchesLocal(record: LocalDemandCapture, params: DemandListParams) {
  const lifecycle = params.lifecycle ?? 'active'
  if (!matchesCommon(record, params)) return false
  if (params.status && params.status !== 'all' && params.status !== record.status) return false
  if (lifecycle === 'active' && !isActiveDemandStatus(record.status)) return false
  if (lifecycle === 'history' && isActiveDemandStatus(record.status)) return false
  return true
}

function asListItem(record: LocalDemandCapture): DemandListItem {
  return { ...record, kind: 'local' }
}

export function useDemands(params: DemandListParams = {}) {
  const commonParams: DemandListParams = {
    search: params.search,
    responsibleId: params.responsibleId,
    deadlineOn: params.deadlineOn,
    status: 'all',
    lifecycle: 'all',
  }
  const query = useQuery({
    queryKey: queryKeys.demands(commonParams),
    queryFn: () => demandService.list(commonParams),
  })
  const localRecords = useLocalDemandStore((state) => state.records)
  const hiddenIds = useLocalDemandStore((state) => state.hiddenIds)
  const visibleLocalRecords = localRecords.filter((record) => !hiddenIds.includes(record.id))
  const localItems = visibleLocalRecords.filter((record) => matchesLocal(record, params)).map(asListItem)
  const localItemsForCounts = visibleLocalRecords.filter((record) => matchesCommon(record, params))
  const localIds = new Set(visibleLocalRecords.map((record) => record.id))
  const remoteItemsForCounts = (query.data?.items ?? []).filter((record) => !localIds.has(record.id) && !hiddenIds.includes(record.id))
  const lifecycle = params.lifecycle ?? 'active'
  const status = params.status ?? 'all'
  const remoteItems = remoteItemsForCounts.filter((record) => {
    if (status !== 'all' && record.status !== status) return false
    if (lifecycle === 'all') return true
    return lifecycle === 'active' ? isActiveDemandStatus(record.status) : !isActiveDemandStatus(record.status)
  })
  const data = [...localItems, ...remoteItems]

  return {
    data,
    total: data.length,
    activeCount: remoteItemsForCounts.filter((record) => isActiveDemandStatus(record.status)).length + localItemsForCounts.filter((record) => isActiveDemandStatus(record.status)).length,
    historyCount: remoteItemsForCounts.filter((record) => !isActiveDemandStatus(record.status)).length + localItemsForCounts.filter((record) => !isActiveDemandStatus(record.status)).length,
    isLoading: query.isLoading,
    error: query.error,
    reload: query.refetch,
  }
}
