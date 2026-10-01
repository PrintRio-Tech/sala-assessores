import type { Demand } from '@/domain/Demand/demand.entity'
import type { DemandRepository } from '@/domain/Demand/demand.repository'
import type {
  PressRoomReport,
  PressRoomReportFilter,
} from '@/domain/Report/press-room-report'

const PRIORITY_ORDER = ['low', 'medium', 'high', 'critical'] as const
const PRIORITY_LABELS: Record<(typeof PRIORITY_ORDER)[number], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}
const ORIGIN_ORDER = ['solicited', 'proactive'] as const
const ORIGIN_LABELS: Record<(typeof ORIGIN_ORDER)[number], string> = {
  solicited: 'Solicitada',
  proactive: 'Proativa',
}
const PUBLISHED_ORDER = ['yes', 'no', 'unknown'] as const
const PUBLISHED_LABELS: Record<(typeof PUBLISHED_ORDER)[number], string> = {
  yes: 'Publicado',
  no: 'Não publicado',
  unknown: 'Indefinido',
}

export type ComputePressRoomReportOptions = {
  filter?: PressRoomReportFilter | null
  journalistCount?: number
  now?: Date
}

function civilDate(value: Date): string {
  const year = String(value.getUTCFullYear())
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function yearMonthOf(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 7)
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`
}

function shiftYearMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return yearMonthOf(new Date(Date.UTC(year, month - 1 + delta, 1)))
}

function monthsBetween(fromYm: string, toYm: string): string[] {
  const months: string[] = []
  let cursor = fromYm
  while (cursor <= toYm) {
    months.push(cursor)
    cursor = shiftYearMonth(cursor, 1)
  }
  return months
}

function resolveMonthWindow(filter: PressRoomReportFilter | null | undefined, now: Date): string[] {
  if (filter?.dateFrom || filter?.dateTo) {
    const from = filter.dateFrom ?? filter.dateTo ?? civilDate(now)
    const to = filter.dateTo ?? filter.dateFrom ?? civilDate(now)
    const start = yearMonthOf(from) <= yearMonthOf(to) ? yearMonthOf(from) : yearMonthOf(to)
    const end = yearMonthOf(from) <= yearMonthOf(to) ? yearMonthOf(to) : yearMonthOf(from)
    return monthsBetween(start, end)
  }
  const end = yearMonthOf(now)
  return monthsBetween(shiftYearMonth(end, -11), end)
}

function matchesFilter(demand: Demand, filter: PressRoomReportFilter | null | undefined): boolean {
  if (filter?.responsibleId && demand.responsibleId !== filter.responsibleId) return false
  const created = civilDate(demand.createdAt)
  if (filter?.dateFrom && created < filter.dateFrom) return false
  if (filter?.dateTo && created > filter.dateTo) return false
  return true
}

function uniqueJournalistCount(demands: Demand[]): number {
  return new Set(
    demands
      .map((item) => item.journalistId.trim() || item.journalistName.trim())
      .filter(Boolean),
  ).size
}

export function computePressRoomReport(
  demands: Demand[],
  options: ComputePressRoomReportOptions = {},
): PressRoomReport {
  const now = options.now ?? new Date()
  const filtered = demands.filter((item) => matchesFilter(item, options.filter))
  const months = resolveMonthWindow(options.filter, now)
  const outcomes = filtered
    .map((item) => item.outcome)
    .filter((item): item is NonNullable<Demand['outcome']> => item != null)
  const tones = outcomes.map((item) => item.toneScore)

  const outletCounts = new Map<string, number>()
  const journalistCounts = new Map<string, { name: string; outletName: string; count: number }>()
  const publishedByJournalist = new Map<string, { name: string; outletName: string; publishedCount: number }>()

  for (const item of filtered) {
    const outlet = item.outletName.trim()
    if (outlet) outletCounts.set(outlet, (outletCounts.get(outlet) ?? 0) + 1)
    const name = item.journalistName.trim()
    if (!name) continue
    const key = `${name}|${item.outletName.trim()}`
    const current = journalistCounts.get(key) ?? { name, outletName: item.outletName.trim(), count: 0 }
    current.count += 1
    journalistCounts.set(key, current)
    if (item.outcome?.published === 'yes') {
      const published = publishedByJournalist.get(key) ?? { name, outletName: item.outletName.trim(), publishedCount: 0 }
      published.publishedCount += 1
      publishedByJournalist.set(key, published)
    }
  }

  const highlight = [...publishedByJournalist.values()].sort(
    (a, b) => b.publishedCount - a.publishedCount || a.name.localeCompare(b.name),
  )[0] ?? null

  return {
    demandCount: filtered.length,
    inProgressCount: filtered.filter((item) => item.status === 'in_progress').length,
    sentCount: filtered.filter((item) => item.status === 'sent').length,
    closedWithoutSendCount: filtered.filter((item) => item.status === 'closed_without_send').length,
    journalistCount: options.journalistCount ?? uniqueJournalistCount(demands),
    outcomeCount: outcomes.length,
    publishedCount: outcomes.filter((item) => item.published === 'yes').length,
    averageToneScore: tones.length ? tones.reduce((sum, value) => sum + value, 0) / tones.length : null,
    demandsByMonth: months.map((yearMonth) => ({
      yearMonth,
      count: filtered.filter((item) => yearMonthOf(item.createdAt) === yearMonth).length,
    })),
    publishedByMonth: months.map((yearMonth) => ({
      yearMonth,
      count: filtered.filter(
        (item) => item.outcome?.published === 'yes' && yearMonthOf(item.createdAt) === yearMonth,
      ).length,
    })),
    byPriority: PRIORITY_ORDER.map((key) => ({
      key,
      label: PRIORITY_LABELS[key],
      count: filtered.filter((item) => item.priority === key).length,
    })),
    byOrigin: ORIGIN_ORDER.map((key) => ({
      key,
      label: ORIGIN_LABELS[key],
      count: filtered.filter((item) => item.origin === key).length,
    })),
    byPublished: PUBLISHED_ORDER.map((key) => ({
      key,
      label: PUBLISHED_LABELS[key],
      count: outcomes.filter((item) => item.published === key).length,
    })),
    heatmap: PRIORITY_ORDER.flatMap((priority) =>
      months.map((yearMonth) => ({
        priority,
        yearMonth,
        count: filtered.filter(
          (item) => item.priority === priority && yearMonthOf(item.createdAt) === yearMonth,
        ).length,
      })),
    ),
    toneDistribution: [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: outcomes.filter((item) => item.toneScore === score).length,
    })),
    topOutlets: [...outletCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5),
    topJournalists: [...journalistCounts.values()]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5),
    highlight,
  }
}

export class GetPressRoomReport {
  private readonly repo: DemandRepository

  constructor(repo: DemandRepository) {
    this.repo = repo
  }

  async execute(filter?: PressRoomReportFilter): Promise<PressRoomReport> {
    const { items } = await this.repo.list({ lifecycle: 'all', status: 'all' })
    return computePressRoomReport(items, { filter })
  }
}
