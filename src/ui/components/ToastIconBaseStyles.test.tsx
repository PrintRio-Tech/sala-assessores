import { ICONS } from '@print/ui'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { toastIconBaseCss } from '@/shared/toast-icon-base-css'
import { ToastIconBaseStyles } from './ToastIconBaseStyles'

describe('ToastIconBaseStyles', () => {
  it('reescreve todos os ícones de toast com o BASE da app', () => {
    const css = toastIconBaseCss('/sala-assessores/')
    for (const path of Object.values(ICONS.toast)) {
      expect(css).toContain(`[style*="${path}"]`)
      expect(css).toContain(`url("/sala-assessores/${path.replace(/^\//, '')}") !important`)
    }
  })

  it('não injeta nada quando o BASE é a raiz', () => {
    expect(toastIconBaseCss('/')).toBe('')
    const { container } = render(<ToastIconBaseStyles baseUrl="/" />)
    expect(container.querySelector('style')).toBeNull()
  })

  it('renderiza a folha de estilo em subpath', () => {
    const { container } = render(<ToastIconBaseStyles baseUrl="/sala-assessores/" />)
    expect(container.querySelector('style[data-toast-icon-base]')?.textContent).toContain(
      '/sala-assessores/icons/toast/success.svg',
    )
  })
})
