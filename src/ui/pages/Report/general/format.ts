export function formatReportNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function nearestToneStars(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null
  return Math.min(5, Math.max(1, Math.round(value)))
}

export function formatHeatmapMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  const monthLabel = date
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')
    .trim()
  return monthLabel.charAt(0).toLocaleUpperCase('pt-BR') + monthLabel.slice(1)
}

export function heatmapIntensity(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}
