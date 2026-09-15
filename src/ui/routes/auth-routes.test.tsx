import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { mockAuthService } from '@/application/services/mock-auth-service'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

describe('rotas protegidas e de convidado', () => {
  beforeEach(() => localStorage.clear())

  it('ProtectedRoute redireciona para login quando não autenticado', () => {
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

    expect(screen.getByText('login-page')).toBeInTheDocument()
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument()
  })

  it('ProtectedRoute renderiza filhos quando autenticado', () => {
    mockAuthService.setAuthenticated(true, 'test@example.com')

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

    expect(screen.getByText('protected-content')).toBeInTheDocument()
  })

  it('GuestRoute redireciona autenticado para home', () => {
    mockAuthService.setAuthenticated(true, 'test@example.com')

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

    expect(screen.getByText('home-page')).toBeInTheDocument()
    expect(screen.queryByText('guest-content')).not.toBeInTheDocument()
  })

  it('GuestRoute renderiza filhos quando não autenticado', () => {
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

    expect(screen.getByText('guest-content')).toBeInTheDocument()
  })
})
