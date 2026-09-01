import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/ui/routes/paths'
import { appRoutes } from '@/ui/routes/router'

describe('rotas da Sala de Assessores', () => {
  it('mantém apenas as rotas permanentes do produto', () => {
    expect(ROUTES).toMatchObject({
      home: '/',
      demands: '/demandas',
      journalists: '/jornalistas',
      reports: '/relatorios',
    })
    expect(ROUTES.demand('d-1')).toBe('/demandas/d-1')
    expect(ROUTES.journalist('j-1')).toBe('/jornalistas/j-1')
    expect('redesignCodex' in ROUTES).toBe(false)
    expect('detailExplorations' in ROUTES).toBe(false)
    expect('detailExploration' in ROUTES).toBe(false)
  })

  it('registra home, demandas, jornalistas e relatórios no AppLayout', () => {
    const appLayoutRoute = appRoutes.find((route) => route.children)

    expect(appLayoutRoute?.children?.map((route) => route.path)).toEqual([
      '/',
      'demandas',
      'demandas/:demandId',
      'jornalistas',
      'jornalistas/:journalistId',
      'relatorios',
    ])
  })
})
