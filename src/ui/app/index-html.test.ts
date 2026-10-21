import { existsSync, readFileSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('index.html favicon da aba', () => {
  it('espelha o PNG Print do Forms, com BASE_URL do Vite', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    const icon = join(root, 'public/logos/icon.png')

    expect(html).toContain('<link rel="icon" type="image/png" href="%BASE_URL%logos/icon.png" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="%BASE_URL%logos/icon.png" />')
    expect(html).toContain('<meta name="theme-color" content="#2C412A" />')
    expect(html).not.toContain('favicon.svg')
    expect(html).not.toContain('href="/logos/icon.png"')
    expect(existsSync(icon)).toBe(true)
    expect(statSync(icon).size).toBe(10623)
    expect(existsSync(join(root, 'public/favicon.svg'))).toBe(false)
  })
})
