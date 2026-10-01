import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandRepository } from '@/domain/Demand/demand.repository'
import type { PressRoomReport } from '@/domain/Report/press-room-report'

export function computePressRoomReport(demands: Demand[]): PressRoomReport {
  const inProgressCount = demands.filter((item) => item.status === 'in_progress').length
  const sentCount = demands.filter((item) => item.status === 'sent').length
  const closedWithoutSendCount = demands.filter((item) => item.status === 'closed_without_send').length
  const journalists = new Set(
    demands
      .map((item) => item.journalistId.trim() || item.journalistName.trim())
      .filter(Boolean),
  )
  const outcomes = demands
    .map((item) => item.outcome)
    .filter((item): item is NonNullable<typeof item> => item != null)
  const publishedCount = outcomes.filter((item) => item.published === 'yes').length
  const averageToneScore = outcomes.length
    ? outcomes.reduce((sum, item) => sum + item.toneScore, 0) / outcomes.length
    : null

  return {
    demandCount: demands.length,
    inProgressCount,
    sentCount,
    closedWithoutSendCount,
    journalistCount: journalists.size,
    outcomeCount: outcomes.length,
    publishedCount,
    averageToneScore,
  }
}

export class GetPressRoomReport {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(): Promise<PressRoomReport> {
    const { items } = await this.repo.list({ lifecycle: 'all', status: 'all' })
    return computePressRoomReport(items)
  }
}
