import { beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { resetInMemoryAdapters } from '@/application/in-memory-adapters'

const localStorageMock = (() => {
  let store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store = new Map()
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

const matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  addListener: () => undefined,
  removeListener: () => undefined,
    dispatchEvent: () => false,
})

beforeEach(() => {
  resetInMemoryAdapters()
})

Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: matchMedia,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMedia,
  })
}
