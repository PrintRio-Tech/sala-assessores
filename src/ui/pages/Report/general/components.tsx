import type { ReactNode } from 'react'
import { Button, Card, Heading, Text } from '@print/ui'

import type { HeatmapCell, RankCount } from '@/domain/Report/press-room-report'
import { formatHeatmapMonth, formatReportNumber, heatmapIntensity } from './format'
import styles from './styles.module.scss'

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export function ReportsHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.eyebrow}>
        <span className={styles.dot} aria-hidden="true" />
        <Text as="span" variant="labelMd" className={styles.eyebrowText}>
          Relatórios
        </Text>
      </div>
      <Heading level={1} variant="xl" className={styles.title}>
        Visão geral de <span className={styles.emphasis}>impacto.</span>
      </Heading>
    </header>
  )
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 74
      const y = 36 - (value / max) * 32
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className={styles.sparkline} viewBox="0 0 74 38" aria-hidden>
      <polyline points={points} />
    </svg>
  )
}

export function ReportKpiCard({
  label,
  value,
  hint,
  sparkline,
  variant = 'default',
}: {
  label: string
  value: string
  hint?: string
  sparkline?: number[]
  variant?: 'default' | 'primary'
}) {
  return (
    <Card
      variant={variant === 'primary' ? 'primary' : 'elevated'}
      padding="lg"
      className={variant === 'primary' ? styles.kpiPrimary : styles.kpiCard}
    >
      <Text as="p" variant="labelSm" className={styles.kpiLabel}>{label}</Text>
      <Heading as="p" variant="lg" className={styles.kpiValue}>{value}</Heading>
      {hint ? <Text variant="labelSm" className={styles.kpiHint}>{hint}</Text> : null}
      {sparkline ? <Sparkline values={sparkline} /> : null}
    </Card>
  )
}

export function ReportHighlightCard({
  name,
  outletName,
  publishedCount,
}: {
  name: string | null
  outletName: string | null
  publishedCount: number
}) {
  return (
    <Card variant="elevated" padding="lg" className={styles.kpiCard}>
      <Text as="p" variant="labelSm" className={styles.kpiLabel}>Jornalista em destaque</Text>
      {name ? (
        <>
          <Heading as="p" variant="sm" className={styles.highlightName}>{name}</Heading>
          <Text variant="labelSm" className={styles.kpiHint}>
            {outletName} · {formatReportNumber(publishedCount)} publicadas
          </Text>
        </>
      ) : (
        <Text tone="muted">Nenhum resultado publicado no período.</Text>
      )}
    </Card>
  )
}

export function ReportHeatmap({
  title,
  cells,
}: {
  title: string
  cells: HeatmapCell[]
}) {
  const months = [...new Set(cells.map((cell) => cell.yearMonth))]
  const priorities = ['critical', 'high', 'medium', 'low']
  const max = Math.max(0, ...cells.map((cell) => cell.count))
  const valueMap = new Map(cells.map((cell) => [`${cell.priority}|${cell.yearMonth}`, cell.count]))

  return (
    <Card variant="elevated" padding="none" className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <Heading level={2} variant="sm" className={styles.chartTitle}>{title}</Heading>
      </div>
      <div className={styles.heatmapWrapper}>
        <div
          className={styles.heatmap}
          style={{ gridTemplateColumns: `7rem repeat(${Math.max(months.length, 1)}, minmax(1.5rem, 1fr))` }}
        >
          <span />
          {months.map((month) => (
            <span key={month} className={styles.heatmapHeader}>{formatHeatmapMonth(month)}</span>
          ))}
          {priorities.flatMap((priority) => [
            <span key={`${priority}-label`} className={styles.heatmapLabel}>
              {PRIORITY_LABELS[priority]}
            </span>,
            ...months.map((month) => {
              const count = valueMap.get(`${priority}|${month}`) ?? 0
              return (
                <span
                  key={`${priority}-${month}`}
                  className={styles.heatmapCell}
                  data-intensity={heatmapIntensity(count, max)}
                  title={`${PRIORITY_LABELS[priority]} · ${month}: ${count}`}
                />
              )
            }),
          ])}
        </div>
      </div>
    </Card>
  )
}

export function ReportBarList({
  title,
  items,
}: {
  title: string
  items: RankCount[] | Array<{ name: string; count: number; hint?: string }>
}) {
  const normalized = items.map((item) => (
    'label' in item
      ? { key: item.key, label: item.label, hint: undefined, count: item.count }
      : { key: item.name, label: item.name, hint: item.hint, count: item.count }
  ))
  const max = Math.max(1, ...normalized.map((item) => item.count))

  return (
    <Card variant="elevated" padding="none" className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <Heading level={2} variant="sm" className={styles.chartTitle}>{title}</Heading>
      </div>
      <ul className={styles.barsList}>
        {normalized.map((item) => (
          <li key={item.key} className={styles.barItem}>
            <div className={styles.barHeader}>
              <span className={styles.barLabel}>
                {item.label}
                {item.hint ? <small>{item.hint}</small> : null}
              </span>
              <span className={styles.barValue}>{formatReportNumber(item.count)}</span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function ReportsLoadingState() {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <Text tone="muted">Gerando relatório…</Text>
    </div>
  )
}

export function ReportsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <Text tone="muted">Não foi possível carregar o relatório.</Text>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

export function ReportsEmptyState() {
  return (
    <div className={styles.state}>
      <Text tone="muted">Nenhum dado encontrado para os filtros selecionados.</Text>
    </div>
  )
}

export function ChartPanel({ children }: { children: ReactNode }) {
  return <div className={styles.chartsGrid}>{children}</div>
}
