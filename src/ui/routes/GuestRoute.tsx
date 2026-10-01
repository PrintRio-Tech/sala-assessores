import { AuthLayout } from '@print/ui'
import { Navigate } from 'react-router-dom'

import { useSession } from '@/application/modules/Auth/hooks/use-session'
import {
  salaAuthEyebrow,
  salaAuthFooterNote,
  salaAuthHeadline,
  salaAuthLead,
  salaAuthMobileBrand,
  salaAuthPillars,
  salaAuthProductName,
} from '@/ui/pages/Auth/auth-shell'

import { AuthRouteLoading } from './AuthRouteLoading'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isChecking } = useSession()

  if (isChecking) {
    return (
      <AuthLayout
        loading
        productName={salaAuthProductName}
        eyebrow={salaAuthEyebrow}
        headline={salaAuthHeadline}
        lead={salaAuthLead.login}
        pillars={salaAuthPillars}
        footerNote={salaAuthFooterNote}
        mobileBrand={salaAuthMobileBrand}
      >
        <AuthRouteLoading />
      </AuthLayout>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
