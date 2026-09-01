import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ReportsPage } from './ReportsPage'

describe('ReportsPage', () => {
  it('renderiza o título da página com palavra em destaque', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/visão geral de/i)).toBeInTheDocument()
    expect(screen.getByText(/cobertura/i)).toBeInTheDocument()
  })

  it('renderiza filtros de período e escritório', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByLabelText(/escritório/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^de$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^até$/i)).toBeInTheDocument()
  })

  it('exibe 4 KPIs principais', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/demandas do mês/i)).toBeInTheDocument()
    expect(screen.getByText(/posicionamentos enviados/i)).toBeInTheDocument()
    expect(screen.getByText(/interações com jornalistas/i)).toBeInTheDocument()
    expect(screen.getByText(/veículos ativos/i)).toBeInTheDocument()
  })

  it('renderiza mapa de calor de demandas', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/mapa de calor: demandas por tipo/i)).toBeInTheDocument()
  })

  it('renderiza gráfico de barras de demandas por tipo', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { name: /demandas por tipo/i })).toBeInTheDocument()
    expect(screen.getByText(/produção de release/i)).toBeInTheDocument()
    expect(screen.getByText(/disparo\/programação de release na matriz/i)).toBeInTheDocument()
  })

  it('renderiza botão de exportação', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
  })

  it('renderiza valores dos KPIs', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
