import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from './AppLayout'

vi.mock('@/application/modules/Auth/hooks/use-session', () => ({
  useSession: () => ({
    session: { id: 'r-noel', name: 'Ana Silva', email: 'ana@imprensa.gov.br' },
    logout: vi.fn(),
    isAuthenticated: true,
    isChecking: false,
  }),
}))

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

describe('AppLayout nav Releases', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('abre a listagem ao navegar por Releases, entre Demandas e Jornalistas', () => {
    render(
      <MemoryRouter initialEntries={['/demandas']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const navButtons = screen.getAllByRole('button', { name: /Home|Demandas|Releases|Jornalistas|Relatórios/ })
      .filter((button) => ['Home', 'Demandas', 'Releases', 'Jornalistas', 'Relatórios'].includes(button.textContent ?? ''))
    const labels = [...new Set(navButtons.map((button) => button.textContent))]
    expect(labels).toEqual(['Home', 'Demandas', 'Releases', 'Jornalistas', 'Relatórios'])

    fireEvent.click(screen.getAllByRole('button', { name: 'Releases' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/releases')
  })
})
