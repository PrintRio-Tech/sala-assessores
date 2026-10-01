import { ICONS } from '@print/ui'

import { withAssetBase } from '@/shared/with-asset-base'

/**
 * O @print/ui desenha alguns ícones com mask-image inline em `/icons/...`.
 * Em subpath (GitHub Pages `/sala-assessores/`) isso 404. Esta folha
 * reescreve toast, calendário e setas do DatePicker com o BASE da app.
 */
export function toastIconBaseCss(baseUrl: string = import.meta.env.BASE_URL): string {
  if (!baseUrl || baseUrl === '/') return ''

  const maskRule = (selectorPrefix: string, path: string) => {
    const url = withAssetBase(path, baseUrl)
    return (
      `${selectorPrefix}[style*="${path}"]{` +
      `-webkit-mask-image:url("${url}") !important;` +
      `mask-image:url("${url}") !important;}`
    )
  }

  return [
    ...Object.values(ICONS.toast).map((path) => maskRule('[data-print-toast-viewport] ', path)),
    ...[ICONS.datePicker.calendar, ICONS.datePicker.clock, ICONS.ui.chevronLeft, ICONS.ui.chevronRight].map((path) =>
      maskRule('', path),
    ),
  ].join('\n')
}
