import { useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  ICONS,
  SelectField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@print/ui'

import { useDemandResponsibles } from '@/application/modules/Demand/hooks/use-demand-responsibles'
import { usePressRoomReport } from '@/application/modules/Report/hooks/use-press-room-report'
import type { PressRoomReportFilter } from '@/domain/Report/press-room-report'
import { Icon as DsIcon } from '@/ui/components/DsIcon'
import {
  ChartPanel,
  ReportBarList,
  ReportHeatmap,
  ReportHighlightCard,
  ReportKpiCard,
  ReportToneBars,
  ReportToneStars,
  ReportsEmptyState,
  ReportsErrorState,
  ReportsHero,
  ReportsLoadingState,
} from './components'
import { downloadReport } from './export-report'
import { formatReportNumber, nearestToneStars } from './format'
import styles from './styles.module.scss'

const FILTER_ALL = 'all'

export function ReportsPage() {
  const [responsibleId, setResponsibleId] = useState(FILTER_ALL)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { data: responsibles } = useDemandResponsibles()

  const filter = useMemo<PressRoomReportFilter>(() => ({
    responsibleId: responsibleId === FILTER_ALL ? null : responsibleId,
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
  }), [responsibleId, dateFrom, dateTo])

  const { data: report, isLoading, error, reload } = usePressRoomReport(filter)
  const responsibleOptions = useMemo(() => [
    { value: FILTER_ALL, label: 'Todos os responsáveis' },
    ...responsibles.map((item) => ({ value: item.id, label: item.name })),
  ], [responsibles])

  const hasFilters = Boolean(filter.responsibleId || filter.dateFrom || filter.dateTo)
  const hasData = (report?.demandCount ?? 0) > 0

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <ReportsHero />
        <section aria-label="Filtros do relatório" className={styles.filters}>
          <div className={styles.responsible}>
            <SelectField
              label="Responsável"
              labelSize="sm"
              name="reports-responsible"
              options={responsibleOptions}
              value={responsibleId}
              onValueChange={setResponsibleId}
            />
          </div>
          <fieldset className={styles.dateGroup}>
            <legend className={styles.dateLegend}>Período</legend>
            <div className={styles.dateFields}>
              <DatePicker
                label="Data inicial"
                labelHidden
                hideHint
                placeholder="De"
                name="reports-from"
                value={dateFrom}
                max={dateTo || undefined}
                onValueChange={setDateFrom}
              />
              <DatePicker
                label="Data final"
                labelHidden
                hideHint
                placeholder="Até"
                name="reports-to"
                value={dateTo}
                min={dateFrom || undefined}
                onValueChange={setDateTo}
              />
            </div>
          </fieldset>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              className={styles.clear}
              onClick={() => {
                setResponsibleId(FILTER_ALL)
                setDateFrom('')
                setDateTo('')
              }}
            >
              Limpar
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className={styles.export}
            disabled={!report}
            onClick={() => report && downloadReport(report)}
          >
            <DsIcon src={ICONS.ui.download} size={18} />
            Exportar
          </Button>
        </section>
      </div>

      {isLoading ? <ReportsLoadingState /> : null}
      {!isLoading && error ? <ReportsErrorState onRetry={() => void reload()} /> : null}
      {!isLoading && !error && report && !hasData ? <ReportsEmptyState /> : null}

      {!isLoading && !error && report && hasData ? (
        <>
          <section aria-label="Indicadores principais" className={styles.kpiGrid}>
            <ReportKpiCard
              label="Total de demandas"
              value={formatReportNumber(report.demandCount)}
              sparkline={report.demandsByMonth.map((item) => item.count)}
            />
            <ReportKpiCard
              label="Publicadas"
              value={formatReportNumber(report.publishedCount)}
              variant="primary"
              sparkline={report.publishedByMonth.map((item) => item.count)}
            />
            <ReportKpiCard
              label="Tom médio"
              value={<ReportToneStars label="Tom médio" value={nearestToneStars(report.averageToneScore)} />}
              hint={`${formatReportNumber(report.outcomeCount)} resultados avaliados`}
            />
            <ReportHighlightCard
              name={report.highlight?.name ?? null}
              outletName={report.highlight?.outletName ?? null}
              publishedCount={report.highlight?.publishedCount ?? 0}
            />
          </section>

          <Tabs variant="segmented" defaultValue="demandas" className={styles.tabs}>
            <TabsList aria-label="Seções do relatório">
              <TabsTrigger value="demandas">Demandas</TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
              <TabsTrigger value="relacionamento">Relacionamento</TabsTrigger>
            </TabsList>
            <TabsContent value="demandas">
              <ChartPanel>
                <div className={styles.heatmapPane}>
                  <ReportHeatmap title="Mapa de calor: demandas por prioridade" cells={report.heatmap} />
                </div>
                <ReportBarList title="Demandas por origem" items={report.byOrigin} />
              </ChartPanel>
            </TabsContent>
            <TabsContent value="resultados">
              <ChartPanel>
                <ReportToneBars items={report.toneDistribution} />
                <ReportBarList title="Publicação" items={report.byPublished} />
              </ChartPanel>
            </TabsContent>
            <TabsContent value="relacionamento">
              <ChartPanel>
                <ReportBarList
                  title="Veículos"
                  items={report.topOutlets.map((item) => ({ name: item.name, count: item.count }))}
                />
                <ReportBarList
                  title="Jornalistas"
                  items={report.topJournalists.map((item) => ({
                    name: item.name,
                    hint: item.outletName,
                    count: item.count,
                  }))}
                />
              </ChartPanel>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}
