import { toastIconBaseCss } from '@/shared/toast-icon-base-css'

/** Injeta a folha de `toastIconBaseCss` (ícones do Toaster do @print/ui com o BASE da app). */
export function ToastIconBaseStyles({ baseUrl }: { baseUrl?: string }) {
  const css = toastIconBaseCss(baseUrl)
  if (!css) return null
  return <style data-toast-icon-base="">{css}</style>
}
