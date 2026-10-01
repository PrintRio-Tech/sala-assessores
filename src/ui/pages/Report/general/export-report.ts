import type { PressRoomReport } from '@/application/modules/Report/hooks/use-press-room-report'

export type ReportExportFormat = 'csv' | 'json'

function buildCsv(report: PressRoomReport) {
  const rows = [
    ['Métrica', 'Valor'],
    ['Total de demandas', String(report.demandCount)],
    ['Em andamento', String(report.inProgressCount)],
    ['Enviadas', String(report.sentCount)],
    ['Encerradas sem envio', String(report.closedWithoutSendCount)],
    ['Jornalistas', String(report.journalistCount)],
    ['Resultados avaliados', String(report.outcomeCount)],
    ['Publicadas', String(report.publishedCount)],
    ['Tom médio', report.averageToneScore == null ? '' : String(report.averageToneScore)],
  ]
  return rows.map((row) => row.join(',')).join('\n')
}

function buildJson(report: PressRoomReport) {
  return JSON.stringify({
    generated_at: new Date().toISOString(),
    kpis: report,
  }, null, 2)
}

export function downloadReport(format: ReportExportFormat, report: PressRoomReport) {
  const today = new Date().toISOString().slice(0, 10)
  const content = format === 'json' ? buildJson(report) : buildCsv(report)
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
