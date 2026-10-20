export const ROUTES = {
  home: '/',
  login: '/login',
  verify: '/login/verificar',
  demands: '/demandas',
  releases: '/releases',
  releaseCreate: '/releases/novo',
  journalists: '/jornalistas',
  reports: '/relatorios',
  demand: (id: string) => `/demandas/${id}`,
  releaseEdit: (id: string) => `/releases/${id}/editar`,
  journalist: (id: string) => `/jornalistas/${id}`,
} as const

export function demandPath(id: string) {
  return ROUTES.demand(id)
}

export function journalistPath(id: string) {
  return ROUTES.journalist(id)
}
