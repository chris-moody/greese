import { describe, expect, it } from 'vitest'
import { snapFrame } from './snap.ts'

describe('snapFrame', () => {
  // tolerance = SNAP_PX (7) / frameWidth
  it('snaps to the nearest target within tolerance', () => {
    expect(snapFrame(10, [11, 30], 7)).toBe(11) // |10-11| = 1 <= 1
  })

  it('leaves the candidate when no target is close enough', () => {
    expect(snapFrame(10, [12], 7)).toBe(10) // |10-12| = 2 > 1
  })

  it('returns the candidate when there are no targets', () => {
    expect(snapFrame(10, [], 7)).toBe(10)
  })

  it('has a wider tolerance at smaller frame widths', () => {
    // frameWidth 2 -> tolerance 3.5
    expect(snapFrame(10, [13], 2)).toBe(13)
  })
})
