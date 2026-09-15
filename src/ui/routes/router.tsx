import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/ui/app/AppLayout'
import { AuthLayout, LoginPage, VerifyPage } from '@/ui/pages/Auth'
import { GuestRoute } from '@/ui/routes/GuestRoute'
import { ProtectedRoute } from '@/ui/routes/ProtectedRoute'
import { DemandDetailPage, DemandsPage } from '@/ui/pages/Demand'
import { HomePage } from '@/ui/pages/Home'
import { JournalistPage, JournalistsPage } from '@/ui/pages/Journalist'
import { ReportsPage } from '@/ui/pages/Report'

export const appRoutes: RouteObject[] = [
  {
    path: 'login',
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [
      { index: true, element: <LoginPage /> },
      { path: 'verificar', element: <VerifyPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: 'demandas', element: <DemandsPage /> },
      { path: 'demandas/:demandId', element: <DemandDetailPage /> },
      { path: 'jornalistas', element: <JournalistsPage /> },
      { path: 'jornalistas/:journalistId', element: <JournalistPage /> },
      { path: 'relatorios', element: <ReportsPage /> },
    ],
  },
]

export const router = createBrowserRouter(appRoutes)
