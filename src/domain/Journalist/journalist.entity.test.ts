import { describe, expect, it } from 'vitest'

import {
  assertRelationshipEvaluation,
  isObjectiveJournalistFact,
} from './journalist.entity'
import { InvalidRelationshipEvaluationError } from './errors/journalist.errors'

describe('Journalist domain', () => {
  it('exige autor e data em avaliações de relacionamento', () => {
    expect(() =>
      assertRelationshipEvaluation({
        id: 'e1',
        authorName: 'Ana Paula',
        recordedAt: new Date('2026-07-01T10:00:00.000Z'),
        score: 4.8,
        traits: ['Foco em Dados'],
        editorialToneLabel: 'Imparcial / Analítico',
        notes: 'Postura analítica nas entrevistas.',
      }),
    ).not.toThrow()

    expect(() =>
      assertRelationshipEvaluation({
        id: 'e2',
        authorName: '   ',
        recordedAt: new Date('2026-07-01T10:00:00.000Z'),
        score: 4,
        traits: [],
        editorialToneLabel: 'Imparcial',
        notes: '',
      }),
    ).toThrow(InvalidRelationshipEvaluationError)

    expect(() =>
      assertRelationshipEvaluation({
        id: 'e3',
        authorName: 'Ana Paula',
        recordedAt: new Date('data-invalida'),
        score: 4,
        traits: [],
        editorialToneLabel: 'Imparcial',
        notes: '',
      }),
    ).toThrow('Avaliação de relacionamento exige data de registro.')
  })

  it('valida nota e tom editorial do registro sem inferir esses dados', () => {
    const baseEvaluation = {
      id: 'e1',
      authorName: 'Ana Paula',
      recordedAt: new Date('2026-07-01T10:00:00.000Z'),
      score: 4,
      traits: ['Analítica'],
      editorialToneLabel: 'Imparcial / Analítico',
      notes: 'Registro manual.',
    }

    expect(() => assertRelationshipEvaluation({ ...baseEvaluation, score: 0 }))
      .toThrow('Informe uma nota entre 1 e 5.')
    expect(() => assertRelationshipEvaluation({ ...baseEvaluation, score: 5.1 }))
      .toThrow('Informe uma nota entre 1 e 5.')
    expect(() => assertRelationshipEvaluation({ ...baseEvaluation, editorialToneLabel: '  ' }))
      .toThrow('Informe o tom editorial observado.')
  })

  it('marca dados objetivos como não-inferência', () => {
    expect(
      isObjectiveJournalistFact({
        kind: 'outlet',
        label: 'Veículo',
        value: 'Valor Econômico',
      }),
    ).toBe(true)

    expect(
      isObjectiveJournalistFact({
        kind: 'evaluation',
        label: 'Rating',
        value: '4.8',
      }),
    ).toBe(false)
  })
})
