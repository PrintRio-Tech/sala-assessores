import { Navigate } from 'react-router-dom'
import { mockAuthService } from '@/application/services/mock-auth-service'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = mockAuthService.isAuthenticated()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
