export const ROUTES = {
  home: '/',
  demands: '/demandas',
  journalists: '/jornalistas',
  reports: '/relatorios',
  demand: (id: string) => `/demandas/${id}`,
  journalist: (id: string) => `/jornalistas/${id}`,
} as const

export function demandPath(id: string) {
  return ROUTES.demand(id)
}

export function journalistPath(id: string) {
  return ROUTES.journalist(id)
}
