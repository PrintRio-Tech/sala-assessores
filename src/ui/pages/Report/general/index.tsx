import { useState } from 'react'
import { Button, Card, Heading, ICONS, Stat, Text } from '@print/ui'

import { Icon as DsIcon } from '@/ui/components/DsIcon'
import pageStyles from '@/ui/styles/design.module.scss'
import { usePressRoomReport } from '@/application/modules/Report/hooks/use-press-room-report'
import { downloadReport } from './export-report'
import styles from './styles.module.scss'

export function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const { data: report, isLoading } = usePressRoomReport()

  const handleExport = (format: 'csv' | 'json') => {
    if (!report) return
    setIsExporting(true)
    downloadReport(format, report)
    window.setTimeout(() => setIsExporting(false), 500)
  }

  const demandCount = report?.demandCount ?? (isLoading ? '…' : 0)
  const averageTone = report?.averageToneScore == null ? '—' : report.averageToneScore.toFixed(1)
  const publishedCount = report?.publishedCount ?? 0

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={pageStyles.eyebrow}>Analytics e exportações</Text>
          <Heading level={1} className={pageStyles.pageTitle}>Relatórios</Heading>
          <Text tone="muted">Projeção pressRoomReport do BFF.</Text>
        </div>
        <div className={pageStyles.headingActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={isExporting || !report}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('json')}
            disabled={isExporting || !report}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar JSON
          </Button>
        </div>
      </header>

      <section aria-label="KPIs principais">
        <div className={styles.statGrid}>
          <Stat label="Total de demandas" value={String(demandCount)} />
          <Stat label="Tom médio" value={averageTone} />
          <Stat label="Publicadas" value={String(publishedCount)} />
        </div>
      </section>

      <section aria-label="Distribuição por status">
        <Heading level={2} variant="sm" className={styles.sectionTitle}>Demandas por status</Heading>
        <Card padding="lg" className={styles.statusCard}>
          <div className={styles.statusGrid}>
            <Stat label="Em andamento" value={String(report?.inProgressCount ?? 0)} />
            <Stat label="Enviada" value={String(report?.sentCount ?? 0)} />
            <Stat label="Encerrada sem envio" value={String(report?.closedWithoutSendCount ?? 0)} />
          </div>
        </Card>
      </section>

      <section aria-label="Base e avaliações">
        <Heading level={2} variant="sm" className={styles.sectionTitle}>Base e avaliações</Heading>
        <Card padding="lg">
          <div className={styles.statusGrid}>
            <Stat label="Jornalistas" value={String(report?.journalistCount ?? 0)} />
            <Stat label="Resultados avaliados" value={String(report?.outcomeCount ?? 0)} />
          </div>
        </Card>
      </section>
    </div>
  )
}
