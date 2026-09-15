import { Navigate } from 'react-router-dom'
import { useSession } from '@/application/modules/Auth/hooks/use-session'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated } = useSession()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
