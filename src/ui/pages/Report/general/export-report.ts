import type { PressRoomReport } from '@/domain/Report/press-room-report'

function buildCsv(report: PressRoomReport) {
  const rows: string[][] = [
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

  for (const item of report.demandsByMonth) {
    rows.push([`Demandas ${item.yearMonth}`, String(item.count)])
  }
  for (const item of report.publishedByMonth) {
    rows.push([`Publicadas ${item.yearMonth}`, String(item.count)])
  }
  for (const item of report.byPriority) {
    rows.push([`Prioridade ${item.label}`, String(item.count)])
  }
  for (const item of report.byOrigin) {
    rows.push([`Origem ${item.label}`, String(item.count)])
  }

  return rows.map((row) => row.join(',')).join('\n')
}

export function downloadReport(report: PressRoomReport) {
  const today = new Date().toISOString().slice(0, 10)
  const blob = new Blob([buildCsv(report)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-sala-assessores-${today}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
