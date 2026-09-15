import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogin } from './use-login'

describe('useLogin', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('notifica o e-mail após o envio do código', () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useLogin({ onSuccess }))

    act(() => result.current.login('test@example.com'))
    expect(result.current.isPending).toBe(true)

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(result.current.isPending).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith('test@example.com')
  })
})
