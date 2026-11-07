import { describe, expect, it } from 'vitest'
import {
  sampleLevelCurve,
  flattenPoints,
  pointsInRect,
  nearestPoint,
  pointX,
  pointY,
  type LevelEditorScale,
} from './levelEditor.ts'
import type { LevelPoint } from './levelEditor.types.ts'

const points: LevelPoint[] = [
  { id: 'a', tick: 0, value: 0 },
  { id: 'b', tick: 1000, value: 10 },
  { id: 'c', tick: 2000, value: 0 },
]

describe('sampleLevelCurve', () => {
  it('returns 0 for an empty point set', () => {
    expect(sampleLevelCurve([], 500)).toBe(0)
  })

  it('holds the first value before the first point', () => {
    expect(sampleLevelCurve(points, -500)).toBe(0)
  })

  it('holds the last value after the last point', () => {
    expect(sampleLevelCurve(points, 5000)).toBe(0)
  })

  it('linearly interpolates between bracketing points', () => {
    expect(sampleLevelCurve(points, 500)).toBeCloseTo(5)
    expect(sampleLevelCurve(points, 1500)).toBeCloseTo(5)
  })

  it('returns the exact value at a point', () => {
    expect(sampleLevelCurve(points, 1000)).toBe(10)
  })

  it('works with unsorted input', () => {
    const shuffled = [points[2]!, points[0]!, points[1]!]
    expect(sampleLevelCurve(shuffled, 500)).toBeCloseTo(5)
  })
})

describe('flattenPoints', () => {
  it("collapses to one point at the first point's tick", () => {
    const flat = flattenPoints(points, 7)
    expect(flat).toEqual([{ id: 'a', tick: 0, value: 7 }])
  })

  it('generates a fresh point when the set is empty', () => {
    const flat = flattenPoints([], 3)
    expect(flat).toHaveLength(1)
    expect(flat[0]!.tick).toBe(0)
    expect(flat[0]!.value).toBe(3)
  })
})

describe('pointX / pointY', () => {
  const scale: LevelEditorScale = { pixelsPerTick: 0.1, min: 0, max: 10, height: 100 }

  it('pointX scales tick by pixelsPerTick', () => {
    expect(pointX(points[1]!, scale)).toBeCloseTo(100)
  })

  it('pointY is inverted (min at bottom, max at top)', () => {
    expect(pointY({ id: 'x', tick: 0, value: 0 }, scale)).toBeCloseTo(100)
    expect(pointY({ id: 'x', tick: 0, value: 10 }, scale)).toBeCloseTo(0)
    expect(pointY({ id: 'x', tick: 0, value: 5 }, scale)).toBeCloseTo(50)
  })

  it('pointY handles a zero-width value range without dividing by zero', () => {
    const flatScale: LevelEditorScale = {
      pixelsPerTick: 0.1,
      min: 5,
      max: 5,
      height: 100,
    }
    expect(pointY({ id: 'x', tick: 0, value: 5 }, flatScale)).toBe(100)
  })
})

describe('pointsInRect', () => {
  const scale: LevelEditorScale = { pixelsPerTick: 0.1, min: 0, max: 10, height: 100 }

  it('returns ids whose pixel position falls inside the rect', () => {
    // point b: x=100 (tick 1000 * 0.1), y=0 (value 10 -> top)
    const hits = pointsInRect(points, { left: 90, top: -5, width: 20, height: 10 }, scale)
    expect(hits).toEqual(['b'])
  })

  it('returns no ids when the rect misses everything', () => {
    expect(
      pointsInRect(points, { left: 500, top: 500, width: 10, height: 10 }, scale)
    ).toEqual([])
  })
})

describe('nearestPoint', () => {
  const scale: LevelEditorScale = { pixelsPerTick: 0.1, min: 0, max: 10, height: 100 }

  it('finds the closest point within maxDistance', () => {
    // point a: x=0, y=100 (value 0 -> bottom)
    expect(nearestPoint(points, 2, 98, scale)).toBe('a')
  })

  it('returns null when nothing is close enough', () => {
    expect(nearestPoint(points, 500, 500, scale)).toBeNull()
  })
})
