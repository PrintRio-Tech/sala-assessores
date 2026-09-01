import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/ui/app/AppLayout'
import { DemandDetailPage } from '@/ui/pages/DemandDetailPage'
import { DemandsPage } from '@/ui/pages/DemandsPage'
import { JournalistPage } from '@/ui/pages/JournalistPage'
import { JournalistsPage } from '@/ui/pages/JournalistsPage'
import { ROUTES } from '@/ui/routes/paths'

export const appRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to={ROUTES.demands} replace /> },
  {
    element: <AppLayout />,
    children: [
      { path: 'demandas', element: <DemandsPage /> },
      { path: 'demandas/:demandId', element: <DemandDetailPage /> },
      { path: 'jornalistas', element: <JournalistsPage /> },
      { path: 'jornalistas/:journalistId', element: <JournalistPage /> },
    ],
  },
]

export const router = createBrowserRouter(appRoutes)
