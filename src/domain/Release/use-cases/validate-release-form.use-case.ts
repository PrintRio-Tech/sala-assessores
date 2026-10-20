import { stripReleaseHtml, type ReleaseStatus } from '../release.entity'
import { InvalidReleaseInputError } from '../errors/release.errors'

export type ReleaseFormValues = {
  title: string
  subtitle: string
  body: string
  tags: string[]
  status: ReleaseStatus
  publishedDate: string
  journalistIds: string[]
}

export function validateReleaseForm(
  values: ReleaseFormValues,
  options?: { isCreate?: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.title.trim()) {
    errors.title = 'Informe o título do release.'
  }
  if (!values.subtitle.trim()) {
    errors.subtitle = 'Informe o subtítulo do release.'
  }
  if (stripReleaseHtml(values.body).length === 0) {
    errors.body = 'Escreva o corpo do comunicado.'
  }
  if (options?.isCreate && values.tags.length === 0) {
    errors.tags = 'Adicione ao menos uma tag.'
  }
  if (values.status === 'sent' && values.journalistIds.length === 0) {
    errors.journalistIds = 'Informe pelo menos um destinatário para enviar o release.'
  }

  return errors
}

export function assertReleaseForm(values: ReleaseFormValues, options?: { isCreate?: boolean }) {
  const errors = validateReleaseForm(values, options)
  const first = Object.values(errors)[0]
  if (first) throw new InvalidReleaseInputError(first)
}
