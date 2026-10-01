import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthTestProviders } from '@/test/auth-providers'
import { FAKE_MEMBER_EMAIL, installFakeAuth } from '@/test/install-fake-auth'

import { LoginPage } from '..'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLogin() {
  return render(
    <AuthTestProviders>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </AuthTestProviders>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    installFakeAuth()
  })

  it('renders login form', () => {
    renderLogin()

    expect(screen.getByText('Acesso seguro')).toBeInTheDocument()
    expect(screen.getByText('Entre com seu e-mail')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /e-mail corporativo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar código/i })).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByRole('textbox', { name: /e-mail corporativo/i }), 'invalid-email')
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    expect(screen.getByText('Por favor, informe um e-mail válido')).toBeInTheDocument()
  })

  it('navigates to verify with e-mail normalizado e copy anti-enum', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(
      screen.getByRole('textbox', { name: /e-mail corporativo/i }),
      '  Ana@Imprensa.gov.br  ',
    )
    await user.click(screen.getByRole('button', { name: /enviar código/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/login/verificar?email=${encodeURIComponent(FAKE_MEMBER_EMAIL)}`,
      )
    })
    expect(screen.getByText('Se o e-mail estiver cadastrado, um código pode chegar em instantes.')).toBeInTheDocument()
  })
})
