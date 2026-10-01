import { Navigate } from 'react-router-dom'

import { useSession } from '@/application/modules/Auth/hooks/use-session'

import { AuthRouteLoading } from './AuthRouteLoading'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isChecking } = useSession()

  if (isChecking) {
    return <AuthRouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
