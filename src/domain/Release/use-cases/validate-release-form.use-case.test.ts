import { describe, expect, it } from 'vitest'

import { validateReleaseForm } from './validate-release-form.use-case'

const valid = {
  title: 'Comunicado',
  subtitle: 'Linha de apoio',
  body: '<p>Corpo</p>',
  tags: ['economia'],
  status: 'in_progress' as const,
  publishedDate: '',
  journalistIds: [] as string[],
}

describe('validateReleaseForm', () => {
  it('espelha o copy do Forms e não exige atividade', () => {
    expect(validateReleaseForm({ ...valid, title: '', subtitle: '', body: '', tags: [] }, { isCreate: true })).toEqual({
      title: 'Informe o título do release.',
      subtitle: 'Informe o subtítulo do release.',
      body: 'Escreva o corpo do comunicado.',
      tags: 'Adicione ao menos uma tag.',
    })
  })

  it('exige destinatário só no envio', () => {
    expect(validateReleaseForm({ ...valid, status: 'sent' }).journalistIds).toBe(
      'Informe pelo menos um destinatário para enviar o release.',
    )
    expect(validateReleaseForm({ ...valid, status: 'sent', journalistIds: ['j-1'] })).toEqual({})
  })
})
