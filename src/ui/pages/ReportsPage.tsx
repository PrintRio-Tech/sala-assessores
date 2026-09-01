import { useState } from 'react'
import { Button, Card, DatePicker, Heading, Icon as DsIcon, ICONS, SelectField, Stat, Text } from '@print/ui'

import styles from '@/ui/styles/design.module.scss'
import pageStyles from './reports-page.module.scss'

type ExportFormat = 'csv' | 'json'

export function ReportsPage() {
  const [selectedOffice, setSelectedOffice] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  const officeOptions = [
    { label: 'Todos os escritórios', value: '' },
    { label: 'São Paulo', value: 'sp' },
    { label: 'Rio de Janeiro', value: 'rj' },
    { label: 'Brasília', value: 'bsb' },
  ]

  const mockKpis = {
    demandsThisMonth: 42,
    positioningsSent: 18,
    journalistInteractions: 35,
    activeOutlets: 12,
    demandsByType: [
      { type: 'Pauta', value: 87, color: 'pauta' },
      { type: 'Entrevista', value: 64, color: 'entrevista' },
      { type: 'Posicionamento', value: 42, color: 'posicionamento' },
      { type: 'Follow-up', value: 38, color: 'followup' },
      { type: 'Reunião', value: 24, color: 'reuniao' },
    ],
    heatmapData: {
      types: ['Pauta', 'Entrevista', 'Posicionamento', 'Follow-up', 'Reunião'],
      months: ['08/25', '09/25', '10/25', '11/25', '12/25', '01/26', '02/26'],
      data: [
        [3, 4, 3, 2, 4, 3, 2],
        [2, 3, 2, 3, 3, 4, 3],
        [1, 2, 1, 1, 2, 2, 1],
        [2, 2, 3, 2, 1, 2, 3],
        [1, 1, 2, 1, 1, 1, 2],
      ],
    },
  }

  const sparklinePoints = '0,20 10,15 20,18 30,8 40,12 50,5 60,10 70,3'

  const handleExport = (format: ExportFormat) => {
    setIsExporting(true)

    const period = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`
      : 'Período completo'

    const data = {
      period,
      office: selectedOffice || 'Todos os escritórios',
      generated_at: new Date().toISOString(),
      kpis: {
        demandsThisMonth: mockKpis.demandsThisMonth,
        positioningsSent: mockKpis.positioningsSent,
        journalistInteractions: mockKpis.journalistInteractions,
        activeOutlets: mockKpis.activeOutlets,
      },
      demandsByType: mockKpis.demandsByType,
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = `relatorio-assessoria-${new Date().toISOString().slice(0, 10)}.json`
      mimeType = 'application/json'
    } else {
      const rows = [
        ['Relatório de Assessoria de Imprensa'],
        ['Período', period],
        ['Escritório', data.office],
        ['Gerado em', new Date().toLocaleString('pt-BR')],
        [''],
        ['KPIs'],
        ['Demandas do mês', mockKpis.demandsThisMonth.toString()],
        ['Posicionamentos enviados', mockKpis.positioningsSent.toString()],
        ['Interações com jornalistas', mockKpis.journalistInteractions.toString()],
        ['Veículos ativos', mockKpis.activeOutlets.toString()],
        [''],
        ['Demandas por tipo', 'Quantidade'],
        ...mockKpis.demandsByType.map(d => [d.type, d.value.toString()]),
      ]
      content = rows.map(row => row.join(',')).join('\n')
      filename = `relatorio-assessoria-${new Date().toISOString().slice(0, 10)}.csv`
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

  const maxValue = Math.max(...mockKpis.demandsByType.map(d => d.value))

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <Text as="p" variant="labelSm" tone="primary" className={styles.eyebrow}>
            Relatórios
          </Text>
          <Heading level={1} className={pageStyles.heroTitle}>
            Visão geral de <span className={pageStyles.heroEmphasis}>cobertura</span>.
          </Heading>
        </div>
      </header>

      <section aria-label="Filtros">
        <div className={pageStyles.filtersBar}>
          <SelectField
            label="Escritório"
            labelSize="sm"
            name="office"
            placeholder="Todos os escritórios"
            contained
            hideHint
            options={officeOptions}
            value={selectedOffice}
            onValueChange={setSelectedOffice}
          />
          <DatePicker
            label="De"
            labelSize="sm"
            name="startDate"
            hideHint
            value={startDate}
            onValueChange={setStartDate}
          />
          <DatePicker
            label="Até"
            labelSize="sm"
            name="endDate"
            hideHint
            value={endDate}
            onValueChange={setEndDate}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar
          </Button>
        </div>
      </section>

      <section aria-label="KPIs principais">
        <div className={pageStyles.kpiGrid}>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Demandas do mês"
              value={mockKpis.demandsThisMonth}
              trend={{ direction: 'up', label: '+4 vs. anterior' }}
            />
          </Card>
          <Card padding="lg" className={`${pageStyles.kpiCard} ${pageStyles.kpiHighlight}`}>
            <Stat
              label="Posicionamentos enviados"
              value={mockKpis.positioningsSent}
            />
            <div className={pageStyles.sparklineContainer}>
              <svg className={pageStyles.sparkline} viewBox="0 0 70 20" preserveAspectRatio="none">
                <polyline points={sparklinePoints} vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </Card>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Interações com jornalistas"
              value={mockKpis.journalistInteractions}
              trend={{ direction: 'up', label: '+7 vs. anterior' }}
            />
          </Card>
          <Card padding="lg" className={pageStyles.kpiCard}>
            <Stat
              label="Veículos ativos"
              value={mockKpis.activeOutlets}
            />
          </Card>
        </div>
      </section>

      <div className={pageStyles.chartsGrid}>
        <section aria-label="Mapa de calor" className={pageStyles.chartSection}>
          <div className={pageStyles.chartHeader}>
            <h2 className={pageStyles.chartTitle}>Mapa de calor: demandas por tipo</h2>
          </div>
          <Card padding="none" className={pageStyles.chartCard}>
            <div className={pageStyles.heatmapWrapper}>
              <div className={pageStyles.heatmap}>
                <div />
                {mockKpis.heatmapData.months.map((month) => (
                  <div key={month} className={pageStyles.heatmapHeader}>
                    {month}
                  </div>
                ))}
                {mockKpis.heatmapData.types.map((type, rowIdx) => (
                  <>
                    <div key={`label-${type}`} className={pageStyles.heatmapLabel}>
                      {type}
                    </div>
                    {mockKpis.heatmapData.data[rowIdx].map((intensity, colIdx) => (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className={pageStyles.heatmapCell}
                        data-intensity={intensity}
                        title={`${type} - ${mockKpis.heatmapData.months[colIdx]}: intensidade ${intensity}`}
                      />
                    ))}
                  </>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Demandas por tipo" className={pageStyles.chartSection}>
          <div className={pageStyles.chartHeader}>
            <h2 className={pageStyles.chartTitle}>Demandas por tipo</h2>
          </div>
          <Card padding="lg" className={pageStyles.chartCard}>
            <div className={pageStyles.barsWrapper}>
              <div className={pageStyles.barsList}>
                {mockKpis.demandsByType.map((item) => (
                  <div key={item.type} className={pageStyles.barItem}>
                    <div className={pageStyles.barHeader}>
                      <span className={pageStyles.barLabel}>{item.type}</span>
                      <span className={pageStyles.barValue}>{item.value}</span>
                    </div>
                    <div className={pageStyles.barTrack}>
                      <div
                        className={pageStyles.barFill}
                        data-type={item.color}
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
