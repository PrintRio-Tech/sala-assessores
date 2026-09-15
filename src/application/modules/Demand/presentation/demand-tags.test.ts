import { describe, expect, it } from 'vitest'

import { collectDemandTags, normalizeTag } from './demand-tags'

describe('demand tags', () => {
  it('normaliza trim e colapsa espaços', () => {
    expect(normalizeTag('  operação   urbana  ')).toBe('operação urbana')
  })

  it('lista tags já usadas sem duplicata case-insensitive', () => {
    expect(collectDemandTags([
      { enrichment: { tags: ['Operação', 'urgente'] } },
      { enrichment: { tags: ['operação', ' ESG '] } },
      { enrichment: { tags: [] } },
      {},
    ])).toEqual(['Operação', 'urgente', 'ESG'])
  })
})
