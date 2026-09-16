import type { DemandPriority } from '@/domain/Demand/demand.entity'

export const DEMAND_PRIORITY_LABELS: Record<DemandPriority, string> = {
  critical: 'P0 · Crítica',
  high: 'P1 · Alta',
  medium: 'P2 · Média',
  low: 'P3 · Baixa',
}

export const DEMAND_PRIORITY_OPTIONS: Array<{ value: DemandPriority; label: string }> = [
  { value: 'low', label: DEMAND_PRIORITY_LABELS.low },
  { value: 'medium', label: DEMAND_PRIORITY_LABELS.medium },
  { value: 'high', label: DEMAND_PRIORITY_LABELS.high },
  { value: 'critical', label: DEMAND_PRIORITY_LABELS.critical },
]
