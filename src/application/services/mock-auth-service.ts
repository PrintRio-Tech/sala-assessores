const MOCK_SESSION_KEY = 'sala-assessores:mock-session'
const VALID_CODES = ['123456']

interface MockSession {
  authenticated: boolean
  email: string
}

class MockAuthService {
  verifyCode(code: string): boolean {
    return VALID_CODES.includes(code) || code.length === 6
  }

  setAuthenticated(authenticated: boolean, email: string = '') {
    const session: MockSession = { authenticated, email }
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
  }

  isAuthenticated(): boolean {
    try {
      const session = localStorage.getItem(MOCK_SESSION_KEY)
      if (!session) return false
      const parsed: MockSession = JSON.parse(session)
      return parsed.authenticated
    } catch {
      return false
    }
  }

  getSession(): MockSession | null {
    try {
      const session = localStorage.getItem(MOCK_SESSION_KEY)
      if (!session) return null
      return JSON.parse(session)
    } catch {
      return null
    }
  }

  logout() {
    localStorage.removeItem(MOCK_SESSION_KEY)
  }
}

export const mockAuthService = new MockAuthService()
