export const REPORT_KPIS = {
  totalDemands: 87,
  averageResponseTime: '2.3h',
  satisfactionRate: 92,
  topJournalists: [
    { name: 'Ana Silva', outlet: 'O Globo', count: 14 },
    { name: 'Carlos Mendes', outlet: 'Folha', count: 11 },
    { name: 'Beatriz Santos', outlet: 'Estado', count: 9 },
  ],
  demandsByStatus: {
    in_progress: 28,
    sent: 42,
    closed_without_send: 17,
  },
} as const

export type ReportExportFormat = 'csv' | 'json'
