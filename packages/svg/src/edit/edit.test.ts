import { describe, expect, it } from 'vitest'
import {
  absolutize,
  parsePath,
  serializePath,
  toCubics,
  type Cubic,
  type Point,
} from '../path.ts'
import {
  convertSegment,
  cubicToArc,
  cubicToQuads,
  fitCubics,
  freehandPath,
  nodeHandles,
  nodeType,
  setNodeType,
  setRelative,
  setSegmentRelative,
  smoothPoints,
  splitCubic,
} from './index.ts'

const at = (c: Cubic, t: number): Point => {
  const u = 1 - t
  return [0, 1].map(
    (k) =>
      u * u * u * c[0][k]! +
      3 * u * u * t * c[1][k]! +
      3 * u * t * t * c[2][k]! +
      t * t * t * c[3][k]!
  ) as unknown as Point
}

/** Points along a path's outline, to compare shapes whatever the commands. */
const outline = (d: string, per = 8): Point[] =>
  toCubics(d).flatMap((s) =>
    s.curves.flatMap((c) => Array.from({ length: per }, (_, i) => at(c, i / per)))
  )

/** Whether every point of `b` is within `tolerance` of `a`'s outline. */
const sameShape = (a: string, b: string, tolerance = 0.6) => {
  const dense = outline(a, 64)
  return outline(b).every((p) =>
    dense.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tolerance)
  )
}

const d = (segments: ReturnType<typeof absolutize> | null) => serializePath(segments!, 3)

describe('convertSegment', () => {
  it('turns lines into cubics with handles at thirds, and back', () => {
    const c = convertSegment('M0 0L30 0', 1, 'C')
    expect(d(c)).toBe('M0 0C10 0 20 0 30 0')
    expect(d(convertSegment(c!, 1, 'L'))).toBe('M0 0L30 0')
  })

  it('swaps H and V for L and back, when the line is level', () => {
    expect(d(convertSegment('M0 0H10', 1, 'L'))).toBe('M0 0L10 0')
    expect(d(convertSegment('M0 0L10 0', 1, 'H'))).toBe('M0 0H10')
    expect(d(convertSegment('M0 0L0 10', 1, 'V'))).toBe('M0 0V10')
    expect(convertSegment('M0 0L10 5', 1, 'H')).toBeNull()
  })

  it('converts Q to C exactly, and C to Q within a tolerance', () => {
    const quad = 'M0 0Q50 100 100 0'
    const cubic = convertSegment(quad, 1, 'C')!
    expect(d(cubic)).toBe('M0 0C33.333 66.667 66.667 66.667 100 0')
    expect(d(convertSegment(cubic, 1, 'Q'))).toBe('M0 0Q50 100 100 0')
    // An S-curve takes more than one quadratic.
    const wave = 'M0 0C30 60 70 -60 100 0'
    const quads = convertSegment(wave, 1, 'Q', { tolerance: 0.25 })!
    expect(quads.length).toBeGreaterThan(2)
    expect(sameShape(wave, d(quads), 0.6)).toBe(true)
  })

  it('splits an arc into cubics, and fits a cubic back to an arc', () => {
    const arc = 'M0 50A50 50 0 0 1 100 50'
    const cubics = convertSegment(arc, 1, 'C')!
    expect(cubics.filter((s) => s[0] === 'C')).toHaveLength(2)
    expect(sameShape(arc, d(cubics))).toBe(true)

    const quarter = 'M0 50A50 50 0 0 1 50 0'
    const curve = convertSegment(quarter, 1, 'C')!
    const back = convertSegment(curve, 1, 'A')!
    expect(back[1]![0]).toBe('A')
    expect(sameShape(quarter, d(back))).toBe(true)
    // A wave isn't an arc.
    expect(convertSegment('M0 0C30 60 70 -60 100 0', 1, 'A')).toBeNull()
  })

  it('reads the sweep and size of a fitted arc', () => {
    const big = convertSegment('M0 0A10 10 0 1 1 0 20', 1, 'C')!
    expect(big.length).toBeGreaterThan(2)
    // Three quarters as one cubic is a poor fit, but a gentle arc fits both ways.
    for (const sweep of [0, 1]) {
      const arc = `M0 0A100 100 0 0 ${sweep} 40 0`
      const fitted = convertSegment(convertSegment(arc, 1, 'C')!, 1, 'A')!
      const [command, rx, , rotation, large, flag] = fitted[1]!
      expect([command, Math.round(rx as number), rotation, large, flag]).toEqual([
        'A',
        100,
        0,
        0,
        sweep,
      ])
      expect(sameShape(arc, d(fitted))).toBe(true)
    }
    expect(
      cubicToArc([
        [0, 0],
        [10, 0],
        [20, 0],
        [30, 0],
      ])
    ).toBeNull()
  })

  it('writes shorthands out, and finds where a full form can be one', () => {
    const smooth = 'M0 0C0 10 10 10 10 0S20 -10 20 0'
    expect(d(convertSegment(smooth, 2, 'C'))).toBe(
      'M0 0C0 10 10 10 10 0C10 -10 20 -10 20 0'
    )
    const full = convertSegment(smooth, 2, 'C')!
    expect(d(convertSegment(full, 2, 'S'))).toBe('M0 0C0 10 10 10 10 0S20 -10 20 0')
    expect(convertSegment('M0 0C0 10 10 10 10 0C5 5 20 -10 20 0', 2, 'S')).toBeNull()
    expect(d(convertSegment('M0 0Q5 10 10 0T20 0', 2, 'Q'))).toBe(
      'M0 0Q5 10 10 0Q15 -10 20 0'
    )
    expect(d(convertSegment('M0 0Q5 10 10 0Q15 -10 20 0', 2, 'T'))).toBe(
      'M0 0Q5 10 10 0T20 0'
    )
  })

  it('pins a following shorthand when its predecessor changes', () => {
    const path = 'M0 0C0 10 10 10 10 0S20 -10 20 0'
    const lined = convertSegment(path, 1, 'L')!
    expect(d(lined)).toBe('M0 0L10 0C10 -10 20 -10 20 0')
  })

  it('refuses moves, closes and missing segments', () => {
    expect(convertSegment('M0 0L1 1Z', 0, 'C')).toBeNull()
    expect(convertSegment('M0 0L1 1Z', 2, 'C')).toBeNull()
    expect(convertSegment('M0 0L1 1', 5, 'C')).toBeNull()
  })
})

