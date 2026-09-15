import { REPORT_KPIS, type ReportExportFormat } from './constants'

function buildCsv() {
  const rows = [
    ['Métrica', 'Valor'],
    ['Total de demandas', String(REPORT_KPIS.totalDemands)],
    ['Tempo médio de resposta', REPORT_KPIS.averageResponseTime],
    ['Taxa de satisfação (%)', String(REPORT_KPIS.satisfactionRate)],
    ['', ''],
    ['Status', 'Quantidade'],
    ['Em andamento', String(REPORT_KPIS.demandsByStatus.in_progress)],
    ['Enviada', String(REPORT_KPIS.demandsByStatus.sent)],
    ['Encerrada sem envio', String(REPORT_KPIS.demandsByStatus.closed_without_send)],
    ['', ''],
    ['Top Jornalistas', 'Veículo', 'Demandas'],
    ...REPORT_KPIS.topJournalists.map((journalist) => [
      journalist.name,
      journalist.outlet,
      String(journalist.count),
    ]),
  ]
  return rows.map((row) => row.join(',')).join('\n')
}

function buildJson() {
  return JSON.stringify({
    period: 'Últimos 30 dias',
    generated_at: new Date().toISOString(),
    kpis: REPORT_KPIS,
  }, null, 2)
}

export function downloadReport(format: ReportExportFormat) {
  const today = new Date().toISOString().slice(0, 10)
  const content = format === 'json' ? buildJson() : buildCsv()
  const filename = `relatorio-sala-assessores-${today}.${format}`
  const mimeType = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
