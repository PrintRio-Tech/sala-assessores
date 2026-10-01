import { describe, expect, it } from 'vitest'

import { prefixAppShellChromeMasks } from './prefix-appshell-chrome-masks'

describe('prefixAppShellChromeMasks', () => {
  it('prefixa maskImage dos ícones de Recolher e Abrir menu', () => {
    document.body.innerHTML = [
      '<button aria-label="Recolher menu"><span class="collapseIcon"></span></button>',
      '<button aria-label="Abrir menu"><span></span></button>',
    ].join('')

    const chevron = document.querySelector('[aria-label="Recolher menu"] span') as HTMLElement
    const menu = document.querySelector('[aria-label="Abrir menu"] span') as HTMLElement
    chevron.style.maskImage = 'url("/icons/ui/chevron-left.svg")'
    chevron.style.webkitMaskImage = 'url("/icons/ui/chevron-left.svg")'
    menu.style.maskImage = 'url("/icons/ui/menu.svg")'

    prefixAppShellChromeMasks(document, '/sala-assessores/')

    expect(chevron.style.maskImage).toBe('url("/sala-assessores/icons/ui/chevron-left.svg")')
    expect(chevron.style.webkitMaskImage).toBe('url("/sala-assessores/icons/ui/chevron-left.svg")')
    expect(menu.style.maskImage).toBe('url("/sala-assessores/icons/ui/menu.svg")')
    expect(chevron.className).toBe('collapseIcon')
  })

  it('prefixa Expandir e Fechar menu sem remover a classe de flip', () => {
    document.body.innerHTML = [
      '<button aria-label="Expandir menu"><span class="collapseIcon collapseIconFlipped"></span></button>',
      '<button aria-label="Fechar menu"><span></span></button>',
    ].join('')

    const chevron = document.querySelector('[aria-label="Expandir menu"] span') as HTMLElement
    prefixAppShellChromeMasks(document, '/sala-assessores/')

    expect(chevron.style.maskImage).toBe('url("/sala-assessores/icons/ui/chevron-left.svg")')
    expect(chevron.className).toBe('collapseIcon collapseIconFlipped')
    expect(
      (document.querySelector('[aria-label="Fechar menu"] span') as HTMLElement).style.maskImage,
    ).toBe('url("/sala-assessores/icons/ui/menu.svg")')
  })

  it('na raiz do host mantém o path absoluto do DS', () => {
    document.body.innerHTML = '<button aria-label="Recolher menu"><span></span></button>'
    const chevron = document.querySelector('span') as HTMLElement
    prefixAppShellChromeMasks(document, '/')
    expect(chevron.style.maskImage).toBe('url("/icons/ui/chevron-left.svg")')
  })
})
