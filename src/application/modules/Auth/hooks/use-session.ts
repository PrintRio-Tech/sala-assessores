import { mockAuthService } from '@/application/services/mock-auth-service'

export function useSession() {
  return {
    isAuthenticated: mockAuthService.isAuthenticated(),
    session: mockAuthService.getSession(),
    logout: () => mockAuthService.logout(),
  }
}
