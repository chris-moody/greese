import { afterEach, describe, expect, it } from 'vitest'
import { getSchemeScript } from './scheme.ts'

const run = (script: string) => new Function(script)()

describe('getSchemeScript', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-sauce-scheme')
  })

  it.each(['light', 'dark'])('applies a saved %s scheme to <html>', (scheme) => {
    localStorage.setItem('sauce-scheme', scheme)
    run(getSchemeScript())
    expect(document.documentElement.getAttribute('data-sauce-scheme')).toBe(scheme)
  })

  it('ignores missing or unknown values', () => {
    run(getSchemeScript())
    localStorage.setItem('sauce-scheme', 'purple')
    run(getSchemeScript())
    expect(document.documentElement.hasAttribute('data-sauce-scheme')).toBe(false)
  })

  it('honours a custom storage key, safely quoted', () => {
    const key = `my"key`
    localStorage.setItem(key, 'dark')
    run(getSchemeScript({ storageKey: key }))
    expect(document.documentElement.getAttribute('data-sauce-scheme')).toBe('dark')
  })

  it('survives storage access throwing', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked')
      },
    })
    try {
      expect(() => run(getSchemeScript())).not.toThrow()
    } finally {
      Object.defineProperty(globalThis, 'localStorage', original)
    }
  })
})
