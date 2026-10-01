import { ICONS } from '@print/ui'

import { withAssetBase } from '@/shared/with-asset-base'

/**
 * O <Toaster /> do @print/ui desenha o ícone com mask-image inline usando
 * ICONS.toast (caminho na raiz, ex. /icons/toast/success.svg) e não aceita
 * override. Em subpath (GitHub Pages /sala-assessores/) isso dá 404.
 * Esta folha sobrescreve (com !important, acima do style inline) só os
 * ícones de toast, trocando pelo caminho com o BASE da app.
 */
export function toastIconBaseCss(baseUrl: string = import.meta.env.BASE_URL): string {
  if (!baseUrl || baseUrl === '/') return ''
  return Object.values(ICONS.toast)
    .map((path) => {
      const url = withAssetBase(path, baseUrl)
      return (
        `[data-print-toast-viewport] [style*="${path}"]{` +
        `-webkit-mask-image:url("${url}") !important;` +
        `mask-image:url("${url}") !important;}`
      )
    })
    .join('\n')
}
