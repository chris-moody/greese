import { describe, expect, it } from 'vitest'
import { flatten } from '../measure.ts'
import { parsePath } from '../path.ts'
import { toPath } from '../shapes.ts'
import { subtractPath } from './index.ts'

/** The area a path fills under `nonzero`, when its holes wind against it: the sum of signed areas. */
const filled = (d: string) =>
  Math.abs(
    flatten(d, { tolerance: 0.001 }).reduce((sum, { points }) => {
      let a = 0
      for (let i = 0; i < points.length; i++) {
        const p = points[i]!
        const q = points[(i + 1) % points.length]!
        a += p[0] * q[1] - q[0] * p[1]
      }
      return sum + a / 2
    }, 0)
  )

const subpaths = (d: string) => parsePath(d).filter(([c]) => c === 'M').length
const rect = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}H${x + w}V${y + h}H${x}Z`
const circle = (cx: number, cy: number, r: number) =>
  toPath({ type: 'circle', cx, cy, r })

describe('subtractPath', () => {
  it('cuts a corner from a square, as one outline of lines', () => {
    const { d, changed } = subtractPath(rect(0, 0, 10, 10), rect(5, 5, 10, 10))
    expect(changed).toBe(true)
    expect(filled(d)).toBeCloseTo(75, 6)
    expect(subpaths(d)).toBe(1)
    expect(d).not.toContain('C')
  })

  it('makes a hole that winds against its outline', () => {
    const { d } = subtractPath(rect(0, 0, 10, 10), rect(3, 3, 4, 4))
    expect(subpaths(d)).toBe(2)
    expect(filled(d)).toBeCloseTo(84, 6)
  })

  it('turns a cutter wound the other way round', () => {
    const { d } = subtractPath(rect(0, 0, 10, 10), 'M3 3V7H7V3Z')
    expect(filled(d)).toBeCloseTo(84, 6)
  })

  it('keeps curves: a crescent of two circles is a few arcs', () => {
    const { d } = subtractPath(circle(0, 0, 5), circle(5, 0, 5))
    // The lens of two r = 5 circles 5 apart is 2r²·acos(d/2r) − (d/2)·√(4r² − d²).
    const lens = 50 * Math.acos(0.5) - 2.5 * Math.sqrt(75)
    expect(filled(d)).toBeCloseTo(Math.PI * 25 - lens, 2)
    expect(subpaths(d)).toBe(1)
    expect(parsePath(d).length).toBeLessThan(10)
    expect(d).toContain('C')
  })

  it('cuts a circle in half with a square', () => {
    // Against the drawn circle's own area: four cubics enclose a touch more than πr².
    const whole = circle(0, 0, 5)
    const { d } = subtractPath(whole, rect(0, -10, 20, 20))
    expect(filled(d)).toBeCloseTo(filled(whole) / 2, 2)
    expect(flatten(d)[0]!.points.every(([x]) => x <= 1e-9)).toBe(true)
  })

  it('handles edges that lie along each other', () => {
    const { d } = subtractPath(rect(0, 0, 10, 10), rect(5, 0, 10, 10))
    expect(filled(d)).toBeCloseTo(50, 6)
    expect(subpaths(d)).toBe(1)
  })

  it('splits a shape in two when the cut goes right through', () => {
    const { d } = subtractPath(rect(0, 0, 10, 4), rect(4, -1, 2, 6))
    expect(subpaths(d)).toBe(2)
    expect(filled(d)).toBeCloseTo(32, 6)
  })

  it('leaves the subject as it was when the cutter misses', () => {
    const subject = rect(0, 0, 10, 10)
    expect(subtractPath(subject, rect(20, 20, 5, 5))).toEqual({
      d: subject,
      changed: false,
    })
  })

  it('leaves nothing when the cutter covers the subject', () => {
    expect(subtractPath(rect(2, 2, 2, 2), rect(0, 0, 10, 10))).toEqual({
      d: '',
      changed: true,
    })
  })

  it('trims open lines rather than filling them', () => {
    const { d } = subtractPath('M0 5L10 5', rect(3, 0, 4, 10), { openPaths: 'trim' })
    expect(d).toBe('M0 5L3 5M7 5L10 5')
  })

  it('trims curves at the cutter, keeping them curves', () => {
    const { d } = subtractPath('M0 0C0 10 10 10 10 0', rect(4, -1, 2, 20), {
      openPaths: 'trim',
    })
    expect(subpaths(d)).toBe(2)
    expect(d).toContain('C')
  })

  it('fills an open subpath as SVG does by default', () => {
    const { d } = subtractPath('M0 0H10V10H0', rect(5, 5, 10, 10))
    expect(filled(d)).toBeCloseTo(75, 6)
  })

  it('reads holes by the subject’s fill rule', () => {
    // Both loops wind the same way: with evenodd, the inner one is a hole.
    const donut = `${rect(0, 0, 10, 10)}${rect(3, 3, 4, 4)}`
    const { d } = subtractPath(donut, rect(5, -1, 10, 12), { fillRule: 'evenodd' })
    // The left half of the ring, opened up by the cut into one C-shaped outline.
    expect(subpaths(d)).toBe(1)
    expect(filled(d)).toBeCloseTo(50 - 8, 6)
    expect(flatten(d)[0]!.points.every(([x]) => x <= 5 + 1e-9)).toBe(true)
  })
  it('matches the exact area for rects on a grid, shared edges and corners included', () => {
    // A seeded walk, so the cases are the same every run.
    let seed = 7
    const next = (n: number) => {
      seed = (seed * 16807) % 2147483647
      return seed % n
    }
    for (let i = 0; i < 300; i++) {
      const [ax, ay, aw, ah] = [next(6), next(6), 1 + next(6), 1 + next(6)]
      const [bx, by, bw, bh] = [next(10), next(10), 1 + next(6), 1 + next(6)]
      const overlap =
        Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx)) *
        Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by))
      const { d } = subtractPath(rect(ax, ay, aw, ah), rect(bx, by, bw, bh))
      expect(filled(d), `${rect(ax, ay, aw, ah)} − ${rect(bx, by, bw, bh)}`).toBeCloseTo(
        aw * ah - overlap,
        6
      )
    }
  })
  it('keeps area(A − B) − area(B − A) = area(A) − area(B) for curves and polygons', () => {
    let seed = 11
    const next = (n: number) => {
      seed = (seed * 16807) % 2147483647
      return (seed % (n * 100)) / 100
    }
    const shape = (k: number) =>
      k === 0
        ? circle(next(10), next(10), 1 + next(5))
        : k === 1
          ? rect(next(10), next(10), 1 + next(6), 1 + next(6))
          : toPath({
              type: 'regularPolygon',
              cx: next(10),
              cy: next(10),
              r: 1 + next(5),
              sides: 3 + (seed % 6),
            })
    for (let i = 0; i < 150; i++) {
      const a = shape(i % 3)
      const b = shape((i + 1 + (seed % 2)) % 3)
      const ab = subtractPath(a, b).d
      const ba = subtractPath(b, a).d
      expect(filled(ab) - filled(ba), `${a} / ${b}`).toBeCloseTo(filled(a) - filled(b), 1)
    }
  })
})
