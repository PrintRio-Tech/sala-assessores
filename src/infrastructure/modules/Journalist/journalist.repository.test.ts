import { describe, expect, it } from 'vitest'

import type { NewJournalist } from '@/domain/Journalist/journalist.repository'
import { MockJournalistRepository } from './journalist.repository'

const localJournalist: NewJournalist = {
  name: 'Joana Ribeiro',
  roleTitle: 'Repórter',
  outletName: 'Jornal da Cidade',
  desk: 'Cotidiano',
  email: 'joana@jornal.test',
  phone: '',
  preferredChannel: 'email',
  bestContactWindow: 'Manhã',
  topics: ['Cidades'],
  isActive: true,
  objectiveStats: { totalDemands: 0, solicitedCount: 0, proactiveCount: 0, successRate: 0, positioningUsageRate: 0 },
  demandHistory: [],
  relationshipEvaluations: [],
}

describe('MockJournalistRepository create', () => {
  it('mantém o novo jornalista somente na instância da sessão e permite abrir o detalhe', async () => {
    const repository = new MockJournalistRepository(() => 'uuid-safe')

    const created = await repository.create(localJournalist)

    expect(created.id).toBe('j-local-uuid-safe')
    expect((await repository.list()).items[0]).toEqual(created)
    expect(await repository.getById(created.id)).toEqual(created)
    expect(await new MockJournalistRepository(() => 'other').getById(created.id)).toBeNull()
  })

  it('atualiza cadastro objetivo na instância e reflete a mudança na lista e no detalhe', async () => {
    const repository = new MockJournalistRepository(() => 'uuid-safe')
    const original = await repository.getById('j-maria')

    const updated = await repository.updateProfile('j-maria', {
      name: 'Maria Clara Editada',
      roleTitle: original!.roleTitle,
      outletName: 'TechNews Brasil',
      desk: original!.desk,
      email: original!.email,
      phone: original!.phone,
      preferredChannel: original!.preferredChannel,
      bestContactWindow: 'Das 9h às 11h',
      topics: original!.topics,
      isActive: original!.isActive,
    })

    expect(updated).toMatchObject({
      id: 'j-maria',
      name: 'Maria Clara Editada',
      outletName: 'TechNews Brasil',
      bestContactWindow: 'Das 9h às 11h',
    })
    expect(await repository.getById('j-maria')).toEqual(updated)
    expect((await repository.list()).items.find((item) => item.id === 'j-maria')).toEqual(updated)
  })

  it('acrescenta uma avaliação datada sem alterar os dados objetivos do jornalista', async () => {
    const repository = new MockJournalistRepository(() => 'evaluation-id')
    const original = await repository.getById('j-maria')

    const updated = await repository.addRelationshipEvaluation('j-maria', {
      authorName: 'Ana Paula',
      recordedAt: new Date('2026-08-27T10:00:00.000Z'),
      score: 4.5,
      traits: ['Analítica', 'Direta'],
      editorialToneLabel: 'Imparcial / Analítico',
      notes: 'Avaliação registrada após contato direto.',
    })

    expect(updated).toMatchObject({ name: original!.name, email: original!.email })
    expect(updated!.relationshipEvaluations[0]).toMatchObject({
      id: 'evaluation-id',
      authorName: 'Ana Paula',
      recordedAt: new Date('2026-08-27T10:00:00.000Z'),
    })
    expect(updated!.relationshipEvaluations).toHaveLength(original!.relationshipEvaluations.length + 1)
    expect((await repository.list()).items.find((item) => item.id === 'j-maria'))
      .toEqual(updated)
  })

  it('aplica update e avaliação também sobre jornalista criado localmente', async () => {
    const ids = ['local-id', 'evaluation-id']
    const repository = new MockJournalistRepository(() => ids.shift()!)
    const created = await repository.create(localJournalist)

    const edited = await repository.updateProfile(created.id, {
      ...created,
      name: 'Joana Ribeiro Editada',
      bestContactWindow: 'Manhã cedo',
    })
    const evaluated = await repository.addRelationshipEvaluation(created.id, {
      authorName: 'Bruno',
      recordedAt: new Date('2026-08-27T12:00:00.000Z'),
      score: 5,
      traits: ['Colaborativa'],
      editorialToneLabel: 'Favorável / Colaborativo',
      notes: 'Registro manual.',
    })

    expect(edited?.name).toBe('Joana Ribeiro Editada')
    expect(evaluated?.relationshipEvaluations[0]?.id).toBe('evaluation-id')
    expect((await repository.list()).items[0]).toEqual(evaluated)
  })

  it('ordena todos os registros de avaliação por data decrescente sem mutar o seed', async () => {
    const repository = new MockJournalistRepository(() => 'older-evaluation')
    const original = await repository.getById('j-maria')

    const updated = await repository.addRelationshipEvaluation('j-maria', {
      authorName: 'Bruno',
      recordedAt: new Date('2025-01-01T12:00:00.000Z'),
      score: 3,
      traits: [],
      editorialToneLabel: 'Imparcial',
      notes: '',
    })

    expect(updated?.relationshipEvaluations.at(-1)?.id).toBe('older-evaluation')
    expect((await new MockJournalistRepository().getById('j-maria'))?.relationshipEvaluations)
      .toEqual(original?.relationshipEvaluations)
  })
})
