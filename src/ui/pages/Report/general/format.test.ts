import { describe, expect, it } from 'vitest'

import { formatHeatmapMonth, nearestToneStars } from './format'

describe('formatHeatmapMonth', () => {
  it('mostra só o mês, sem ano', () => {
    expect(formatHeatmapMonth('2026-11')).toBe('Nov')
    expect(formatHeatmapMonth('2025-12')).toBe('Dez')
    expect(formatHeatmapMonth('2026-01')).not.toMatch(/\d/)
    expect(formatHeatmapMonth('2026-09')).not.toContain('de')
  })
})

describe('nearestToneStars', () => {
  it('arredonda o tom médio para a escala de 1 a 5', () => {
    expect(nearestToneStars(3.1)).toBe(3)
    expect(nearestToneStars(4.6)).toBe(5)
    expect(nearestToneStars(null)).toBeNull()
  })
})
