import { describe, it, expect, beforeEach } from 'vitest'
import { mockAuthService } from './mock-auth-service'

describe('mockAuthService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('verifies valid codes', () => {
    expect(mockAuthService.verifyCode('123456')).toBe(true)
    expect(mockAuthService.verifyCode('654321')).toBe(true)
  })

  it('rejects invalid codes', () => {
    expect(mockAuthService.verifyCode('12345')).toBe(false)
    expect(mockAuthService.verifyCode('1234567')).toBe(false)
    expect(mockAuthService.verifyCode('')).toBe(false)
  })

  it('sets and checks authentication', () => {
    expect(mockAuthService.isAuthenticated()).toBe(false)

    mockAuthService.setAuthenticated(true, 'test@example.com')

    expect(mockAuthService.isAuthenticated()).toBe(true)
  })

  it('gets session data', () => {
    mockAuthService.setAuthenticated(true, 'test@example.com')

    const session = mockAuthService.getSession()

    expect(session).toEqual({
      authenticated: true,
      email: 'test@example.com',
    })
  })

  it('clears authentication on logout', () => {
    mockAuthService.setAuthenticated(true, 'test@example.com')
    expect(mockAuthService.isAuthenticated()).toBe(true)

    mockAuthService.logout()

    expect(mockAuthService.isAuthenticated()).toBe(false)
    expect(mockAuthService.getSession()).toBe(null)
  })
})
