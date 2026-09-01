import { describe, expect, it } from 'vitest'

import { mockJournalistDtos } from '@/infrastructure/mock/seed'
import { journalistDtoSchema } from '../DTOs/journalist.dto'
import { toDomain } from './journalist.mapper'

describe('journalist mapper', () => {
  it('isola arrays do domínio para impedir mutação acidental do seed', () => {
    const dto = journalistDtoSchema.parse(structuredClone(mockJournalistDtos[0]))
    const originalTopics = [...dto.topics]
    const originalTraits = [...(dto.relationship_evaluations[0]?.traits ?? [])]

    const journalist = toDomain(dto)
    journalist.topics.push('Tema mutante')
    journalist.relationshipEvaluations[0]?.traits.push('Traço mutante')

    expect(dto.topics).toEqual(originalTopics)
    expect(dto.relationship_evaluations[0]?.traits).toEqual(originalTraits)
  })
})
