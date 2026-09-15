import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ReportsPage } from '..'

describe('ReportsPage', () => {
  it('renderiza o título da página', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /relatórios/i })).toBeInTheDocument()
  })

  it('exibe KPIs principais', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/total de demandas/i)).toBeInTheDocument()
    expect(screen.getByText(/tempo médio de resposta/i)).toBeInTheDocument()
    expect(screen.getByText(/taxa de satisfação/i)).toBeInTheDocument()
  })

  it('exibe distribuição por status', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/demandas por status/i)).toBeInTheDocument()
    expect(screen.getByText(/em andamento/i)).toBeInTheDocument()
    expect(screen.queryByText(/rascunho/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/em review/i)).not.toBeInTheDocument()
  })

  it('exibe top jornalistas', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/jornalistas mais ativos/i)).toBeInTheDocument()
  })

  it('renderiza botões de exportação', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar json/i })).toBeInTheDocument()
  })
})
