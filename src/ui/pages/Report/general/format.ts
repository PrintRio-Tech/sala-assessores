export function formatReportNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatTone(value: number | null): string {
  return value == null ? '—' : value.toFixed(1)
}

export function formatHeatmapMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  const monthLabel = date
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')
  return `${monthLabel}. de ${String(year).slice(2)}`
}

export function heatmapIntensity(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}
