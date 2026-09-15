import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from './AppLayout'

const layoutScss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'app-layout.module.scss'),
  'utf8',
)

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
    expect(within(topbar as HTMLElement).getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument()
    expect(within(topbar as HTMLElement).getByRole('img', { name: 'Print' })).toHaveAttribute(
      'src',
      '/logos/wordmark-chumbo.png',
    )
    expect(view.container.querySelector('#main-content')).toBeVisible()
  })

  it('usa o wordmark chumbo oficial no header claro, sem o ícone da sidebar', () => {
    expect(layoutScss).toMatch(/\.mobileHeaderLogo/)
    expect(layoutScss).toMatch(/width:\s*7\.5rem/)
    expect(layoutScss).toMatch(/flex-shrink:\s*0/)
    expect(layoutScss).toMatch(/object-fit:\s*cover/)
    expect(layoutScss).not.toMatch(/min\(7\.5rem/)
    expect(layoutScss).not.toMatch(/filter:/)
  })

  it('só oculta a topbar no desktop, preservando o header mobile', () => {
    expect(layoutScss).toMatch(/@use '@print\/ui\/mixins'/)
    expect(layoutScss).toMatch(
      /\.withoutTopbar[\s\S]*@include desktop[\s\S]*display:\s*none/,
    )
    expect(layoutScss).not.toMatch(
      /\.withoutTopbar :global\(header\[aria-label='Barra superior'\]\) \{\s*display:\s*none;/,
    )
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

  it('mostra o wordmark oficial Print no topo da sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const logo = screen.getByRole('img', {
      name: 'Print — Consultoria Estratégica em Comunicação',
    })
    expect(logo).toBeVisible()
    expect(logo).toHaveAttribute('src', '/logos/wordmark-light-tagline.png')
    expect(screen.queryByText('Sala de Assessores')).not.toBeInTheDocument()
  })

  it('abre a home ao clicar no logo Print', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Print — Consultoria Estratégica em Comunicação' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
