import {
  formatDemandCalendarDay,
  getDemandStatusFilterValues,
  sanitizeDemandListStatus,
  type DemandListLifecycle,
  type DemandListStatusFilter,
} from '@/domain/Demand/demand.entity'
import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandCaptureRevision } from '@/domain/Demand/demand.repository'
import type { DemandListItem } from '../hooks/use-demands'
import { EMPTY_DEMAND_ENRICHMENT } from '@/domain/Demand/demand.entity'

export { sanitizeDemandListStatus }
export type { DemandCaptureRevision as NewDemandCapture }

export function parseDemandStatusFilter(value: string | null): DemandListStatusFilter {
  if (!value || value === 'all') return 'all'
  return getDemandStatusFilterValues('active').includes(value as DemandListStatusFilter)
    || getDemandStatusFilterValues('history').includes(value as DemandListStatusFilter)
    ? value as DemandListStatusFilter
    : 'all'
}

const statusFilterLabels: Record<Exclude<DemandListStatusFilter, 'all'>, string> = {
  in_progress: 'Em andamento',
  sent: 'Enviadas',
  closed_without_send: 'Encerradas sem envio',
}

export function getDemandStatusFilterOptions(lifecycle: DemandListLifecycle) {
  return getDemandStatusFilterValues(lifecycle).map((value) => ({
    value,
    label: value === 'all'
      ? (lifecycle === 'history' ? 'Todos' : 'Todos os status')
      : statusFilterLabels[value],
  }))
}

export function demandListTitle(demand: DemandListItem) {
  return demand.title
}

export function demandListCode(demand: DemandListItem) {
  return demand.code
}

export function toDemandCaptureRevision(demand: Demand): DemandCaptureRevision {
  return {
    subject: demand.title,
    factContext: demand.factContext ?? '',
    pressRequest: demand.requestSummary,
    requestedDeadline: formatDemandCalendarDay(demand.deadlineAt),
    channel: demand.channel?.trim() ?? '',
    contactMode: demand.contactMode ?? (demand.journalistId ? 'known' : 'local'),
    contactName: demand.contactName ?? demand.journalistName,
    contactOutlet: demand.contactOutlet ?? demand.outletName,
    journalistId: demand.journalistId,
    journalistName: demand.journalistName,
    outletName: demand.outletName,
    origin: demand.origin,
    priority: demand.priority,
    enrichment: demand.enrichment ?? EMPTY_DEMAND_ENRICHMENT,
  }
}

export type AppliedDemandFilter = {
  key: 'q' | 'status' | 'responsible' | 'deadline'
  label: string
}

export function listAppliedDemandFilters(input: {
  search: string
  status: DemandListStatusFilter
  statusLabel: string
  responsibleId: string
  responsibleLabel: string
  deadlineOn: string
  deadlineLabel: string
}): AppliedDemandFilter[] {
  const applied: AppliedDemandFilter[] = []
  if (input.search.trim()) applied.push({ key: 'q', label: `Busca: ${input.search.trim()}` })
  if (input.status !== 'all') applied.push({ key: 'status', label: `Status: ${input.statusLabel}` })
  if (input.responsibleId !== 'all') applied.push({ key: 'responsible', label: `Responsável: ${input.responsibleLabel}` })
  if (input.deadlineOn) applied.push({ key: 'deadline', label: `Prazo: ${input.deadlineLabel}` })
  return applied
}
