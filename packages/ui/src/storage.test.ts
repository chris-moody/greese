import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStoredValue } from './storage.ts'

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('createStoredValue', () => {
  it('reads the fallback until something is stored, then the stored value', () => {
    const value = createStoredValue('t-plain', { n: 1 })
    expect(value.get()).toEqual({ n: 1 })
    value.set({ n: 2 })
    expect(localStorage.getItem('t-plain')).toBe('{"n":2}')
    expect(value.get()).toEqual({ n: 2 })
    value.set((v) => ({ n: v.n + 1 }))
    expect(value.get()).toEqual({ n: 3 })
    value.remove()
    expect(value.get()).toEqual({ n: 1 })
  })

  it('returns the same object while the stored text is unchanged', () => {
    const value = createStoredValue('t-same', { n: 1 })
    value.set({ n: 2 })
    expect(value.get()).toBe(value.get())
  })

  it('reads the fallback for what it can’t parse, or what fails validation', () => {
    localStorage.setItem('t-bad', '{not json')
    expect(createStoredValue('t-bad', 'x').get()).toBe('x')
    localStorage.setItem('t-shape', '42')
    const isText = (v: unknown): v is string => typeof v === 'string'
    expect(createStoredValue('t-shape', 'x', { validate: isText }).get()).toBe('x')
  })

  it('stores plain text with its own serializer', () => {
    const scheme = createStoredValue<string>('t-text', 'system', {
      serialize: String,
      parse: (t) => t,
    })
    scheme.set('dark')
    expect(localStorage.getItem('t-text')).toBe('dark')
  })

  it('tells every handle on the key, and listens for other tabs', () => {
    const a = createStoredValue('t-shared', 0)
    const b = createStoredValue('t-shared', 0)
    const heard = vi.fn()
    const stop = b.subscribe(heard)
    a.set(5)
    expect(heard).toHaveBeenCalledTimes(1)
    expect(b.get()).toBe(5)
    window.dispatchEvent(new StorageEvent('storage', { key: 't-shared' }))
    expect(heard).toHaveBeenCalledTimes(2)
    // The same key in the other area is another value.
    window.dispatchEvent(
      new StorageEvent('storage', { key: 't-shared', storageArea: sessionStorage })
    )
    expect(heard).toHaveBeenCalledTimes(2)
    window.dispatchEvent(
      new StorageEvent('storage', { key: 't-shared', storageArea: localStorage })
    )
    expect(heard).toHaveBeenCalledTimes(3)
    stop()
    a.set(6)
    expect(heard).toHaveBeenCalledTimes(3)
  })

  it('keeps working in memory when storage refuses', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    const value = createStoredValue('t-full', 'a')
    value.set('b')
    expect(value.get()).toBe('b')
  })

  it('keeps session values apart from local ones', () => {
    createStoredValue('t-area', 'x', { area: 'session' }).set('s')
    expect(sessionStorage.getItem('t-area')).toBe('"s"')
    expect(localStorage.getItem('t-area')).toBeNull()
  })
})
