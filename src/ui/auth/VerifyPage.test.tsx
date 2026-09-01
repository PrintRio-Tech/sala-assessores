import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { mockAuthService } from '@/application/services/mock-auth-service'
import { VerifyPage } from './VerifyPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('VerifyPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
  })

  it('renders verify form with email', () => {
    render(
      <MemoryRouter initialEntries={['/login/verificar?email=test@example.com']}>
        <Routes>
          <Route path="/login/verificar" element={<VerifyPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Confirme o código')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar na plataforma/i })).toBeInTheDocument()
  })

  it('accepts valid code and authenticates', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login/verificar?email=test@example.com']}>
        <Routes>
          <Route path="/login/verificar" element={<VerifyPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /entrar na plataforma/i })

    await user.type(inputs[0], '1')
    await user.type(inputs[1], '2')
    await user.type(inputs[2], '3')
    await user.type(inputs[3], '4')
    await user.type(inputs[4], '5')
    await user.type(inputs[5], '6')

    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockAuthService.isAuthenticated()).toBe(true)
        expect(mockNavigate).toHaveBeenCalledWith('/')
      },
      { timeout: 2000 },
    )
  })

  it('redirects to login when no email provided', () => {
    render(
      <MemoryRouter initialEntries={['/login/verificar']}>
        <Routes>
          <Route path="/login/verificar" element={<VerifyPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
