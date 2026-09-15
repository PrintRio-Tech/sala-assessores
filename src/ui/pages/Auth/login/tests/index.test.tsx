import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'

import { LoginPage } from '..'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('ACESSO SEGURO')).toBeInTheDocument()
    expect(screen.getByText('Entre com seu e-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail corporativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    const emailInput = screen.getByLabelText('E-mail corporativo')
    const submitButton = screen.getByRole('button', { name: /enviar código/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(screen.getByText('Por favor, informe um e-mail válido')).toBeInTheDocument()
  })

  it('navigates to verify page on valid email', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    const emailInput = screen.getByLabelText('E-mail corporativo')
    const submitButton = screen.getByRole('button', { name: /enviar código/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/login/verificar?email=test%40example.com')
      },
      { timeout: 2000 },
    )
  })
})
