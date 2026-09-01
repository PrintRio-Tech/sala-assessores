import { useState } from 'react'
import { Button, Card, Heading, Icon as DsIcon, ICONS, Stat, Text } from '@print/ui'

import styles from '@/ui/styles/design.module.scss'
import pageStyles from './reports-page.module.scss'

type ExportFormat = 'csv' | 'json'

export function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false)

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const mockKpis = {
    demandsThisMonth: 42,
    positioningsSent: 18,
    journalistInteractions: 35,
    topJournalists: [
      { name: 'Ana Silva', outlet: 'O Globo', count: 14 },
      { name: 'Carlos Mendes', outlet: 'Folha', count: 11 },
      { name: 'Beatriz Santos', outlet: 'Estado', count: 9 },
    ],
    demandsByStatus: {
      draft: 5,
      in_progress: 12,
      pending_review: 3,
      approved: 8,
      sent: 42,
      closed_without_send: 17,
    },
  }

  const handleExport = (format: ExportFormat) => {
    setIsExporting(true)

    const data = {
      period: currentMonth,
      generated_at: new Date().toISOString(),
      kpis: mockKpis,
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = `relatorio-sala-assessores-${new Date().toISOString().slice(0, 10)}.json`
      mimeType = 'application/json'
    } else {
      const rows = [
        ['Métrica', 'Valor'],
        ['Demandas do mês', mockKpis.demandsThisMonth.toString()],
        ['Posicionamentos enviados', mockKpis.positioningsSent.toString()],
        ['Interações com jornalistas', mockKpis.journalistInteractions.toString()],
        ['', ''],
        ['Status', 'Quantidade'],
        ['Rascunho', mockKpis.demandsByStatus.draft.toString()],
        ['Em andamento', mockKpis.demandsByStatus.in_progress.toString()],
        ['Em review', mockKpis.demandsByStatus.pending_review.toString()],
        ['Aprovada', mockKpis.demandsByStatus.approved.toString()],
        ['Enviada', mockKpis.demandsByStatus.sent.toString()],
        ['Encerrada sem envio', mockKpis.demandsByStatus.closed_without_send.toString()],
        ['', ''],
        ['Top Jornalistas', 'Veículo', 'Demandas'],
        ...mockKpis.topJournalists.map(j => [j.name, j.outlet, j.count.toString()]),
      ]
      content = rows.map(row => row.join(',')).join('\n')
      filename = `relatorio-sala-assessores-${new Date().toISOString().slice(0, 10)}.csv`
      mimeType = 'text/csv;charset=utf-8;'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    setTimeout(() => setIsExporting(false), 500)
  }

  const hasJournalistData = mockKpis.topJournalists.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>
            Analytics e exportações
          </Text>
          <Heading level={1} className={styles.pageTitle}>
            Relatórios
          </Heading>
          <Text tone="muted">
            Indicadores de desempenho da assessoria de imprensa — {currentMonth}.
          </Text>
        </div>
        <div className={styles.headingActions}>
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
        <div className={pageStyles.kpiGrid}>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Demandas do mês"
              value={mockKpis.demandsThisMonth}
              trend={{ direction: 'up', label: '+4 vs. mês anterior' }}
            />
          </Card>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Posicionamentos enviados"
              value={mockKpis.positioningsSent}
            />
          </Card>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Interações com jornalistas"
              value={mockKpis.journalistInteractions}
              trend={{ direction: 'up', label: '+7 vs. mês anterior' }}
            />
          </Card>
        </div>
      </section>

      <div className={pageStyles.contentGrid}>
        <section aria-label="Distribuição por status">
          <div className={pageStyles.sectionHeading}>
            <Heading level={2} variant="sm">
              Demandas por status
            </Heading>
          </div>
          <Card padding="lg">
            <div className={pageStyles.distributionGrid}>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Rascunho
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.draft}
                </Text>
              </div>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Em andamento
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.in_progress}
                </Text>
              </div>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Em review
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.pending_review}
                </Text>
              </div>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Aprovada
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.approved}
                </Text>
              </div>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Enviada
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.sent}
                </Text>
              </div>
              <div className={pageStyles.statusItem}>
                <Text variant="labelSm" tone="muted" className={pageStyles.statusLabel}>
                  Sem envio
                </Text>
                <Text as="p" className={pageStyles.statusValue}>
                  {mockKpis.demandsByStatus.closed_without_send}
                </Text>
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Top jornalistas">
          <div className={pageStyles.sectionHeading}>
            <Heading level={2} variant="sm">
              Jornalistas mais ativos
            </Heading>
          </div>
          <Card padding="lg">
            {hasJournalistData ? (
              <div className={pageStyles.journalistsList}>
                {mockKpis.topJournalists.map((journalist, idx) => (
                  <div key={journalist.name} className={pageStyles.journalistItem}>
                    <div className={pageStyles.journalistRank}>{idx + 1}</div>
                    <div className={pageStyles.journalistInfo}>
                      <Text className={pageStyles.journalistName}>{journalist.name}</Text>
                      <Text className={pageStyles.journalistOutlet}>{journalist.outlet}</Text>
                    </div>
                    <Text className={pageStyles.journalistCount}>{journalist.count}</Text>
                  </div>
                ))}
              </div>
            ) : (
              <div className={pageStyles.emptyState}>
                <Text className={pageStyles.emptyText}>
                  Nenhum jornalista ativo neste período.
                </Text>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
