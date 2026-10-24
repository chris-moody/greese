import { describe, expect, it } from 'vitest'
import { listTarget } from './listTarget.ts'

describe('listTarget', () => {
  it('steps and wraps, and starts from either end when nothing is current', () => {
    expect(listTarget('ArrowDown', 1, 3)).toBe(2)
    expect(listTarget('ArrowDown', 2, 3)).toBe(0)
    expect(listTarget('ArrowUp', 0, 3)).toBe(2)
    expect(listTarget('ArrowDown', -1, 3)).toBe(0)
    expect(listTarget('ArrowUp', -1, 3)).toBe(2)
  })

  it('jumps to the ends with Home and End, unless they belong to a text field', () => {
    expect(listTarget('Home', 2, 3)).toBe(0)
    expect(listTarget('End', 0, 3)).toBe(2)
    expect(listTarget('Home', 2, 3, { edges: false })).toBeUndefined()
  })

  it('takes the keys of the orientation and direction', () => {
    const rtl = { prev: 'ArrowRight', next: 'ArrowLeft' }
    expect(listTarget('ArrowLeft', 0, 3, rtl)).toBe(1)
    expect(listTarget('ArrowDown', 0, 3, rtl)).toBeUndefined()
  })

  it('has nowhere to go in an empty list, or for other keys', () => {
    expect(listTarget('ArrowDown', -1, 0)).toBeUndefined()
    expect(listTarget('a', 0, 3)).toBeUndefined()
  })
})
