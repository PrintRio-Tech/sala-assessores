import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { ReportsPage } from '..'

function renderReports() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
  return render(<ReportsPage />, { wrapper })
}

describe('ReportsPage', () => {
  it('renderiza o título da página', async () => {
    renderReports()
    expect(await screen.findByRole('heading', { level: 1, name: /relatórios/i })).toBeInTheDocument()
  })

  it('exibe KPIs principais', async () => {
    renderReports()
    expect(await screen.findByText(/total de demandas/i)).toBeInTheDocument()
    expect(screen.getByText(/tom médio/i)).toBeInTheDocument()
    expect(screen.getByText(/publicadas/i)).toBeInTheDocument()
  })

  it('exibe distribuição por status', async () => {
    renderReports()
    expect(await screen.findByText(/demandas por status/i)).toBeInTheDocument()
    expect(screen.getByText(/em andamento/i)).toBeInTheDocument()
    expect(screen.queryByText(/rascunho/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/em review/i)).not.toBeInTheDocument()
  })

  it('exibe top jornalistas', async () => {
    renderReports()
    expect(await screen.findByText(/base e avaliações/i)).toBeInTheDocument()
  })

  it('renderiza botões de exportação', async () => {
    renderReports()
    expect(await screen.findByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar json/i })).toBeInTheDocument()
  })
})
