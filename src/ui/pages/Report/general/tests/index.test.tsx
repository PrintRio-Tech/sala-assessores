import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

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
  it('renderiza o título de impacto e os filtros', async () => {
    renderReports()
    expect(await screen.findByRole('heading', { level: 1, name: /visão geral de impacto/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /responsável/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/data inicial/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data final/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /exportar json/i })).not.toBeInTheDocument()
  })

  it('exibe os quatro indicadores principais', async () => {
    renderReports()
    expect(await screen.findByText(/total de demandas/i)).toBeInTheDocument()
    expect(screen.getByText('Publicadas')).toBeInTheDocument()
    expect(screen.getByText(/tom médio/i)).toBeInTheDocument()
    expect(screen.getByText(/jornalista em destaque/i)).toBeInTheDocument()
  })

  it('oferece as abas de demandas, resultados e relacionamento', async () => {
    const user = userEvent.setup()
    renderReports()
    expect(await screen.findByRole('tab', { name: /demandas/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /resultados/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /relacionamento/i })).toBeInTheDocument()
    expect(screen.getByText(/mapa de calor/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /resultados/i }))
    expect(screen.getByText(/distribuição de tom/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /relacionamento/i }))
    expect(screen.getByText(/veículos/i)).toBeInTheDocument()
    expect(screen.getByText(/jornalistas/i)).toBeInTheDocument()
  })

  it('exporta o recorte visível em CSV', async () => {
    const user = userEvent.setup()
    const click = vi.fn()
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:report',
      revokeObjectURL: vi.fn(),
    })
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreate(tagName)
      if (tagName === 'a') Object.defineProperty(element, 'click', { value: click })
      return element
    })

    renderReports()
    await user.click(await screen.findByRole('button', { name: /exportar/i }))
    expect(click).toHaveBeenCalled()
  })
})
