import { describe, expect, it } from 'vitest'

import { displayName, isValidEmail, normalizeEmail } from './user.entity'

describe('normalizeEmail', () => {
  it('remove espaços e força minúsculas', () => {
    expect(normalizeEmail('  Ana.Silva@Agencia.GOV.br  ')).toBe(
      'ana.silva@agencia.gov.br',
    )
  })
})

describe('isValidEmail', () => {
  it('aceita e-mail com espaços laterais', () => {
    expect(isValidEmail('  assessor@imprensa.gov.br  ')).toBe(true)
  })

  it('rejeita vazio, sem arroba ou domínio incompleto', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('   ')).toBe(false)
    expect(isValidEmail('assessor')).toBe(false)
    expect(isValidEmail('assessor@imprensa')).toBe(false)
  })
})

describe('displayName', () => {
  it('usa o nome quando existe e cai no e-mail quando o nome é nulo', () => {
    expect(displayName({ email: 'a@b.com', name: 'Ana' })).toBe('Ana')
    expect(displayName({ email: 'a@b.com', name: '  ' })).toBe('a@b.com')
    expect(displayName({ email: 'a@b.com', name: null })).toBe('a@b.com')
  })
})