describe('absolute and relative', () => {
  it('writes a whole path relative, or absolute, with the same shape', () => {
    const path = 'M10 10L20 10H30V20C30 30 20 30 20 20A5 5 0 0 1 10 20Z'
    const relative = serializePath(setRelative(path))
    expect(relative).toBe('m10 10l10 0h10v10c0 10 -10 10 -10 0a5 5 0 0 1 -10 0z')
    expect(serializePath(absolutize(relative))).toBe(serializePath(absolutize(path)))
    expect(serializePath(setRelative(relative, false))).toBe(
      serializePath(absolutize(path))
    )
  })

  it('toggles one segment, leaving the rest as written', () => {
    expect(serializePath(setSegmentRelative('M10 10L20 10l5 5', 1, true))).toBe(
      'M10 10l10 0l5 5'
    )
    expect(serializePath(setSegmentRelative('M10 10L20 10l5 5', 2, false))).toBe(
      'M10 10L20 10L25 15'
    )
    expect(setSegmentRelative(parsePath('M0 0'), 4, true)).toHaveLength(1)
  })
})

describe('node types', () => {
  it('reads a node’s handles and type', () => {
    const corner = 'M0 0C0 10 10 10 10 0C10 10 20 10 20 0'
    expect(nodeHandles(corner, 1)).toEqual({
      point: [10, 0],
      in: [10, 10],
      out: [10, 10],
    })
    expect(nodeType(corner, 1)).toBe('corner')
    expect(nodeType('M0 0C0 10 5 0 10 0C20 0 20 10 20 20', 1)).toBe('smooth')
    expect(nodeType('M0 0C0 10 5 0 10 0C15 0 20 10 20 20', 1)).toBe('symmetric')
    expect(nodeType('M0 0L10 0L20 10', 1)).toBe('corner')
  })

  it('smooths a corner into a curve, keeping handle lengths', () => {
    const edit = setNodeType('M0 0L10 0L10 10', 1, 'smooth')!
    const path = serializePath(edit.segments)
    expect(nodeType(path, edit.index)).not.toBe('corner')
    const { point, in: into, out } = nodeHandles(path, edit.index)!
    expect(point).toEqual([10, 0])
    expect(Math.hypot(point[0] - into![0], point[1] - into![1])).toBeCloseTo(10 / 3)
    expect(Math.hypot(out![0] - point[0], out![1] - point[1])).toBeCloseTo(10 / 3)
  })

  it('makes handles symmetric, and keeps corners as they are', () => {
    const edit = setNodeType('M0 0C0 10 5 0 10 0C14 4 20 10 20 20', 1, 'symmetric')!
    expect(nodeType(edit.segments, edit.index)).toBe('symmetric')
    const corner = setNodeType('M0 0L10 0L10 10', 1, 'corner')!
    expect(serializePath(corner.segments)).toBe('M0 0L10 0L10 10')
  })

  it('moves the node when an arc before it becomes cubics', () => {
    const edit = setNodeType('M0 50A50 50 0 0 1 100 50L100 100', 1, 'smooth')!
    expect(edit.index).toBe(2)
    expect(nodeHandles(edit.segments, edit.index)!.point).toEqual([100, 50])
  })

  it('needs a segment either side', () => {
    expect(setNodeType('M0 0L10 0', 1, 'smooth')).toBeUndefined()
    expect(setNodeType('M0 0L10 0Z', 1, 'smooth')).toBeUndefined()
  })
})

