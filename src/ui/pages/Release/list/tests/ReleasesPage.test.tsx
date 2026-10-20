import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { forwardRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@print/ui'

import { useReleaseFilters } from '@/application/modules/Release/stores/release.store'
import { ReleasesPage } from '..'
import { ReleaseFormPage } from '../../form'

vi.mock('@print/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@print/ui')>()
  return {
    ...actual,
    RichTextEditor: forwardRef(({ value, onChange, disabled, 'aria-label': ariaLabel }: {
      value: string
      onChange: (value: string) => void
      disabled?: boolean
      'aria-label'?: string
    }, _ref) => (
      <textarea aria-label={ariaLabel} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    )),
    RichTextViewer: ({ content }: { content: string }) => <div>{content}</div>,
  }
})

vi.mock('@/application/modules/Auth/hooks/use-session', () => ({
  useSession: () => ({
    session: { id: 'r-noel', name: 'Noel Ferreira', email: 'noel@print.local' },
    isAuthenticated: true,
    isChecking: false,
    logout: vi.fn(),
  }),
}))

function renderReleases(entry = '/releases') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Toaster>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/releases" element={<ReleasesPage />} />
            <Route path="/releases/novo" element={<ReleaseFormPage />} />
            <Route path="/releases/:id/editar" element={<ReleaseFormPage />} />
          </Routes>
        </MemoryRouter>
      </Toaster>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  useReleaseFilters.getState().reset()
})

describe('ReleasesPage', () => {
  it('lista releases do seed com visual do Forms, sem escritório nem workflow', async () => {
    renderReleases()

    expect(await screen.findByRole('heading', { name: /Banco de releases/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Novo release' })).toBeInTheDocument()
    expect(await screen.findByText('Resultados do primeiro trimestre')).toBeInTheDocument()
    expect(screen.getByText('Compromissos de sustentabilidade')).toBeInTheDocument()
    expect(screen.getByText('Em Andamento')).toBeInTheDocument()
    expect(screen.getByText('Enviado')).toBeInTheDocument()
    expect(screen.queryByText('Finalizado')).not.toBeInTheDocument()
    expect(screen.queryByText('Aguardando Aprovação')).not.toBeInTheDocument()
    expect(screen.queryByText('Escritório')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enviar para revisão/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aprovar release/ })).not.toBeInTheDocument()
  })

  it('mostra destinatários no detalhe ao abrir um release da lista', async () => {
    const user = userEvent.setup()
    renderReleases()
    await screen.findByText('Compromissos de sustentabilidade')
    await user.click(screen.getByRole('button', { name: /Abrir release Compromissos de sustentabilidade/ }))

    expect(await screen.findByText('Enviado para')).toBeInTheDocument()
    expect(screen.getByText('Carolina Montenegro — Valor Econômico')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum destinatário.')).not.toBeInTheDocument()
  })

  it('mostra linha muted no detalhe quando o release não tem destinatários', async () => {
    const user = userEvent.setup()
    renderReleases()
    await screen.findByText('Resultados do primeiro trimestre')
    await user.click(screen.getByRole('button', { name: /Abrir release Resultados do primeiro trimestre/ }))

    expect(await screen.findByText('Enviado para')).toBeInTheDocument()
    expect(screen.getByText('Nenhum destinatário.')).toBeInTheDocument()
  })

  it('abre o editor pelo promo Começar', async () => {
    const user = userEvent.setup()
    renderReleases()
    await screen.findByText('Resultados do primeiro trimestre')
    await user.click(screen.getByRole('button', { name: /Começar/ }))
    expect(await screen.findByRole('heading', { name: 'Criar release' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Corpo do release').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Buscar jornalista…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baixar modelo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importar planilha' })).toBeDisabled()
  })
})
