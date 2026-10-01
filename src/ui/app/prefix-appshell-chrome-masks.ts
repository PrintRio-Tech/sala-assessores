import { ICONS } from '@print/ui'

import { withAssetBase } from '@/shared/with-asset-base'

const chromeButtonAssets: Record<string, string> = {
  'Recolher menu': ICONS.ui.chevronLeft,
  'Expandir menu': ICONS.ui.chevronLeft,
  'Abrir menu': ICONS.ui.menu,
  'Fechar menu': ICONS.ui.menu,
}

export function prefixAppShellChromeMasks(
  root: ParentNode,
  baseUrl: string = import.meta.env.BASE_URL,
): void {
  for (const [label, assetPath] of Object.entries(chromeButtonAssets)) {
    const mask = `url("${withAssetBase(assetPath, baseUrl)}")`
    root.querySelectorAll(`button[aria-label="${label}"]`).forEach((button) => {
      button.querySelectorAll('span').forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        node.style.maskImage = mask
        node.style.webkitMaskImage = mask
      })
    })
  }
}
