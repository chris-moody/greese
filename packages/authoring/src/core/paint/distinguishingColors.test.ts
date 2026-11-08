import { describe, expect, it } from 'vitest'
import { DISTINGUISHING_COLORS, distinguishingColor } from './distinguishingColors.ts'

describe('distinguishingColor', () => {
  it('starts at red, then the opposite hue, then the quarters', () => {
    // HSB 75% / 95%: red, cyan, then yellow-green and violet.
    expect(DISTINGUISHING_COLORS.slice(0, 4)).toEqual([
      '#f23d3d',
      '#3df2f2',
      '#97f23d',
      '#973df2',
    ])
  })

  it('gives thirty different colours and wraps past them, both ways', () => {
    expect(new Set(DISTINGUISHING_COLORS).size).toBe(30)
    expect(distinguishingColor(30)).toBe(distinguishingColor(0))
    expect(distinguishingColor(-1)).toBe(distinguishingColor(29))
  })
})
