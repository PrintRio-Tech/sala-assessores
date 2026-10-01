import { describe, expect, it } from 'vitest'

import { withAssetBase } from './with-asset-base'

describe('withAssetBase', () => {
  it('mantém o path absoluto quando a app está na raiz', () => {
    expect(withAssetBase('/icons/nav/home.svg', '/')).toBe('/icons/nav/home.svg')
    expect(withAssetBase('/logos/wordmark-chumbo.png', '/')).toBe('/logos/wordmark-chumbo.png')
  })

  it('prefixa o BASE do GitHub Pages nos ícones e logos do DS', () => {
    expect(withAssetBase('/icons/nav/home.svg', '/sala-assessores/')).toBe(
      '/sala-assessores/icons/nav/home.svg',
    )
    expect(withAssetBase('/logos/wordmark-light-tagline.png', '/sala-assessores/')).toBe(
      '/sala-assessores/logos/wordmark-light-tagline.png',
    )
  })
})
