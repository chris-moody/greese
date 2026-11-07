import { describe, expect, it } from 'vitest'
import { isSafeTick, clampTick, addTicks, ticksToPixels, pixelsToTicks } from './ticks.ts'

describe('isSafeTick', () => {
  it('is true for safe integers, false for floats/unsafe values', () => {
    expect(isSafeTick(0)).toBe(true)
    expect(isSafeTick(960)).toBe(true)
    expect(isSafeTick(1.5)).toBe(false)
    expect(isSafeTick(Number.MAX_SAFE_INTEGER + 1)).toBe(false)
  })
})

describe('clampTick', () => {
  it('rounds to the nearest integer', () => {
    expect(clampTick(4.4, 0, 100)).toBe(4)
    expect(clampTick(4.6, 0, 100)).toBe(5)
  })

  it('clamps into [min, max]', () => {
    expect(clampTick(-10, 0, 100)).toBe(0)
    expect(clampTick(200, 0, 100)).toBe(100)
  })
})

describe('addTicks', () => {
  it('adds two ticks', () => {
    expect(addTicks(240, 480)).toBe(720)
  })
})

describe('ticksToPixels / pixelsToTicks', () => {
  it('round-trips through a zoom level', () => {
    const pixelsPerTick = 14 / 1000
    const px = ticksToPixels(2000, pixelsPerTick)
    expect(px).toBeCloseTo(28)
    expect(pixelsToTicks(px, pixelsPerTick)).toBe(2000)
  })

  it('pixelsToTicks returns 0 for a non-positive zoom level', () => {
    expect(pixelsToTicks(100, 0)).toBe(0)
  })
})
