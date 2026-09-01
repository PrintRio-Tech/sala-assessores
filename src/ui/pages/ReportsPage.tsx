import { useState } from 'react'
import { Button, Card, Heading, Icon as DsIcon, ICONS, Stat, Text } from '@print/ui'

import styles from '@/ui/styles/design.module.scss'

type ExportFormat = 'csv' | 'json'

export function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false)

  const mockKpis = {
    totalDemands: 87,
    averageResponseTime: '2.3h',
    satisfactionRate: 92,
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
      period: 'Últimos 30 dias',
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
        ['Total de demandas', mockKpis.totalDemands.toString()],
        ['Tempo médio de resposta', mockKpis.averageResponseTime],
        ['Taxa de satisfação (%)', mockKpis.satisfactionRate.toString()],
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

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>Analytics e exportações</Text>
          <Heading level={1} className={styles.pageTitle}>Relatórios</Heading>
          <Text tone="muted">Indicadores de desempenho da assessoria de imprensa.</Text>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <Stat
            label="Total de demandas"
            value={mockKpis.totalDemands}
            subtitle="Últimos 30 dias"
          />
          <Stat
            label="Tempo médio de resposta"
            value={mockKpis.averageResponseTime}
            subtitle="Primeira interação"
          />
          <Stat
            label="Taxa de satisfação"
            value={`${mockKpis.satisfactionRate}%`}
            tone="success"
            trend={{ direction: 'up', label: '+3% vs. mês anterior' }}
          />
        </div>
      </section>

      <section aria-label="Distribuição por status">
        <Heading level={2} variant="sm" style={{ marginBottom: '16px' }}>Demandas por status</Heading>
        <Card padding="lg" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
            <div>
              <Text variant="labelSm" tone="muted">Rascunho</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.draft}</Text>
            </div>
            <div>
              <Text variant="labelSm" tone="muted">Em andamento</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.in_progress}</Text>
            </div>
            <div>
              <Text variant="labelSm" tone="muted">Em review</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.pending_review}</Text>
            </div>
            <div>
              <Text variant="labelSm" tone="muted">Aprovada</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.approved}</Text>
            </div>
            <div>
              <Text variant="labelSm" tone="muted">Enviada</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.sent}</Text>
            </div>
            <div>
              <Text variant="labelSm" tone="muted">Encerrada sem envio</Text>
              <Text as="p" variant="headingLg" style={{ marginTop: '8px' }}>{mockKpis.demandsByStatus.closed_without_send}</Text>
            </div>
          </div>
        </Card>
      </section>

      <section aria-label="Top jornalistas">
        <Heading level={2} variant="sm" style={{ marginBottom: '16px' }}>Jornalistas mais ativos</Heading>
        <Card padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockKpis.topJournalists.map((journalist, idx) => (
              <div key={journalist.name} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: idx < mockKpis.topJournalists.length - 1 ? '16px' : '0', borderBottom: idx < mockKpis.topJournalists.length - 1 ? '1px solid var(--pf-color-outline-variant)' : 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--pf-color-primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: '14px' }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="labelMd" style={{ fontWeight: 600 }}>{journalist.name}</Text>
                  <Text variant="labelSm" tone="muted">{journalist.outlet}</Text>
                </div>
                <Text variant="headingMd" style={{ fontWeight: 600, color: 'var(--pf-color-primary)' }}>
                  {journalist.count}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
