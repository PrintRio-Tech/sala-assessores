import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockAuthService } from '@/application/services/mock-auth-service'
import { useVerifyCode } from './use-verify-code'

describe('useVerifyCode', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('autentica com código válido', () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useVerifyCode({ onSuccess }))

    act(() => result.current.verify({ code: '123456', email: 'test@example.com' }))
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(onSuccess).toHaveBeenCalled()
    expect(mockAuthService.isAuthenticated()).toBe(true)
    expect(result.current.isPending).toBe(false)
  })

  it('notifica erro com código inválido', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useVerifyCode({ onError }))

    act(() => result.current.verify({ code: '12', email: 'test@example.com' }))
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(onError).toHaveBeenCalled()
    expect(mockAuthService.isAuthenticated()).toBe(false)
    expect(result.current.error?.message).toMatch(/inválido/i)
  })
})
