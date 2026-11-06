import { describe, expect, it } from 'vitest'
import { cx } from './cx.ts'

describe('cx', () => {
  it('joins truthy class names and skips falsy ones', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
    expect(cx()).toBe('')
  })

  it('takes a dictionary as the whole argument', () => {
    expect(cx({ a: true, b: false, c: null, d: undefined, e: true })).toBe('a e')
    expect(cx({ a: false })).toBe('')
  })

  it('mixes dictionaries with class names, in order', () => {
    expect(cx('a', { b: true, c: false }, 'd', { e: true })).toBe('a b d e')
  })

  it('flattens arrays of class names and dictionaries', () => {
    expect(cx(['a', { b: true, c: false }, ['d', null]], 'e')).toBe('a b d e')
    expect(cx([], [false], { x: false })).toBe('')
  })
})
