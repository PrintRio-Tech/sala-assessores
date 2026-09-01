import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from './AppLayout'

function RouteProbe() {
  const navigate = useNavigate()

  return (
    <button type="button" onClick={() => navigate('/jornalistas/j-carolina')}>
      Trocar rota
    </button>
  )
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

describe('AppLayout lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('navega entre pathnames e desmonta sem registrar o retorno de scrollTo como cleanup', () => {
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: vi.fn(() => 'retorno-especifico-do-browser'),
    })

    const view = render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
            <Route path="/jornalistas/:journalistId" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Trocar rota' }))).not.toThrow()
    expect(() => view.unmount()).not.toThrow()
  })

  it('remove a barra superior vazia e preserva o landmark principal', () => {
    const view = render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const topbar = view.container.querySelector('header[aria-label="Barra superior"]')

    expect(topbar).not.toBeNull()
    expect(topbar?.closest('[class*="withoutTopbar"]')).not.toBeNull()
    expect(view.container.querySelector('#main-content')).toBeVisible()
  })

  it('abre a home ao navegar por Home', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Home' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('abre a listagem ao navegar por Jornalistas', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Jornalistas' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/jornalistas')
  })

  it('abre relatórios ao navegar por Relatórios', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Relatórios' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/relatorios')
  })

  it('apresenta a identidade local que assina os registros, sem autenticação', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Noel Ferreira')).toBeVisible()
    expect(screen.getByText('Assessor de imprensa')).toBeVisible()
  })
})
