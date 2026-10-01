import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { auth } from '@/application/composition'
import type { FakeAuthRepository } from '@/infrastructure/modules/Auth/fakes/fake-auth.repository'
import { AuthTestProviders } from '@/test/auth-providers'
import { FAKE_MEMBER_EMAIL, installFakeAuth } from '@/test/install-fake-auth'

import { VerifyPage } from '..'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderVerify(email = FAKE_MEMBER_EMAIL) {
  return render(
    <AuthTestProviders>
      <MemoryRouter initialEntries={[`/login/verificar?email=${encodeURIComponent(email)}`]}>
        <Routes>
          <Route path="/login/verificar" element={<VerifyPage />} />
        </Routes>
      </MemoryRouter>
    </AuthTestProviders>,
  )
}

async function typeOtp(user: ReturnType<typeof userEvent.setup>, digits: string) {
  const inputs = screen.getAllByRole('textbox')
  for (const [index, digit] of digits.split('').entries()) {
    await user.type(inputs[index], digit)
  }
}

describe('VerifyPage', () => {
  let fake: FakeAuthRepository

  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    fake = installFakeAuth()
  })

  it('renders verify form with email', () => {
    renderVerify()

    expect(screen.getByText('Confirme o código')).toBeInTheDocument()
    expect(screen.getByText(FAKE_MEMBER_EMAIL)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar na plataforma/i })).toBeInTheDocument()
  })

  it('rejeita qualquer 6 dígitos e autentica só o OTP emitido', async () => {
    const user = userEvent.setup()
    await auth.service.requestMagicLink(FAKE_MEMBER_EMAIL)
    renderVerify()

    await typeOtp(user, '000000')
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }))

    await waitFor(() => {
      expect(screen.getByText(/inválido/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalledWith('/')
    expect(auth.service.hasStoredToken()).toBe(false)

    await typeOtp(user, fake.issuedCodeFor(FAKE_MEMBER_EMAIL)!)
    await user.click(screen.getByRole('button', { name: /entrar na plataforma/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
    expect(auth.service.hasStoredToken()).toBe(true)
  })

  it('redirects to login when no email provided', () => {
    render(
      <AuthTestProviders>
        <MemoryRouter initialEntries={['/login/verificar']}>
          <Routes>
            <Route path="/login/verificar" element={<VerifyPage />} />
          </Routes>
        </MemoryRouter>
      </AuthTestProviders>,
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
