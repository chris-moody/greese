import { describe, expect, it } from 'vitest'
import {
  bevel,
  dogEar,
  mirrored,
  notch,
  opensToBox,
  rectangle,
  SHAPE_PRESETS,
  shapeCss,
  shapesCss,
  SHAPE_TARGETS,
  shapeParams,
  shapePoints,
  shapeProperties,
  shield,
  slant,
  tag,
  ticket,
  zigzag,
} from './shapes.ts'

const close = (a: number[][], b: number[][]) =>
  a.forEach((p, i) => p.forEach((v, j) => expect(v).toBeCloseTo(b[i]![j]!, 3)))

describe('shapes', () => {
  it('keep pixel corners whatever the size', () => {
    close(shapePoints(bevel(12), 200, 40), [
      [12, 0],
      [200, 0],
      [200, 0],
      [200, 28],
      [188, 40],
      [0, 40],
      [0, 40],
      [0, 12],
    ])
    close(shapePoints(bevel(12), 40, 40).slice(0, 1), [[12, 0]])
  })

  it('offset the border exactly along a 45° cut', () => {
    // A 1px border inside a 12px bevel: the inner cut sits 1px from the outer one.
    const [outer, inner] = [
      shapePoints(bevel(12), 200, 80),
      shapePoints(bevel(12), 200, 80, undefined, 1),
    ]
    const distance = (p: number[]) => (p[0]! + p[1]! - 12) / Math.SQRT2
    expect(distance(outer[0]!)).toBeCloseTo(0, 6)
    expect(distance(inner[0]!)).toBeCloseTo(1, 6)
    expect(distance(inner[7]!)).toBeCloseTo(1, 6)
    // Straight edges move straight in.
    expect(inner[0]![1]).toBeCloseTo(1, 6)
    expect(inner[7]![0]).toBeCloseTo(1, 6)
  })

  it('have the same points in every state, so they interpolate', () => {
    for (const make of Object.values(SHAPE_PRESETS)) {
      const def = make()
      const zero = Object.fromEntries(shapeParams(def).map((k) => [k, 0]))
      expect(shapePoints(def, 100, 50, zero)).toHaveLength(
        shapePoints(def, 100, 50).length
      )
    }
  })

  it('know which open to their box, for a box focus ring', () => {
    for (const def of [
      rectangle(),
      bevel(),
      notch(),
      tag(),
      slant(),
      dogEar(),
      ticket(),
      zigzag(),
    ])
      expect(opensToBox(def)).toBe(true)
    // The shield's point is in percentages: it never becomes its box.
    expect(opensToBox(shield())).toBe(false)
  })

  it('flatten a rounded corner into an arc of the given radius', () => {
    const pts = shapePoints(shield(), 100, 100)
    // The first corner's arc ends 10px along each edge from (0, 0).
    expect(pts[0]![0]).toBeCloseTo(0, 6)
    expect(pts[0]![1]).toBeCloseTo(10, 6)
    expect(pts[6]![0]).toBeCloseTo(10, 6)
    expect(pts[6]![1]).toBeCloseTo(0, 6)
    // Its middle is on the circle of radius 10 round (10, 10).
    expect(Math.hypot(pts[3]![0] - 10, pts[3]![1] - 10)).toBeCloseTo(10, 6)
  })

  it('compile to one clip and one ring, driven by registered parameters', () => {
    const css = shapeCss(
      { ...bevel(12), hover: { a: 0, b: 12 } },
      {
        selector: '.x',
        transitions: ['color 1s ease'],
      }
    )
    // The element clips itself, and its border layer, to geometry computed on the element.
    expect(css).toMatch(/\.x \{[^}]*clip-path: var\(--greese-shape-clip\) padding-box;/)
    expect(css).toMatch(/\.x::after \{[^}]*clip-path: var\(--greese-shape-ring-clip\);/)
    expect(css).toMatch(
      /\.x \{\n {2}--greese-shape-a: 12px;\n {2}--greese-shape-b: 0px;\n {2}--greese-shape-border: 1px;\n {2}--greese-shape-clip: polygon\(calc\(var\(--greese-shape-a\) /
    )
    expect(css).toMatch(/--greese-shape-ring-clip: polygon\(evenodd, /)
    // Animated by their parameters, never by clip-path, after the element's own transitions.
    expect(css).toMatch(/transition: color 1s ease,\n {6}--greese-shape-a var/)
    expect(css).not.toMatch(/transition:[^;]*clip-path/)
    expect(css).toMatch(
      /@media \(hover: hover\) \{\n {2}\.x:hover \{\n {4}--greese-shape-a: 0px;/
    )
    // No entrance of its own: a shape's clip never moves while an element appears.
    expect(css).not.toMatch(/@starting-style/)
    // Focus opens the shape to its box; the bleed waits until it has.
    expect(css).toMatch(
      /\.x:focus-visible \{[^}]*--greese-shape-bleed: 8px;[^}]*transition-delay: 0s, [^}]*var\(--greese-duration-normal\);/
    )
    expect(css).toMatch(/@media \(forced-colors: active\)/)
    expect(shapeProperties(['a', 'b'])).toMatch(
      /@property --greese-shape-a \{\n {2}syntax: '<length>';\n {2}inherits: false;/
    )
  })

  it('write a shape once, however many elements take it', () => {
    const css = shapesCss({ cut: bevel() }, [
      { shape: 'cut', selector: '.greese-shape-cut' },
      { shape: 'cut', selector: '.greese-Button', ...SHAPE_TARGETS.Button },
    ])
    expect(css.match(/--greese-shape-clip: polygon/g)).toHaveLength(1)
    expect(css).toMatch(/\.greese-shape-cut,\n\.greese-Button \{\n {2}--greese-shape-a/)
    // Buttons keep 44px touch targets; their transitions are restated.
    expect(css).toMatch(
      /@media \(pointer: coarse\) \{\n {2}\.greese-Button \{\n {4}min-block-size: 44px;/
    )
    expect(css).toMatch(/\.greese-Button \{[^}]*transition: background-color/)
  })

  it('show focus as a ring when the shape never becomes its box', () => {
    expect(shapeCss(shield(), { selector: '.s' })).toMatch(
      /\.s:focus-visible \{\n {2}--greese-shape-border: 3px;\n {2}--greese-shape-ring: var\(--greese-color-focus-ring\);/
    )
  })

  it("leave a still element's transitions alone", () => {
    const css = shapeCss({ ...bevel(), hover: { a: 0 } }, { selector: '.d', still: true })
    expect(css).not.toMatch(/transition/)
    expect(css).not.toMatch(/:hover/)
  })
})

describe('mirrored shapes', () => {
  it('point the other way for right-to-left text, still clockwise', () => {
    const [w, h] = [100, 40]
    const ltr = shapePoints(tag(12), w, h)
    const rtl = shapePoints(mirrored(tag(12)), w, h)
    // The point moves from the end (x = 100) to the start (x = 0).
    expect(ltr.find(([x]) => x === 100)?.[1]).toBe(20)
    expect(rtl.find(([x]) => x === 0)?.[1]).toBe(20)
    expect(shapeCss(tag(), { selector: '.t' })).toMatch(
      /\.t:dir\(rtl\) \{\n {2}--greese-shape-clip: polygon\(/
    )
  })

  it('point the other way where the element faces it, and back in right-to-left text', () => {
    const css = shapeCss(tag(), { selector: '.b', mirrorOn: '.end &', ring: false })
    // The clip a rule (by its exact selector list) gives.
    const clipOf = (selectors: string) =>
      `\n${css}`
        .split(`\n${selectors} {\n`)
        .slice(1)
        .map(
          (rest) =>
            rest.slice(0, rest.indexOf('}')).match(/--greese-shape-clip: ([^;]+);/)?.[1]
        )
        .find(Boolean)
    const drawn = clipOf('.b')
    const flipped = clipOf('.b:dir(rtl),\n.end .b')
    expect(drawn).toMatch(/^polygon\(/)
    expect(flipped).toMatch(/^polygon\(/)
    expect(flipped).not.toBe(drawn)
    expect(clipOf('.end .b:dir(rtl)')).toBe(drawn)
  })
})

describe('shape targets', () => {
  it('only clip an element with no border to draw', () => {
    const css = shapeCss(bevel(), { selector: '.dot', ring: false })
    expect(css).toMatch(
      /\.dot \{\n {2}clip-path: var\(--greese-shape-clip\) border-box;\n\}/
    )
    expect(css).not.toMatch(/\.dot::after/)
  })

  it('give smaller variants smaller features, in every state', () => {
    const css = shapeCss(
      { ...bevel(10), hover: { a: 0, b: 10 } },
      {
        selector: '.b',
        scale: { '&.b--small': 0.5 },
      }
    )
    expect(css).toMatch(
      /\.b\.b--small \{\n {2}--greese-shape-a: 5px;\n {2}--greese-shape-b: 0px;\n\}/
    )
    expect(css).toMatch(
      /\.b\.b--small:hover \{\n {4}--greese-shape-a: 0px;\n {4}--greese-shape-b: 5px;/
    )
  })

  it('read a suffix with & anywhere in it as a selector of its own', () => {
    const css = shapeCss(bevel(), {
      selector: '.slot',
      variants: { '.group[data-invalid] &': { '--greese-shape-ring': 'red' } },
    })
    expect(css).toMatch(
      /\.group\[data-invalid\] \.slot \{\n {2}--greese-shape-ring: red;/
    )
  })

  it('show focus the way the element needs', () => {
    const field = shapeCss(bevel(), {
      selector: '.f',
      focus: 'ring',
      focusOn: ':has(:focus-visible)',
    })
    expect(field).toMatch(
      /\.f:has\(:focus-visible\) \{\n {2}--greese-shape-border: 3px;[^}]*outline-color: transparent;/
    )
    const tab = shapeCss(bevel(), { selector: '.t', ring: false, focus: 'keep' })
    expect(tab).not.toMatch(/focus-visible/)
  })
})

describe('the border ring', () => {
  it('closes along its seam, never across the border', () => {
    const ring = /--greese-shape-ring-clip: polygon\(evenodd, ([^;]*)\);/.exec(
      shapeCss(bevel(), { selector: '.r' })
    )![1]!
    const points = ring.split(/, (?![^(]*\))/)
    // Outline first point, …, outline first point, inner first point, …, inner first point:
    // the implicit closing edge runs from the inner first point back up the seam.
    expect(points.at(-1)).toBe(points[points.length / 2])
    expect(points[points.length / 2 - 1]).toBe(points[0])
  })
})
