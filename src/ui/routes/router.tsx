import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { AppLayout } from '@/ui/app/AppLayout'
import { AuthLayout } from '@/ui/auth/AuthLayout'
import { LoginPage } from '@/ui/auth/LoginPage'
import { VerifyPage } from '@/ui/auth/VerifyPage'
import { GuestRoute } from '@/ui/routes/GuestRoute'
import { ProtectedRoute } from '@/ui/routes/ProtectedRoute'
import { DemandDetailPage } from '@/ui/pages/DemandDetailPage'
import { DemandsPage } from '@/ui/pages/DemandsPage'
import { HomePage } from '@/ui/pages/HomePage'
import { JournalistPage } from '@/ui/pages/JournalistPage'
import { JournalistsPage } from '@/ui/pages/JournalistsPage'
import { ReportsPage } from '@/ui/pages/ReportsPage'

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
