import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ReportsPage } from './ReportsPage'

describe('ReportsPage', () => {
  it('renderiza o título da página', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /relatórios/i })).toBeInTheDocument()
  })

  it('exibe o período atual no subtítulo', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    expect(screen.getByText(new RegExp(currentMonth, 'i'))).toBeInTheDocument()
  })

  it('exibe KPIs principais em Cards', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/demandas do mês/i)).toBeInTheDocument()
    expect(screen.getByText(/posicionamentos enviados/i)).toBeInTheDocument()
    expect(screen.getByText(/interações com jornalistas/i)).toBeInTheDocument()
  })

  it('exibe distribuição por status com todos os status', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/demandas por status/i)).toBeInTheDocument()
    expect(screen.getByText(/rascunho/i)).toBeInTheDocument()
    expect(screen.getByText(/em andamento/i)).toBeInTheDocument()
    expect(screen.getByText(/em review/i)).toBeInTheDocument()
    expect(screen.getByText(/aprovada/i)).toBeInTheDocument()
    expect(screen.getByText(/enviada/i)).toBeInTheDocument()
    expect(screen.getByText(/sem envio/i)).toBeInTheDocument()
  })

  it('exibe top jornalistas com ranking', () => {
    render(
      <BrowserRouter>
        <ReportsPage />
      </BrowserRouter>,
    )

    expect(screen.getByText(/jornalistas mais ativos/i)).toBeInTheDocument()
    expect(screen.getByText(/ana silva/i)).toBeInTheDocument()
    expect(screen.getByText(/o globo/i)).toBeInTheDocument()
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
