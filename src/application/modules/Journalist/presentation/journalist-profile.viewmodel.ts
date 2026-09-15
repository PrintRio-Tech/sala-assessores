import type { LocalDemandCapture } from '@/application/modules/Demand/stores/local-demand.store'
import type { Demand, DemandStatus } from '@/domain/Demand/demand.entity'
import type { Journalist, JournalistDemandHistoryItem } from '@/domain/Journalist/journalist.entity'
import { normalizeJournalistTopics } from '@/domain/Journalist/journalist-profile'

type LinkedDemand = {
  id: string
  title: string
  journalistId: string
  status: DemandStatus
  updatedAt: Date
  topics: string[]
  hasPositioning: boolean
  kindLabel: string
}

const demandStatusLabels: Record<DemandStatus, string> = {
  in_progress: 'Em andamento',
  sent: 'Enviada',
  closed_without_send: 'Encerrada sem envio',
}

export function getJournalistDemandStatusLabel(status: string): string {
  return demandStatusLabels[status as DemandStatus] ?? status
}

function fromMockDemand(demand: Demand): LinkedDemand {
  return {
    id: demand.id,
    title: demand.title,
    journalistId: demand.journalistId,
    status: demand.status,
    updatedAt: demand.updatedAt,
    topics: demand.enrichment?.topics ?? [],
    hasPositioning: demand.interactions.some((item) => item.result === 'response_sent'),
    kindLabel: 'Demanda registrada',
  }
}

function fromLocalDemand(demand: LocalDemandCapture): LinkedDemand {
  return {
    id: demand.id,
    title: demand.subject,
    journalistId: demand.journalistId,
    status: demand.status,
    updatedAt: demand.updatedAt,
    topics: demand.enrichment.topics,
    hasPositioning: demand.interactions.some((item) => item.result === 'response_sent'),
    kindLabel: 'Demanda local',
  }
}

function toHistoryItem(demand: LinkedDemand): JournalistDemandHistoryItem {
  return {
    demandId: demand.id,
    title: demand.title,
    status: demand.status,
    occurredAt: demand.updatedAt,
    kindLabel: demand.kindLabel,
  }
}

export function buildJournalistProfileViewModel(
  journalist: Journalist,
  mockDemands: Demand[],
  localDemands: LocalDemandCapture[],
): Journalist {
  const demandsById = new Map<string, LinkedDemand>()
  for (const demand of mockDemands) demandsById.set(demand.id, fromMockDemand(demand))
  // Registros locais incluem as mutações feitas nesta sessão e, por isso,
  // substituem o snapshot seed/adotado quando compartilham a mesma identidade.
  for (const demand of localDemands) demandsById.set(demand.id, fromLocalDemand(demand))

  const linkedDemands = [...demandsById.values()]
    .filter((demand) => demand.journalistId === journalist.id)
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())

  const totalDemands = linkedDemands.length
  const sentCount = linkedDemands.filter((demand) => demand.status === 'sent').length
  const positioningCount = linkedDemands.filter((demand) => demand.hasPositioning).length
  const derivedTopics = linkedDemands.flatMap((demand) => demand.topics)

  return {
    ...journalist,
    topics: normalizeJournalistTopics([...derivedTopics, ...journalist.topics]),
    objectiveStats: {
      totalDemands,
      solicitedCount: totalDemands,
      proactiveCount: 0,
      successRate: totalDemands === 0 ? 0 : sentCount / totalDemands,
      positioningUsageRate: totalDemands === 0 ? 0 : positioningCount / totalDemands,
    },
    demandHistory: linkedDemands.map(toHistoryItem),
  }
}
