import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  absolutize,
  arcCenter,
  bounds,
  clipPath,
  convertElement,
  dashes,
  define,
  drawStroke,
  filter,
  followControl,
  glow,
  gradientControl,
  linearGradient,
  marqueeStroke,
  mask,
  matchPaths,
  morph,
  morphControl,
  morphPath,
  morphSequence,
  node,
  parsePath,
  path,
  pathLength,
  pathToPolygons,
  pathToShape,
  pointAt,
  radialGradient,
  reversePath,
  serializePath,
  sliceIntervals,
  strokeControl,
  strokeKeyframes,
  toCubics,
  toElement,
  toMarkup,
  toPath,
  transformPath,
  tween,
  url,
  type Slice,
} from './index.ts'

const NS = 'http://www.w3.org/2000/svg'
const svg = () => {
  const el = document.createElementNS(NS, 'svg')
  document.body.append(el)
  return el
}
const child = (parent: Element, tag: string, attrs: Record<string, string | number>) => {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  parent.append(el)
  return el as SVGGeometryElement
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('path data', () => {
  it('parses implicit repeats, compact numbers and packed arc flags', () => {
    expect(parsePath('M0 0 10 10')).toEqual([
      ['M', 0, 0],
      ['L', 10, 10],
    ])
    expect(parsePath('m1.5.5-1-2')).toEqual([
      ['m', 1.5, 0.5],
      ['l', -1, -2],
    ])
    expect(parsePath('M0,0a1 1 0 011 1z')).toEqual([
      ['M', 0, 0],
      ['a', 1, 1, 0, 0, 1, 1, 1],
      ['z'],
    ])
    expect(parsePath('M1e2 -2E-1')).toEqual([['M', 100, -0.2]])
  })

  it('rejects data it cannot read, naming the position', () => {
    expect(() => parsePath('M0 0 L x')).toThrow(/at 7/)
    expect(() => parsePath('10 10')).toThrow(SyntaxError)
  })

  it('writes segments back, rounding and never writing -0', () => {
    expect(serializePath([['M', 0.12345, -0.00001], ['L', 1, 2], ['Z']])).toBe(
      'M0.123 0L1 2Z'
    )
  })

  it('absolutizes relative commands, H/V and closing', () => {
    expect(absolutize('M10 10 l5 0 h5 v5 z l1 1')).toEqual([
      ['M', 10, 10],
      ['L', 15, 10],
      ['H', 20],
      ['V', 15],
      ['Z'],
      ['L', 11, 11],
    ])
  })

  it('normalizes every command to cubics, closing lines included', () => {
    const [square] = toCubics('M0 0H10V10H0Z')
    expect(square!.closed).toBe(true)
    expect(square!.curves).toHaveLength(4)
    const [quad] = toCubics('M0 0Q5 10 10 0T20 0')
    expect(quad!.curves).toHaveLength(2)
    // T reflects the control point: the second hump dips below.
    expect(quad!.curves[1]![1][1]).toBeLessThan(0)
  })

  it('finds an arc’s ellipse and turn, scaling radii too small to reach', () => {
    // A half circle from (0,0) to (20,0), clockwise: centred between them.
    const half = arcCenter([0, 0], 10, 10, 0, 0, 1, [20, 0])!
    expect(half.cx).toBeCloseTo(10)
    expect(half.cy).toBeCloseTo(0)
    expect(half.delta).toBeCloseTo(Math.PI)
    // Radius 5 can't span 20: scaled to 10, as browsers draw it.
    expect(arcCenter([0, 0], 5, 5, 0, 0, 1, [20, 0])!.rx).toBeCloseTo(10)
    expect(arcCenter([0, 0], 0, 5, 0, 0, 1, [20, 0])).toBeNull()
  })

  it('turns arcs into cubics that end where the arc does', () => {
    const [arc] = toCubics('M0 0A10 10 0 0 1 20 0')
    const last = arc!.curves[arc!.curves.length - 1]!
    expect(last[3]).toEqual([20, 0])
    expect(arc!.curves).toHaveLength(2)
  })

  it('reverses and transforms paths', () => {
    expect(reversePath('M0 0L10 0')).toBe('M10 0C6.667 0 3.333 0 0 0')
    expect(transformPath('M0 0L10 0', { translate: [5, 5] })).toBe(
      'M5 5C8.333 5 11.667 5 15 5'
    )
    expect(transformPath('M10 0L20 0', { rotate: 90 })).toMatch(/^M0 10C/)
  })
})

describe('measuring', () => {
  it('measures lengths without a DOM', () => {
    expect(pathLength('M0 0H10V10H0Z')).toBeCloseTo(40)
    expect(
      pathLength(toPath({ type: 'circle', r: 10 }), { tolerance: 0.001 })
    ).toBeCloseTo(2 * Math.PI * 10, 1)
  })

  it('finds points along a path, with their direction', () => {
    expect(pointAt('M0 0H100', 25)).toEqual({ x: 25, y: 0, angle: 0 })
    const p = pointAt('M0 0H10V10', 75)
    expect([p.x, p.y, p.angle]).toEqual([10, 5, 90])
    expect(pointAt('M0 0H10', 150).x).toBe(10)
  })

  it('bounds curves', () => {
    const box = bounds(toPath({ type: 'circle', cx: 5, cy: 5, r: 5 }))
    expect(box.x).toBeCloseTo(0, 1)
    expect(box.width).toBeCloseTo(10, 1)
  })
})

describe('shapes', () => {
  it('draws circles from the top, clockwise', () => {
    expect(toPath({ type: 'circle', cx: 10, cy: 10, r: 5 })).toBe(
      'M10 5A5 5 0 0 1 10 15A5 5 0 0 1 10 5Z'
    )
  })

  it('draws rounded rects, polygons, stars and arcs', () => {
    expect(toPath({ type: 'rect', width: 10, height: 4 })).toBe('M0 0H10V4H0Z')
    expect(toPath({ type: 'rect', width: 10, height: 4, rx: 9 })).toContain('A5 2')
    expect(toPath({ type: 'regularPolygon', r: 10, sides: 4 })).toBe(
      'M0 -10L10 0L0 10L-10 0Z'
    )
    expect(toPath({ type: 'star', r: 10, points: 5 }).match(/L/g)).toHaveLength(9)
    expect(toPath({ type: 'arc', r: 10, length: 90 })).toBe('M0 -10A10 10 0 0 1 10 0')
    expect(toPath({ type: 'arc', r: 10, length: 90, close: 'pie' })).toBe(
      'M0 0L0 -10A10 10 0 0 1 10 0Z'
    )
    expect(toPath({ type: 'arc', r: 10, length: -90 })).toBe('M0 -10A10 10 0 0 0 -10 0')
  })

  it('recognizes the simple shape a path draws exactly', () => {
    expect(pathToShape('M0 0H10V4H0Z')).toEqual({
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 4,
    })
    expect(pathToShape('M0 0L5 5')).toEqual({ type: 'line', x1: 0, y1: 0, x2: 5, y2: 5 })
    expect(pathToShape('M0 0L5 5L10 0Z')).toEqual({
      type: 'polygon',
      points: [
        [0, 0],
        [5, 5],
        [10, 0],
      ],
    })
    expect(pathToShape(toPath({ type: 'circle', cx: 3, cy: 4, r: 5 }))).toEqual({
      type: 'circle',
      cx: 3,
      cy: 4,
      r: 5,
    })
    expect(pathToShape(toPath({ type: 'ellipse', rx: 5, ry: 2 }))).toMatchObject({
      type: 'ellipse',
      rx: 5,
      ry: 2,
    })
    expect(pathToShape('M0 0C1 1 2 2 3 3')).toBeUndefined()
  })

  it('approximates curves with polygons', () => {
    const [polygon] = pathToPolygons({ type: 'circle', r: 10 }, { tolerance: 0.5 })
    expect(polygon!.type).toBe('polygon')
    expect(polygon!.points.length).toBeGreaterThan(8)
    for (const [x, y] of polygon!.points) expect(Math.hypot(x, y)).toBeCloseTo(10, 0)
  })

  it('builds paths by chaining commands and shapes', () => {
    expect(path().moveTo(0, 0).lineTo(10, 0).verticalTo(5).close().toString()).toBe(
      'M0 0L10 0V5Z'
    )
    expect(path({ relative: true }).moveTo(1, 1).lineTo(2, 0).toString()).toBe('m1 1l2 0')
    expect(path().circle(0, 0, 1).rect(0, 0, 2, 2).toString()).toBe(
      'M0 -1A1 1 0 0 1 0 1A1 1 0 0 1 0 -1ZM0 0H2V2H0Z'
    )
    expect(toPath(path().moveTo(0, 0).arcTo(5, 5, 0, false, true, 10, 0))).toBe(
      'M0 0A5 5 0 0 1 10 0'
    )
  })
})

describe('morphing', () => {
  const star = { type: 'star', r: 10 } as const
  const circle = { type: 'circle', r: 10 } as const

  it('starts at the source and ends at the target', () => {
    const mixer = morph('M0 0H10V10H0Z', 'M0 0H20V20H0Z', { align: false })
    expect(pathLength(mixer(0))).toBeCloseTo(40)
    expect(pathLength(mixer(1))).toBeCloseTo(80)
    expect(pathLength(mixer(0.5))).toBeCloseTo(60)
  })

  it('matches shapes with different numbers of points', () => {
    const [a, b] = matchPaths(star, circle)
    const shape = (d: string) => d.replace(/-?[\d.]+/g, '#')
    expect(shape(a)).toBe(shape(b))
    // Both are still what they were.
    expect(pathLength(a)).toBeCloseTo(pathLength(toPath(star)), 0)
    expect(bounds(b).width).toBeCloseTo(20, 0)
  })

  it('grows a missing subpath from its partner’s center', () => {
    const mixer = morph('M0 0H10V10H0Z', 'M0 0H10V10H0ZM20 20H30V30H20Z')
    const [, second] = toCubics(mixer(0))
    expect(second!.curves.every((c) => c.every((p) => p[0] === 25 && p[1] === 25))).toBe(
      true
    )
  })

  it('turns a closed target to the start that moves points least', () => {
    // The same square, drawn from another corner: aligned, nothing moves.
    const mixer = morph('M0 0H10V10H0Z', 'M10 10H0V0H10Z')
    expect(mixer(0.5)).toBe(mixer(0))
  })

  it('morphs through a sequence', () => {
    const mixer = morphSequence(['M0 0H1', 'M0 0H2', 'M0 0H4'])
    expect(pathLength(mixer(1.5))).toBeCloseTo(3)
    expect(pathLength(mixer(2))).toBeCloseTo(4)
  })
})

/** Which of `samples` points along the path a set of dashes draws. */
const drawn = (
  { strokeDasharray, strokeDashoffset }: ReturnType<typeof dashes>,
  length = 100
) => {
  const pattern = strokeDasharray.split(' ').map(Number)
  const period = pattern.reduce((s, v) => s + v, 0)
  const offset = Number(strokeDashoffset)
  return (s: number) => {
    let p = ((((s * length) / 100 + offset) % period) + period) % period
    for (let i = 0; i < pattern.length; i++) {
      if (p < pattern[i]! || (p === 0 && pattern[i] === 0))
        return i % 2 === 0 && pattern[i]! > 0
      p -= pattern[i]!
    }
    return false
  }
}

describe('stroke slices', () => {
  const expectDrawn = (
    slice: Slice,
    inside: number[],
    outside: number[],
    length = 100
  ) => {
    const at = drawn(dashes(slice, length), length)
    for (const s of inside) expect(at(s), `${s} drawn`).toBe(true)
    for (const s of outside) expect(at(s), `${s} not drawn`).toBe(false)
  }

  it('draws the slice between start and end', () => {
    expectDrawn({ start: 20, end: 60 }, [21, 40, 59], [0, 19, 61, 99])
    expectDrawn({ start: 60, end: 20 }, [21, 59], [10, 70])
    expectDrawn({ end: 100 }, [0, 50, 99.9], [])
    expectDrawn(
      { start: 20, end: 60 },
      [21 * 3, 59 * 3].map((v) => v / 3),
      [10],
      300
    )
  })

  it('wraps a slice moved past the end', () => {
    expectDrawn({ start: 0, end: 20, offset: 90 }, [91, 99, 1, 9], [11, 50, 89])
  })

  it('repeats a slice evenly for a marquee', () => {
    expect(sliceIntervals({ end: 10, repeat: 4 })).toEqual([
      [0, 10],
      [25, 35],
      [50, 60],
      [75, 85],
    ])
    expectDrawn({ end: 10, repeat: 4, offset: 5 }, [6, 31, 56, 81], [1, 20, 45, 70, 95])
  })

  it('draws nothing for an empty slice, with no dot at either end', () => {
    for (const at of [0, 100]) {
      const d = dashes({ start: at, end: at })
      const pattern = d.strokeDasharray.split(' ').map(Number)
      const period = pattern[0]! + pattern[1]!
      // The zero-length dash sits just off the path: no cap is drawn.
      const position = -Number(d.strokeDashoffset)
      expect(position < 0 || position > 100).toBe(true)
      expect(period).toBeGreaterThan(100)
    }
  })

  it('writes a simple slice as one dash and one gap, so it interpolates', () => {
    expect(dashes({ start: 10, end: 30 })).toEqual({
      strokeDasharray: '20 101',
      strokeDashoffset: '-10',
    })
    const frames = strokeKeyframes({ end: 0 }, { end: 100 })
    expect(frames).toHaveLength(2)
    expect(strokeKeyframes({ end: 10 }, { end: 10, offset: 100 }).length).toBeGreaterThan(
      2
    )
  })

  it('controls an element’s dashes through properties', () => {
    const el = child(svg(), 'path', { d: 'M0 0H200' })
    const stroke = strokeControl(el, { end: 0 })
    expect(stroke.length).toBe(200)
    stroke.end = 50
    expect(el.style.strokeDasharray).toBe('100 201')
    stroke.set({ start: 25, end: 75 })
    expect(el.style.strokeDashoffset).toBe('-50')
    stroke.clear()
    expect(el.style.strokeDasharray).toBe('')
  })

  it('uses a declared pathLength rather than measuring', () => {
    const el = child(svg(), 'circle', { r: 10, pathLength: 100 })
    expect(strokeControl(el).length).toBe(100)
    expect(strokeControl(child(svg(), 'circle', { r: 10 })).length).toBeCloseTo(62.8, 0)
  })
})

describe('animation helpers', () => {
  const frames = () => {
    const callbacks: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      callbacks.push(cb)
    )
    vi.stubGlobal('cancelAnimationFrame', () => {})
    return (time: number) => callbacks.splice(0).forEach((cb) => cb(time))
  }

  it('tweens with eases, repeats and yoyo, then resolves', async () => {
    const step = frames()
    const seen: number[] = []
    const done = vi.fn()
    const t = tween((p) => seen.push(p), {
      duration: 1,
      ease: 'linear',
      repeat: 1,
      yoyo: true,
      onComplete: done,
    })
    step(0)
    step(500)
    step(1500)
    step(2100)
    await t
    expect(seen).toEqual([0, 0, 0.5, 0.5, 0])
    expect(done).toHaveBeenCalledOnce()
  })

  it('repeats forever with repeat -1', () => {
    const step = frames()
    const seen: number[] = []
    const done = vi.fn()
    tween((p) => seen.push(p), {
      duration: 1,
      ease: 'linear',
      repeat: -1,
      onComplete: done,
    })
    step(0)
    step(500)
    step(10_500)
    expect(seen).toEqual([0, 0, 0.5, 0.5])
    expect(done).not.toHaveBeenCalled()
  })

  it('skips to the end under reduced motion', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const seen: number[] = []
    await tween((p) => seen.push(p), { duration: 1 })
    expect(seen).toEqual([1])
  })

  it('stops when cancelled', () => {
    const step = frames()
    const seen: number[] = []
    const t = tween((p) => seen.push(p), { duration: 1, ease: 'linear' })
    t.cancel()
    step(0)
    step(500)
    expect(seen).toEqual([0])
  })

  it('draws, runs and morphs elements', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const root = svg()
    const line = child(root, 'path', { d: 'M0 0H100' })
    await drawStroke(line, { end: 0 }, { end: 100 })
    expect(line.style.strokeDasharray).toBe('100 101')

    const shape = child(root, 'path', { d: 'M0 0H10V10H0Z' })
    await morphPath(shape, { type: 'circle', r: 5 })
    expect(shape.getAttribute('d')).toBe(toPath({ type: 'circle', r: 5 }))

    const ring = child(root, 'circle', { r: 10, pathLength: 100 })
    marqueeStroke(ring, { count: 2, size: 10 }).cancel()
    expect(ring.style.strokeDasharray).toBe('10 40 10 101')
  })

  it('exposes morphs and motion along a path as properties', () => {
    const root = svg()
    const el = child(root, 'path', {})
    const control = morphControl(el, 'M0 0H10', 'M0 0H20')
    control.progress = 0.5
    expect(pathLength(el.getAttribute('d')!)).toBeCloseTo(15)

    const dot = child(root, 'circle', { r: 2 })
    const follow = followControl(dot, 'M0 0H10V10', { rotate: true })
    follow.progress = 75
    expect(dot.getAttribute('transform')).toBe('translate(10 5) rotate(90)')
  })
})

