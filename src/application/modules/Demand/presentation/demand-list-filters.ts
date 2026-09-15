import {
  getDemandStatusFilterValues,
  sanitizeDemandListStatus,
  type DemandListLifecycle,
  type DemandListStatusFilter,
} from '@/domain/Demand/demand.entity'
import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandCaptureRevision } from '@/domain/Demand/use-cases/revise-demand-capture.use-case'
import type { DemandListItem } from '../hooks/use-demands'
import type { LocalDemandCapture, NewLocalDemandCapture } from '../stores/local-demand.store'

export { sanitizeDemandListStatus }

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

export function isLocalDemandListItem(demand: DemandListItem): demand is Extract<DemandListItem, { kind: 'local' }> {
  return 'kind' in demand
}

export function demandListTitle(demand: DemandListItem) {
  return isLocalDemandListItem(demand) ? demand.subject : demand.title
}

export function demandListCode(demand: DemandListItem) {
  return demand.code
}

export function toDemandCaptureRevision(demand: DemandListItem): NewLocalDemandCapture {
  if (isLocalDemandListItem(demand)) {
    return {
      subject: demand.subject,
      factContext: demand.factContext,
      pressRequest: demand.pressRequest,
      requestedDeadline: demand.requestedDeadline,
      channel: demand.channel,
      contactMode: demand.contactMode,
      contactName: demand.contactName,
      contactOutlet: demand.contactOutlet,
      journalistId: demand.journalistId,
      journalistName: demand.journalistName,
      outletName: demand.outletName,
      priority: demand.priority,
      enrichment: demand.enrichment,
    }
  }

  return remoteDemandToCapture(demand)
}

function remoteDemandToCapture(demand: Demand): DemandCaptureRevision {
  return {
    subject: demand.title,
    factContext: demand.factContext ?? '',
    pressRequest: demand.requestSummary,
    requestedDeadline: demand.deadlineAt.toISOString().slice(0, 10),
    channel: demand.channel?.trim() ?? '',
    contactMode: demand.journalistId ? 'known' : 'local',
    contactName: demand.journalistName,
    contactOutlet: demand.outletName,
    journalistId: demand.journalistId,
    journalistName: demand.journalistName,
    outletName: demand.outletName,
    priority: demand.priority,
    enrichment: demand.enrichment ?? { tags: [], topics: [], relatedAreas: [], confirmedFacts: [], pendingFacts: [], nextStep: null },
  }
}

export function ensureLocalDemandRecord(demand: DemandListItem, adopt: (source: Demand) => LocalDemandCapture) {
  if (isLocalDemandListItem(demand)) return demand
  return adopt(demand)
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
