import { useState } from 'react'
import { Button, Card, Heading, Icon as DsIcon, ICONS, Stat, Text } from '@print/ui'

import pageStyles from '@/ui/styles/design.module.scss'
import { REPORT_KPIS } from './constants'
import { downloadReport } from './export-report'
import styles from './styles.module.scss'

export function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = (format: 'csv' | 'json') => {
    setIsExporting(true)
    downloadReport(format)
    window.setTimeout(() => setIsExporting(false), 500)
  }

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={pageStyles.eyebrow}>Analytics e exportações</Text>
          <Heading level={1} className={pageStyles.pageTitle}>Relatórios</Heading>
          <Text tone="muted">Indicadores de desempenho da assessoria de imprensa.</Text>
        </div>
        <div className={pageStyles.headingActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('json')}
            disabled={isExporting}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar JSON
          </Button>
        </div>
      </header>

      <section aria-label="KPIs principais">
        <div className={styles.statGrid}>
          <Stat label="Total de demandas" value={String(REPORT_KPIS.totalDemands)} />
          <Stat label="Tempo médio de resposta" value={REPORT_KPIS.averageResponseTime} />
          <Stat label="Taxa de satisfação" value={`${REPORT_KPIS.satisfactionRate}%`} />
        </div>
      </section>

      <section aria-label="Distribuição por status">
        <Heading level={2} variant="sm" className={styles.sectionTitle}>Demandas por status</Heading>
        <Card padding="lg" className={styles.statusCard}>
          <div className={styles.statusGrid}>
            <Stat label="Em andamento" value={String(REPORT_KPIS.demandsByStatus.in_progress)} />
            <Stat label="Enviada" value={String(REPORT_KPIS.demandsByStatus.sent)} />
            <Stat label="Encerrada sem envio" value={String(REPORT_KPIS.demandsByStatus.closed_without_send)} />
          </div>
        </Card>
      </section>

      <section aria-label="Top jornalistas">
        <Heading level={2} variant="sm" className={styles.sectionTitle}>Jornalistas mais ativos</Heading>
        <Card padding="lg">
          <div className={styles.ranking}>
            {REPORT_KPIS.topJournalists.map((journalist, index) => (
              <div key={journalist.name} className={styles.rankingRow}>
                <div className={styles.rankBadge}>{index + 1}</div>
                <div className={styles.rankCopy}>
                  <Text variant="labelMd">{journalist.name}</Text>
                  <Text variant="labelSm" tone="muted">{journalist.outlet}</Text>
                </div>
                <Text as="p" variant="bodyLg">{journalist.count}</Text>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