describe('definitions', () => {
  it('builds gradients by angle or points', () => {
    expect(toMarkup(linearGradient({ id: 'g', angle: 90, stops: ['red', 'blue'] }))).toBe(
      '<linearGradient id="g" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="red"/><stop offset="100%" stop-color="blue"/></linearGradient>'
    )
    const radial = radialGradient({
      id: 'r',
      fx: '30%',
      stops: [
        { color: 'white', opacity: 0.5 },
        { color: 'black', offset: 80 },
      ],
    })
    expect(toMarkup(radial)).toContain('fx="30%"')
    expect(toMarkup(radial)).toContain('stop-opacity="0.5"')
    expect(toMarkup(radial)).toContain('offset="80%"')
  })

  it('turns and recolors a gradient through properties', () => {
    const [el] = define(
      svg(),
      linearGradient({ id: 'g', angle: 180, stops: ['red', 'blue'] })
    )
    const control = gradientControl(el!)
    expect(control.angle).toBe(180)
    control.angle = 90
    expect(el!.getAttribute('x2')).toBe('1')
    control.stops[1]!.color = 'green'
    control.stops[1]!.offset = 50
    expect(el!.querySelector('stop:last-child')!.getAttribute('stop-color')).toBe('green')
    expect(control.stops[1]!.offset).toBe(50)
  })

  it('builds filters from primitives and presets', () => {
    const markup = toMarkup(
      filter({ id: 'f', x: '-50%', effects: glow({ color: 'gold' }) })
    )
    expect(markup).toMatch(/^<filter id="f" x="-50%">/)
    expect(markup).toContain(
      '<feFlood flood-color="gold" flood-opacity="1" result="glow-color"/>'
    )
    expect(markup).toContain('<feMergeNode in="glow-blur"/>')
  })

  it('builds clip paths and masks from shapes', () => {
    expect(
      toMarkup(clipPath({ id: 'c', content: [{ type: 'rect', width: 1, height: 1 }] }))
    ).toBe('<clipPath id="c"><path d="M0 0H1V1H0Z"/></clipPath>')
    expect(toMarkup(mask({ id: 'm', content: ['M0 0H1'] }))).toContain('fill="white"')
    expect(url('m')).toBe('url(#m)')
  })

  it('escapes attribute values in markup', () => {
    expect(toMarkup(node('text', { 'data-x': '"<&' }))).toBe(
      '<text data-x="&quot;&lt;&amp;"/>'
    )
  })

  it('defines into <defs>, replacing by id', () => {
    const root = svg()
    define(root, node('linearGradient', { id: 'a', x1: 0 }))
    define(root, node('linearGradient', { id: 'a', x1: 1 }))
    expect(root.querySelectorAll('defs > #a')).toHaveLength(1)
    expect(root.querySelector('#a')!.getAttribute('x1')).toBe('1')
    expect(toElement(node('g')).namespaceURI).toBe(NS)
  })
})

describe('converting elements', () => {
  it('swaps shapes for paths and back, keeping other attributes', () => {
    const root = svg()
    const circle = child(root, 'circle', {
      cx: 5,
      cy: 5,
      r: 5,
      fill: 'red',
      class: 'dot',
    })
    const asPath = convertElement(circle, 'path')
    expect(asPath.localName).toBe('path')
    expect(asPath.getAttribute('fill')).toBe('red')
    expect(asPath.hasAttribute('r')).toBe(false)
    const back = convertElement(asPath, 'shape')
    expect(back.localName).toBe('circle')
    expect(back.getAttribute('r')).toBe('5')
    expect(back.getAttribute('class')).toBe('dot')
  })

  it('approximates curves as polygons only when asked', () => {
    const root = svg()
    const curve = child(root, 'path', { d: 'M0 0Q5 10 10 0Z' })
    expect(convertElement(curve, 'shape')).toBe(curve)
    expect(convertElement(curve, 'shape', { approximate: true }).localName).toBe(
      'polygon'
    )
  })
})
