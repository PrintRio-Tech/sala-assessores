import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from './HomePage'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('HomePage', () => {
  it('renderiza o título da página', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /sala de assessores/i })).toBeInTheDocument()
  })

  it('exibe métricas mock', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/demandas ativas/i)).toBeInTheDocument()
    expect(screen.getByText(/aguardando review/i)).toBeInTheDocument()
    expect(screen.getByText(/jornalistas cadastrados/i)).toBeInTheDocument()
    expect(screen.getByText(/interações no mês/i)).toBeInTheDocument()
  })

  it('exibe atalhos de ações rápidas', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/nova demanda/i)).toBeInTheDocument()
    expect(screen.getByText(/jornalistas/i)).toBeInTheDocument()
    expect(screen.getByText(/demandas em andamento/i)).toBeInTheDocument()
    expect(screen.getByText(/relatórios/i)).toBeInTheDocument()
  })
})
