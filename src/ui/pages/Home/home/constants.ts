export const HOME_MONTH_KPIS = [
  {
    id: 'demands',
    label: 'Demandas em setembro',
    value: '8',
    hint: '5 em andamento',
  },
  {
    id: 'positionings',
    label: 'Posicionamentos enviados',
    value: '3',
    hint: 'Taxa de aprovação 86%',
  },
  {
    id: 'interactions',
    label: 'Interações com jornalistas',
    value: '12',
    hint: 'E-mail, telefone, reunião',
  },
] as const

export interface HomeDemandInProgress {
  id: string
  code: string
  title: string
  responsibleName: string
}

export const HOME_DEMANDS_IN_PROGRESS: HomeDemandInProgress[] = [
  { id: 'd-ceo', code: 'TEC-889', title: 'Entrevista exclusiva: CEO TechCorp', responsibleName: 'Ana Paula' },
  { id: 'd-portos', code: 'ECO-442', title: 'Crise Logística: Impacto nos Portos', responsibleName: 'Ricardo M.' },
]