describe('splitCubic and cubicToQuads', () => {
  it('splits at a point on the curve', () => {
    const c: Cubic = [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ]
    const [a, b] = splitCubic(c)
    expect(a[3]).toEqual(at(c, 0.5))
    expect(b[0]).toEqual(a[3])
    expect(cubicToQuads(c, 100)).toHaveLength(1)
  })
})

describe('freehand', () => {
  const circle = Array.from({ length: 60 }, (_, i): Point => {
    const t = (i / 59) * Math.PI * 1.5
    return [50 + 40 * Math.cos(t), 50 + 40 * Math.sin(t)]
  })

  it('smooths jitter and keeps the ends', () => {
    const jitter: Point[] = [
      [0, 0],
      [1, 3],
      [2, -3],
      [3, 3],
      [4, 0],
    ]
    const smooth = smoothPoints(jitter, 1)
    expect(smooth[0]).toEqual([0, 0])
    expect(smooth.at(-1)).toEqual([4, 0])
    expect(Math.abs(smooth[2]![1])).toBeLessThan(3)
    expect(smoothPoints(jitter, 0)).toEqual(jitter)
  })

  it('fits few cubics within the error', () => {
    const curves = fitCubics(circle, 0.5)
    expect(curves.length).toBeGreaterThan(0)
    expect(curves.length).toBeLessThan(8)
    expect(curves[0]![0]).toEqual(circle[0])
    expect(curves.at(-1)![3]).toEqual(circle.at(-1))
    for (const p of circle) {
      const near = curves.some((c) =>
        Array.from({ length: 50 }, (_, i) => at(c, i / 49)).some(
          (q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1
        )
      )
      expect(near).toBe(true)
    }
    // A straight stroke is one cubic.
    expect(
      fitCubics(
        [
          [0, 0],
          [5, 0],
          [10, 0],
          [15, 0],
        ],
        0.5
      )
    ).toHaveLength(1)
  })

  it('writes a stroke as path data', () => {
    const path = freehandPath(circle, { error: 1, precision: 1 })
    expect(path).toMatch(/^M90 50(C[^C]+)+$/)
    expect(freehandPath([[3, 4]])).toBe('M3 4')
    expect(freehandPath([])).toBe('')
    expect(freehandPath(circle, { closed: true })).toMatch(/Z$/)
  })
})
