import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { HomePage } from './HomePage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  it('exibe saudação com nome do usuário', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { name: /Olá, Noel Ferreira/i, level: 1 })).toBeInTheDocument()
  })

  it('exibe subtítulo do mês', () => {
    renderHomePage()
    expect(screen.getByText(/O que foi realizado neste mês\?/i)).toBeInTheDocument()
  })

  it('exibe três métricas', () => {
    renderHomePage()
    expect(screen.getByText(/Demandas em setembro/i)).toBeInTheDocument()
    expect(screen.getByText(/Posicionamentos enviados/i)).toBeInTheDocument()
    expect(screen.getByText(/Interações com jornalistas/i)).toBeInTheDocument()
  })

  it('exibe valores das métricas', () => {
    renderHomePage()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('exibe seção "Continuar de onde parou"', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { name: /Continuar de onde parou/i, level: 2 })).toBeInTheDocument()
  })

  it('exibe faixa compacta quando não há demandas em andamento', () => {
    renderHomePage()
    expect(screen.getByText(/Nenhuma demanda em andamento para retomar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nova demanda/i })).toBeInTheDocument()
  })

  it('exibe seção "Ações rápidas"', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { name: /Ações rápidas/i, level: 2 })).toBeInTheDocument()
  })

  it('exibe ações rápidas com labels corretos', () => {
    renderHomePage()
    expect(screen.getByText(/Jornalistas/i)).toBeInTheDocument()
    expect(screen.getByText(/Relatórios/i)).toBeInTheDocument()
  })

  it('navega para demandas ao clicar em Nova demanda na faixa vazia', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const newDemandButton = screen.getByRole('button', { name: /Nova demanda/i })
    await user.click(newDemandButton)
    expect(mockNavigate).toHaveBeenCalledWith('/demandas')
  })

  it('navega para jornalistas ao clicar no card de jornalistas', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const journalistButton = screen.getByRole('button', { name: /Ver jornalistas/i })
    await user.click(journalistButton)
    expect(mockNavigate).toHaveBeenCalledWith('/jornalistas')
  })

  it('navega para relatórios ao clicar no card de relatórios', async () => {
    const user = userEvent.setup()
    renderHomePage()

    const reportsButton = screen.getByRole('button', { name: /Ver relatórios/i })
    await user.click(reportsButton)
    expect(mockNavigate).toHaveBeenCalledWith('/relatorios')
  })
})
