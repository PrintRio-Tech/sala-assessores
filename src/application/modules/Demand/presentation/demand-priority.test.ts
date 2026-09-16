import { describe, expect, it } from 'vitest'

import { DEMAND_PRIORITY_LABELS, DEMAND_PRIORITY_OPTIONS } from './demand-priority'

describe('demand priority labels', () => {
  it('usa P0 como máximo e distingue crítica de alta', () => {
    expect(DEMAND_PRIORITY_LABELS).toEqual({
      critical: 'P0 · Crítica',
      high: 'P1 · Alta',
      medium: 'P2 · Média',
      low: 'P3 · Baixa',
    })
  })

  it('oferece as mesmas labels no select de captura', () => {
    expect(DEMAND_PRIORITY_OPTIONS).toEqual([
      { value: 'low', label: 'P3 · Baixa' },
      { value: 'medium', label: 'P2 · Média' },
      { value: 'high', label: 'P1 · Alta' },
      { value: 'critical', label: 'P0 · Crítica' },
    ])
  })
})
