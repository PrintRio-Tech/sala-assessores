import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { auth } from '@/application/composition'
import { AuthTestProviders } from '@/test/auth-providers'
import { FAKE_MEMBER_EMAIL, installFakeAuth } from '@/test/install-fake-auth'
import { GuestRoute } from './GuestRoute'
import { ProtectedRoute } from './ProtectedRoute'

async function authenticate() {
  const fake = installFakeAuth()
  await auth.service.requestMagicLink(FAKE_MEMBER_EMAIL)
  await auth.service.verify({
    email: FAKE_MEMBER_EMAIL,
    code: fake.issuedCodeFor(FAKE_MEMBER_EMAIL)!,
  })
}

function renderGuards(path: string, element: React.ReactNode) {
  return render(
    <AuthTestProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/" element={<div>home-page</div>} />
          <Route path="/guard" element={element} />
        </Routes>
      </MemoryRouter>
    </AuthTestProviders>,
  )
}

describe('rotas protegidas e de convidado', () => {
  beforeEach(() => {
    localStorage.clear()
    installFakeAuth()
  })

  it('ProtectedRoute redireciona para login quando não autenticado', async () => {
    renderGuards(
      '/guard',
      <ProtectedRoute>
        <div>protected-content</div>
      </ProtectedRoute>,
    )

    expect(await screen.findByText('login-page')).toBeInTheDocument()
    expect(screen.queryByText('protected-content')).not.toBeInTheDocument()
  })

  it('ProtectedRoute renderiza filhos quando autenticado', async () => {
    await authenticate()
    renderGuards(
      '/guard',
      <ProtectedRoute>
        <div>protected-content</div>
      </ProtectedRoute>,
    )

    expect(await screen.findByText('protected-content')).toBeInTheDocument()
  })

  it('GuestRoute redireciona autenticado para home', async () => {
    await authenticate()
    render(
      <AuthTestProviders>
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
        </MemoryRouter>
      </AuthTestProviders>,
    )

    expect(await screen.findByText('home-page')).toBeInTheDocument()
    expect(screen.queryByText('guest-content')).not.toBeInTheDocument()
  })

  it('GuestRoute renderiza filhos quando não autenticado', async () => {
    render(
      <AuthTestProviders>
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
        </MemoryRouter>
      </AuthTestProviders>,
    )

    expect(await screen.findByText('guest-content')).toBeInTheDocument()
  })
})
