import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as PrintUI from '@print/ui'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { appRoutes } from '@/ui/routes/router'

const here = dirname(fileURLToPath(import.meta.url))

function readAuthSource(rel: string) {
  return readFileSync(join(here, rel), 'utf8')
}

function renderAuthRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('telas de auth consomem AuthLayout do @print/ui', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('expõe AuthLayout e os slots de formulário no pacote público', () => {
    expect(PrintUI).toHaveProperty('AuthLayout')
    expect(PrintUI).toHaveProperty('AuthFormHeader')
    expect(PrintUI).toHaveProperty('AuthForm')
    expect(PrintUI).toHaveProperty('AuthFormActions')
    expect(PrintUI).toHaveProperty('AuthEmailBadge')
    expect(PrintUI).toHaveProperty('AuthInlineStatus')
  })

  it('em /login e /login/verificar usa o shell do DS com título e descrição do produto', () => {
    const { unmount } = renderAuthRoute('/login')

    expect(screen.getByRole('link', { name: 'Ir para o conteúdo principal' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(document.getElementById('main-content')?.tagName).toBe('MAIN')
    expect(screen.getByRole('heading', { level: 2, name: 'Entre com seu e-mail' })).toBeInTheDocument()
    expect(screen.getByText('Código de uso único por e-mail — sem senha.')).toBeInTheDocument()
    expect(screen.getByText('Acesso seguro')).toBeInTheDocument()

    unmount()

    renderAuthRoute('/login/verificar?email=test@example.com')

    expect(screen.getByRole('link', { name: 'Ir para o conteúdo principal' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(document.getElementById('main-content')?.tagName).toBe('MAIN')
    expect(screen.getByRole('heading', { level: 2, name: 'Confirme o código' })).toBeInTheDocument()
    expect(screen.getByText('Informe o código de 6 dígitos.')).toBeInTheDocument()
    expect(screen.getByText(/Solicitado para/)).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('compõe o layout do DS nas páginas, sem regra de negócio no shell', () => {
    const login = readAuthSource('login/index.tsx')
    const verify = readAuthSource('verify/index.tsx')
    const layout = readAuthSource('AuthLayout.tsx')
    const pages = `${login}\n${verify}`

    expect(pages).toMatch(/import\s*\{[\s\S]*AuthLayout[\s\S]*\}\s*from\s*['"]@print\/ui['"]/)
    expect(pages).toMatch(/import\s*\{[\s\S]*AuthFormHeader[\s\S]*\}\s*from\s*['"]@print\/ui['"]/)
    expect(pages).toMatch(/import\s*\{[\s\S]*AuthForm[\s\S]*\}\s*from\s*['"]@print\/ui['"]/)
    expect(verify).toMatch(/AuthEmailBadge/)
    expect(verify).toMatch(/AuthFormActions/)
    expect(pages).toMatch(/AuthInlineStatus/)

    expect(login).toMatch(/title=["']Entre com seu e-mail["']/)
    expect(login).toMatch(/description=["']Código de uso único por e-mail — sem senha\.["']/)
    expect(verify).toMatch(/title=["']Confirme o código["']/)
    expect(verify).toMatch(/description=["']Informe o código de 6 dígitos\.["']/)

    expect(layout).not.toMatch(/useLocation/)
    expect(layout).not.toMatch(/pathname/)
    expect(layout).not.toMatch(/isValidEmail|useLogin|useSession|toLowerCase/)
    expect(layout).not.toMatch(/from ['"]@\/(application|domain)/)
  })
})
