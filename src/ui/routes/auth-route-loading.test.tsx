import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

const useSessionMock = vi.fn()

vi.mock('@/application/modules/Auth/hooks/use-session', () => ({
  useSession: () => useSessionMock(),
}))

describe('estado de carregamento dos guards', () => {
  beforeEach(() => {
    useSessionMock.mockReset()
  })

  it('ProtectedRoute mostra Carregando… acessível enquanto checa a sessão', () => {
    useSessionMock.mockReturnValue({
      isChecking: true,
      isAuthenticated: false,
      session: null,
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>protected-content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument()
  })

  it('GuestRoute mostra Carregando… acessível no shell, sem tela vazia', () => {
    useSessionMock.mockReturnValue({
      isChecking: true,
      isAuthenticated: false,
      session: null,
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={<div>home-page</div>} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>guest-content</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.getByRole('link', { name: 'Ir para o conteúdo principal' })).toBeInTheDocument()
    expect(screen.queryByText('guest-content')).not.toBeInTheDocument()
    expect(screen.queryByText('home-page')).not.toBeInTheDocument()
  })
})
