import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { withAssetBase } from '@/shared/with-asset-base'
import { AppLayout } from './AppLayout'

const useSessionMock = vi.fn()

vi.mock('@/application/modules/Auth/hooks/use-session', () => ({
  useSession: () => useSessionMock(),
}))

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
  const logout = vi.fn()

  beforeEach(() => {
    logout.mockReset()
    useSessionMock.mockReturnValue({
      session: { name: 'Ana Silva', email: 'ana@imprensa.gov.br' },
      logout,
      isAuthenticated: true,
      isChecking: false,
    })
  })

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
      withAssetBase('/logos/wordmark-chumbo.png'),
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

  it('espelha o CSS do BrandLogo no wordmark da sidebar, sem esmagar o PNG quadrado', () => {
    expect(layoutScss).toMatch(/\.brandLogo\s*\{[^}]*display:\s*block/)
    expect(layoutScss).toMatch(/\.brandLogo\s*\{[^}]*max-width:\s*100%/)
    expect(layoutScss).toMatch(/\.brandLogo\s*\{[^}]*height:\s*auto/)
    expect(layoutScss).toMatch(/\.brandLogo\s*\{[^}]*object-fit:\s*contain/)
    expect(layoutScss).toMatch(/\.brandLogoExpanded\s*\{[^}]*width:\s*min\(9\.25rem,\s*100%\)/)
    expect(layoutScss).toMatch(/\.brandLogoCollapsed\s*\{[^}]*width:\s*2\.5rem/)
    expect(layoutScss).not.toMatch(/\.brandLogo\s*\{[^}]*object-fit:\s*cover/)
  })

  it('mostra a identidade da sessão autenticada, sem usuário mock', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Ana Silva')).toBeVisible()
    expect(screen.getByText('Assessor de imprensa')).toBeVisible()
    expect(screen.queryByText('Noel Ferreira')).not.toBeInTheDocument()
  })

  it('não mostra Sair no rodapé da sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route path="/login" element={<div>login-page</div>} />
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
    expect(screen.getByText('Ana Silva')).toBeVisible()
    expect(screen.queryByText('login-page')).not.toBeInTheDocument()
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
    expect(logo).toHaveAttribute('src', withAssetBase('/logos/wordmark-light-tagline.png'))
    expect(logo).toHaveAttribute('width', '148')
    expect(logo).toHaveAttribute('height', '40')
    expect(logo.className).toMatch(/brandLogo/)
    expect(logo.className).toMatch(/brandLogoExpanded/)
    expect(screen.queryByText('Sala de Assessores')).not.toBeInTheDocument()
  })

  it('usa o ícone oficial Print quando a sidebar colapsa', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu' }))

    const collapsedBrand = screen.getByRole('button', { name: 'Print' })
    const logo = within(collapsedBrand).getByRole('img')
    expect(logo).toHaveAttribute('src', withAssetBase('/logos/icon.png'))
    expect(logo).toHaveAttribute('width', '40')
    expect(logo).toHaveAttribute('height', '40')
    expect(logo.className).toMatch(/brandLogoCollapsed/)
  })

  it('prefixa a máscara do Recolher e do Abrir menu, preservando o flip ao expandir', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/demandas" element={<RouteProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const collapse = screen.getByRole('button', { name: 'Recolher menu' })
    const chevron = collapse.querySelector('span') as HTMLElement
    expect(chevron.style.webkitMaskImage).toBe(`url("${withAssetBase('/icons/ui/chevron-left.svg')}")`)
    expect(chevron.className).not.toMatch(/Flipped/)

    const menu = screen.getByRole('button', { name: 'Abrir menu', hidden: true })
    const hamburger = menu.querySelector('span') as HTMLElement
    expect(hamburger.style.webkitMaskImage).toBe(`url("${withAssetBase('/icons/ui/menu.svg')}")`)

    fireEvent.click(collapse)

    const expand = screen.getByRole('button', { name: 'Expandir menu' })
    const flipped = expand.querySelector('span') as HTMLElement
    expect(flipped.style.webkitMaskImage).toBe(`url("${withAssetBase('/icons/ui/chevron-left.svg')}")`)
    expect(flipped.className).toMatch(/Flipped/)
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
