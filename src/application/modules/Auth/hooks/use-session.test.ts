import { beforeEach, describe, expect, it } from 'vitest'

import { mockAuthService } from '@/application/services/mock-auth-service'
import { renderHook } from '@testing-library/react'

import { useSession } from './use-session'

describe('useSession', () => {
  beforeEach(() => localStorage.clear())

  it('expõe sessão vazia quando não autenticado', () => {
    const { result } = renderHook(() => useSession())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.session).toBeNull()
  })

  it('expõe a sessão mockada e permite sair', () => {
    mockAuthService.setAuthenticated(true, 'test@example.com')
    const { result } = renderHook(() => useSession())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.session).toEqual({ authenticated: true, email: 'test@example.com' })

    result.current.logout()
    expect(mockAuthService.isAuthenticated()).toBe(false)
  })
})
