/**
 * Shapes (ADR 0024): custom outlines for any element, as plain CSS.
 *
 * A shape is a list of points in the element's box. Each coordinate is a
 * percentage of the box plus pixels plus multiples of named parameters, so a
 * 12px corner stays 12px whatever the element's size. It compiles to:
 *
 * - **one geometry**: a `polygon()` clip on the element, and a ring (its
 *   border) on the element's own pseudo-element, computed from the same points;
 * - **animated parameters**: each parameter is a registered custom property
 *   (`--greese-shape-<param>`). Hover, press, focus and entrance change the
 *   parameters, never `clip-path`, so the clip and its border interpolate
 *   together by construction, and transforms (the `greese` prop) move both;
 * - **no runtime**: nothing in the browser, and no extra markup.
 *
 * This module only builds CSS: the Studio and build scripts import it, apps
 * don't (it isn't in the package's main entry).
 */

/** One coordinate: `pct`% of the box, plus `px`, plus `k` times parameter `param`. */
export interface ShapeLength {
  pct?: number
  px?: number
  param?: string
  /** How many of `param` (negative to subtract). @default 1 */
  k?: number
}

export interface ShapePoint {
  x: ShapeLength
  y: ShapeLength
  /**
   * Rounds this corner: a radius in px, or a parameter's name. The arc is
   * flattened into points at build time, so it animates like any other.
   */
  round?: number | string
}

/** Parameter values: name → px. */
export type ShapeParams = Record<string, number>

export interface ShapeDef {
  /** The outline, clockwise from the top start. */
  points: ShapePoint[]
  /** Parameters at rest, in px. */
  params?: ShapeParams
  /** Parameters while hovered (fine pointers only). */
  hover?: ShapeParams
  /** Parameters while pressed. */
  active?: ShapeParams
  /** The border drawn along the shape. Width in px; color any CSS color, `auto` for the component's own. */
  border?: { width?: number; color?: string }
  /**
   * How keyboard focus shows. `box`: the shape eases back to its box and the
   * usual focus ring draws round it (needs every parameter at 0 to be the
   * box). `ring`: a thicker border in the focus color, inside the shape.
   * @default 'box' when possible, else 'ring'
   */
  focus?: 'box' | 'ring'
  /** Mirror it for right-to-left text: for shapes with a direction, like a tag's point. */
  mirror?: boolean
}

/** How a shape fits a particular element: which pseudo-element draws its border, and so on. */
export interface ShapeTarget {
  /** The element's selector. */
  selector: string
  /** In SHAPE_TARGETS: the element a component's shape goes on, when not its root (`.greese-SpeedDial-trigger`). */
  select?: string
  /** The pseudo-element free for the border. @default '::after' */
  pseudo?: '::before' | '::after'
  /** Selector suffix for hover (`:hover`), or a selector of its own (`&--interactive:hover`). */
  hover?: string | false
  /** Selector suffix for press. */
  active?: string | false
  /** The element is already positioned (fixed, sticky, absolute): don't make it relative. */
  positioned?: boolean
  /** The border color when the shape's is `auto`: the component's own border color. */
  borderColor?: string
  /** Extra rules for variants, e.g. a different border color per modifier: selector → declarations. */
  variants?: Record<string, Record<string, string>>
  /** The element's own transitions, restated (a `transition` replaces the whole list). */
  transitions?: string[]
  /**
   * Transitions only some of its variants have (selector suffix → list), so
   * the restated list doesn't give every element one: a moving property that
   * transitions lags whatever animates it, a mask included.
   */
  variantTransitions?: Record<string, string[]>
  /** Don't animate parameters (the element's transitions are its own, e.g. a dialog's). */
  still?: boolean
  /** Interactive: at least 44px on touch screens, since the shape clips the hit area too. */
  touch?: boolean
  /**
   * Draw a border along the shape (a pseudo-element). Off for elements with
   * no border, no pseudo-element to spare, or that scroll their own content
   * (the layer would scroll with it): the element is only clipped.
   * @default true
   */
  ring?: boolean
  /**
   * How focus shows, over the shape's own choice: `ring` (a focus-colored
   * ring inside the shape, for elements that stay focused while used, like
   * fields), or `keep` (the element's own focus style, drawn inside the box,
   * already survives the clip).
   */
  focus?: 'ring' | 'keep'
  /** Selector suffix for focus. @default ':focus-visible' */
  focusOn?: string
  /**
   * Smaller elements, smaller features: selector suffix → a factor for every
   * parameter, so a cut that suits a button doesn't swallow an icon button.
   */
  scale?: Record<string, number>
}

const BORDER = '__border'
const BLEED = '__bleed'
/** How far the clip opens past the box for a `box` focus ring: outline offset 2px + width 2px + 1px border + spare. */
const BLEED_PX = 8
const FOCUS_RING_PX = 3

/** The custom property behind a parameter. */
export const shapeVar = (param: string): string =>
  param === BORDER
    ? '--greese-shape-border'
    : param === BLEED
      ? '--greese-shape-bleed'
      : `--greese-shape-${param}`

/** A linear expression: pct% + px + Σ k·param. */
interface Lin {
  pct: number
  px: number
  terms: Map<string, number>
}

const lin = (l: ShapeLength): Lin => ({
  pct: l.pct ?? 0,
  px: l.px ?? 0,
  terms: new Map(l.param ? [[l.param, l.k ?? 1]] : []),
})

const addTerm = (a: Lin, param: string, k: number): Lin => {
  const terms = new Map(a.terms)
  terms.set(param, (terms.get(param) ?? 0) + k)
  return { ...a, terms }
}

const addLin = (a: Lin, b: { px?: number; param?: string; k: number }): Lin =>
  b.param ? addTerm(a, b.param, b.k) : { ...a, px: a.px + (b.px ?? 0) * b.k }

const num = (n: number) => {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}

/** A Lin as CSS: `12px`, `100%`, or a `calc()`. */
const css = (a: Lin): string => {
  // Signed terms, so `- var(…)` reads as it should.
  const terms: Array<[sign: 1 | -1, text: string]> = []
  if (a.pct) terms.push([a.pct < 0 ? -1 : 1, `${num(Math.abs(a.pct))}%`])
  if (a.px) terms.push([a.px < 0 ? -1 : 1, `${num(Math.abs(a.px))}px`])
  for (const [param, k] of a.terms) {
    if (Math.abs(k) < 1e-9) continue
    const size = Math.abs(k)
    const v = `var(${shapeVar(param)})`
    terms.push([k < 0 ? -1 : 1, Math.abs(size - 1) < 1e-9 ? v : `${num(size)} * ${v}`])
  }
  if (!terms.length) return '0'
  if (terms.length === 1 && terms[0]![0] === 1 && !terms[0]![1].includes('var('))
    return terms[0]![1]
  const [first, ...rest] = terms
  const head = first![0] < 0 ? `-1 * ${first![1]}` : first![1]
  return `calc(${[head, ...rest.map(([sign, t]) => `${sign < 0 ? '-' : '+'} ${t}`)].join(' ')})`
}

const evaluate = (a: Lin, size: number, params: ShapeParams): number => {
  let v = (a.pct / 100) * size + a.px
  for (const [param, k] of a.terms) v += k * (params[param] ?? 0)
  return v
}

interface SymPoint {
  x: Lin
  y: Lin
}

/** Where geometry is measured, to fix directions and offsets: a box of this size. */
const REF = { w: 320, h: 180 }

/** Every parameter at the largest value any state gives it, so no edge collapses. */
const largest = (def: ShapeDef): ShapeParams => {
  const out: ShapeParams = {}
  for (const set of [def.params, def.hover, def.active])
    for (const [k, v] of Object.entries(set ?? {}))
      out[k] = Math.max(out[k] ?? 0, Math.abs(v))
  return out
}

type Vec = [number, number]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
const len = (a: Vec) => Math.hypot(a[0], a[1])
const unit = (a: Vec): Vec => {
  const l = len(a)
  return l < 1e-9 ? [0, 0] : [a[0] / l, a[1] / l]
}

const at = (p: SymPoint, params: ShapeParams, w = REF.w, h = REF.h): Vec => [
  evaluate(p.x, w, params),
  evaluate(p.y, h, params),
]

/** The nearest point before (`step` -1) or after (+1) `i` that isn't at the same place. */
const distinct = (pts: Vec[], i: number, step: 1 | -1): Vec => {
  const n = pts.length
  for (let j = 1; j < n; j++) {
    const q = pts[(i + step * j + n * n) % n]!
    if (len(sub(q, pts[i]!)) > 1e-6) return q
  }
  return pts[i]!
}

/** Flattens each rounded corner into an arc of points, exact while its edges keep their directions. */
const expand = (def: ShapeDef): SymPoint[] => {
  const base = def.points.map((p) => ({ x: lin(p.x), y: lin(p.y) }))
  const big = largest(def)
  const ref = base.map((p) => at(p, big))
  const out: SymPoint[] = []
  def.points.forEach((p, i) => {
    const v = base[i]!
    if (p.round === undefined || p.round === 0) return out.push(v)
    const u1 = unit(sub(distinct(ref, i, -1), ref[i]!))
    const u2 = unit(sub(distinct(ref, i, 1), ref[i]!))
    const cos = u1[0] * u2[0] + u1[1] * u2[1]
    const theta = Math.acos(Math.max(-1, Math.min(1, cos)))
    if (theta < 1e-3 || Math.PI - theta < 1e-3) return out.push(v)
    // Per unit of radius: the tangent points, and the arc's center, from the vertex.
    const t = 1 / Math.tan(theta / 2)
    const bis = unit([u1[0] + u2[0], u1[1] + u2[1]])
    const c: Vec = [bis[0] / Math.sin(theta / 2), bis[1] / Math.sin(theta / 2)]
    const a1 = Math.atan2(u1[1] * t - c[1], u1[0] * t - c[0])
    let a2 = Math.atan2(u2[1] * t - c[1], u2[0] * t - c[0])
    // The short way round.
    while (a2 - a1 > Math.PI) a2 -= 2 * Math.PI
    while (a1 - a2 > Math.PI) a2 += 2 * Math.PI
    const r =
      typeof p.round === 'string' ? { param: p.round, k: 1 } : { px: p.round, k: 1 }
    const steps = 6
    for (let s = 0; s <= steps; s++) {
      const ang = a1 + ((a2 - a1) * s) / steps
      const dx = c[0] + Math.cos(ang)
      const dy = c[1] + Math.sin(ang)
      out.push({
        x: addLin(v.x, { ...r, k: dx }),
        y: addLin(v.y, { ...r, k: dy }),
      })
    }
  })
  return out
}

/**
 * Per point, how far it moves for 1px of inset, measured where every edge
 * has its full length: the miter of the two edges' inward normals.
 */
const miters = (pts: SymPoint[], def: ShapeDef): Vec[] => {
  const ref = pts.map((p) => at(p, largest(def)))
  let area = 0
  ref.forEach((p, i) => {
    const q = ref[(i + 1) % ref.length]!
    area += p[0] * q[1] - q[0] * p[1]
  })
  // Clockwise on screen (y down) has a positive sum; anticlockwise flips the normals.
  const turn = area >= 0 ? 1 : -1
  return ref.map((p, i) => {
    const e1 = unit(sub(p, distinct(ref, i, -1)))
    const e2 = unit(sub(distinct(ref, i, 1), p))
    const n1: Vec = [-e1[1] * turn, e1[0] * turn]
    const n2: Vec = [-e2[1] * turn, e2[0] * turn]
    const d = 1 + n1[0] * n2[0] + n1[1] * n2[1]
    if (d < 0.25) {
      // A spike: cap the miter instead of letting it run off.
      const b = unit([n1[0] + n2[0], n1[1] + n2[1]])
      return [b[0] * 2, b[1] * 2]
    }
    return [(n1[0] + n2[0]) / d, (n1[1] + n2[1]) / d]
  })
}

const polygon = (pts: SymPoint[], fill?: 'evenodd') =>
  `polygon(${fill ? `${fill}, ` : ''}${pts.map((p) => `${css(p.x)} ${css(p.y)}`).join(', ')})`

/** The parameters a shape uses, in a stable order. */
export const shapeParams = (def: ShapeDef): string[] => {
  const names = new Set<string>()
  for (const p of def.points) {
    if (p.x.param) names.add(p.x.param)
    if (p.y.param) names.add(p.y.param)
    if (typeof p.round === 'string') names.add(p.round)
  }
  for (const set of [def.params, def.hover, def.active])
    for (const k of Object.keys(set ?? {})) names.add(k)
  return [...names].sort()
}

/** True when the shape with every parameter at 0 is its whole box, so `box` focus works. */
export const opensToBox = (def: ShapeDef): boolean => {
  const zero = Object.fromEntries(shapeParams(def).map((k) => [k, 0]))
  const pts = expand(def).map((p) => at(p, zero))
  let area = 0
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]!
    area += p[0] * q[1] - q[0] * p[1]
  })
  const inside = pts.every(
    ([x, y]) => x > -0.01 && y > -0.01 && x < REF.w + 0.01 && y < REF.h + 0.01
  )
  return inside && Math.abs(Math.abs(area / 2) - REF.w * REF.h) < 0.5
}

/**
 * The outline at one size, as numbers: for editors and previews. `inset`
 * gives the border's inner edge instead.
 */
export const shapePoints = (
  def: ShapeDef,
  w: number,
  h: number,
  params: ShapeParams = def.params ?? {},
  inset = 0
): Array<[number, number]> => {
  const pts = expand(def)
  const m = miters(pts, def)
  return pts.map((p, i) => {
    const [x, y] = at(p, params, w, h)
    return [x + m[i]![0] * inset, y + m[i]![1] * inset]
  })
}

/** `@property` rules for the parameters: registered, so they animate. Once per page is enough. */
export const shapeProperties = (params: Iterable<string>): string =>
  [...new Set([...params, BORDER, BLEED])]
    .sort()
    .map(
      (p) =>
        `@property ${shapeVar(p)} {\n  syntax: '<length>';\n  inherits: false;\n  initial-value: 0px;\n}`
    )
    .join('\n') +
  // The ring's color is read by the element's own border layer, so it
  // inherits; every shaped element sets its own, so nesting can't leak.
  `\n@property --greese-shape-ring {\n  syntax: '<color>';\n  inherits: true;\n  initial-value: transparent;\n}`

const decls = (d: Record<string, string>, indent = '  ') =>
  Object.entries(d)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join('\n')

const rule = (selector: string, d: Record<string, string>) =>
  Object.keys(d).length ? `${selector} {\n${decls(d)}\n}` : ''

const paramDecls = (set: ShapeParams | undefined) =>
  Object.fromEntries(
    Object.entries(set ?? {}).map(([k, v]) => [shapeVar(k), `${num(v)}px`])
  )

/** The shape flipped start to end, still clockwise. */
export const mirrored = (def: ShapeDef): ShapeDef => {
  const flip = (l: ShapeLength): ShapeLength => ({
    pct: 100 - (l.pct ?? 0),
    px: -(l.px ?? 0),
    ...(l.param && { param: l.param, k: -(l.k ?? 1) }),
  })
  const points = def.points.map((p) => ({ ...p, x: flip(p.x) })).reverse()
  return { ...def, points }
}

/** The clip and the ring of a shape, as `clip-path` values. */
const clips = (def: ShapeDef) => {
  const pts = expand(def)
  const m = miters(pts, def)
  // The clip, opened past the box by the bleed (0 except for a box focus ring).
  const outer = pts.map((p, i) => ({
    x: addTerm(p.x, BLEED, -m[i]![0]),
    y: addTerm(p.y, BLEED, -m[i]![1]),
  }))
  // The ring: the outline, then down a seam to the inner edge, round it
  // backwards and back to the seam, so the polygon closes along the seam
  // (which evenodd cancels). Ending anywhere else would close with a line
  // across the border, cutting a sliver out of it.
  const inner = pts.map((p, i) => ({
    x: addTerm(p.x, BORDER, m[i]![0]),
    y: addTerm(p.y, BORDER, m[i]![1]),
  }))
  const ring = [...pts, pts[0]!, inner[0]!, ...inner.slice(1).reverse(), inner[0]!]
  return { outer: polygon(outer), ring: polygon(ring, 'evenodd') }
}

const join = (selector: string, suffix: string) =>
  suffix.startsWith('&') ? suffix.replace(/&/g, selector) : `${selector}${suffix}`

const block = (head: string, body: string) =>
  body.trim()
    ? `${head} {\n${body
        .split('\n')
        .map((l) => (l ? `  ${l}` : l))
        .join('\n')}\n}`
    : ''

/** Where a shape is used: an element's selector and how it takes the shape. */
export interface ShapeUse extends ShapeTarget {
  /** The shape's name. */
  shape: string
}

const TIMING = 'var(--greese-duration-normal) var(--greese-easing-standard)'

/**
 * The CSS for a set of shapes and the elements that take them. Each shape's
 * geometry is written once, on every element that takes it, as two custom
 * properties computed on the element itself (`--greese-shape-clip` and
 * `--greese-shape-ring-clip`), so its border layer inherits the ring already
 * resolved with the element's parameters, mid-transition included. The
 * mechanics (the clip, the border layer, transitions) are written once per
 * kind of element. Pair it with `shapeProperties()` once.
 */
export const shapesCss = (shapes: Record<string, ShapeDef>, uses: ShapeUse[]): string => {
  const live = uses.filter((u) => shapes[u.shape])
  if (!live.length) return ''
  const out: string[] = []

  // Mechanics, grouped by element kinds that share them.
  const transitionsOf = (u: ShapeUse) => {
    const params = shapeParams(shapes[u.shape]!)
    return [
      ...(u.transitions ?? []),
      ...[...params.map(shapeVar), shapeVar(BORDER), '--greese-shape-ring'].map(
        (p) => `${p} ${TIMING}`
      ),
      `${shapeVar(BLEED)} 0s linear`,
    ]
  }
  const groups = new Map<string, { uses: ShapeUse[]; transitions: string[] }>()
  for (const u of live) {
    const transitions = u.still ? [] : transitionsOf(u)
    const how = [
      u.pseudo,
      u.positioned,
      u.borderColor,
      u.variants,
      u.variantTransitions,
      u.touch,
      u.still,
      u.ring,
    ]
    const key = JSON.stringify({ how, transitions })
    const group = groups.get(key) ?? { uses: [], transitions }
    group.uses.push(u)
    groups.set(key, group)
  }
  for (const { uses: group, transitions } of groups.values()) {
    const u = group[0]!
    const sels = group.map((g) => g.selector)
    const list = sels.join(',\n')
    const pseudo = u.pseudo ?? '::after'
    const ring = u.ring !== false
    out.push(
      rule(
        list,
        ring
          ? {
              '--greese-shape-ring': u.borderColor ?? 'var(--greese-color-border)',
              ...(u.positioned ? {} : { position: 'relative' }),
              // The border layer's z-index stays inside the element.
              isolation: 'isolate',
              // The ring draws the border, in the shape; the box's own stays for layout.
              'border-color': 'transparent',
              'clip-path': 'var(--greese-shape-clip) padding-box',
            }
          : { 'clip-path': 'var(--greese-shape-clip) border-box' }
      )
    )
    if (ring)
      out.push(
        rule(sels.map((s) => `${s}${pseudo}`).join(',\n'), {
          position: 'absolute',
          inset: '0',
          'z-index': '1',
          'pointer-events': 'none',
          content: "''",
          background: 'var(--greese-shape-ring)',
          'clip-path': 'var(--greese-shape-ring-clip)',
        })
      )
    for (const [variant, d] of Object.entries(u.variants ?? {}))
      out.push(rule(sels.map((s) => join(s, variant)).join(',\n'), d))
    if (transitions.length)
      out.push(
        block(
          '@media (prefers-reduced-motion: no-preference)',
          [
            rule(list, { transition: transitions.join(',\n    ') }),
            ...Object.entries(u.variantTransitions ?? {}).map(([variant, extra]) =>
              rule(sels.map((s) => join(s, variant)).join(',\n'), {
                // After the shape's own, whose last (the bleed) the focus
                // rule's delays count on; the extra ones cycle to 0s delays.
                transition: [...transitions, ...extra].join(',\n    '),
              })
            ),
          ].join('\n')
        )
      )
    if (u.touch)
      out.push(
        block(
          '@media (pointer: coarse)',
          rule(list, { 'min-block-size': '44px', 'min-inline-size': '44px' })
        )
      )
    // Forced colors: the system draws borders and outlines; a shape would hide them.
    out.push(
      block(
        '@media (forced-colors: active)',
        [
          rule(list, {
            'clip-path': 'none',
            ...(ring && { 'border-color': 'CanvasText' }),
          }),
          ring
            ? rule(sels.map((s) => `${s}${pseudo}`).join(',\n'), { display: 'none' })
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      )
    )
  }

  // Each shape's geometry and parameters, once, for every element that takes it.
  for (const [name, def] of Object.entries(shapes)) {
    const mine = live.filter((u) => u.shape === name)
    if (!mine.length) continue
    const sels = mine.map((u) => u.selector)
    const moving = mine.filter((u) => !u.still)
    const { outer, ring } = clips(def)
    const color =
      def.border?.color && def.border.color !== 'auto' ? def.border.color : undefined
    out.push(
      rule(sels.join(',\n'), {
        ...paramDecls(def.params),
        [shapeVar(BORDER)]: `${num(def.border?.width ?? 1)}px`,
        ...(color && { '--greese-shape-ring': color }),
        '--greese-shape-clip': outer,
        '--greese-shape-ring-clip': ring,
      })
    )
    if (def.mirror) {
      const flipped = clips(mirrored(def))
      out.push(
        rule(sels.map((s) => `${s}:dir(rtl)`).join(',\n'), {
          '--greese-shape-clip': flipped.outer,
          '--greese-shape-ring-clip': flipped.ring,
        })
      )
    }
    // Every selector a state applies on: the element's own, then each scaled
    // variant (smaller features), which come later so they win.
    const variantsOf = (u: ShapeUse): Array<[selector: string, factor: number]> => [
      [u.selector, 1],
      ...Object.entries(u.scale ?? {}).map(
        ([suffix, f]) => [join(u.selector, suffix), f] as [string, number]
      ),
    ]
    const scaled = (set: ShapeParams | undefined, f: number) =>
      paramDecls(
        set && Object.fromEntries(Object.entries(set).map(([k, v]) => [k, v * f]))
      )
    for (const u of mine)
      for (const [sel, f] of variantsOf(u).slice(1))
        out.push(rule(sel, scaled(def.params, f)))
    const stateRules = (
      set: ShapeParams | undefined,
      pick: (u: ShapeUse) => string | false | undefined,
      fallback: string
    ) => {
      if (!set) return ''
      const byFactor = new Map<number, string[]>()
      for (const u of moving) {
        const suffix = pick(u)
        if (suffix === false) continue
        for (const [sel, f] of variantsOf(u))
          byFactor.set(f, [...(byFactor.get(f) ?? []), join(sel, suffix ?? fallback)])
      }
      return [...byFactor]
        .map(([f, list]) => rule(list.join(',\n'), scaled(set, f)))
        .join('\n')
    }
    const hover = stateRules(def.hover, (u) => u.hover, ':hover')
    if (hover) out.push(block('@media (hover: hover)', hover))
    const active = stateRules(def.active, (u) => u.active, ':active')
    if (active) out.push(active)

    // Focus: the shape opens to its box and the usual focus ring shows round
    // it; or a ring inside the shape; or the element's own, drawn inside.
    const own = def.focus ?? (opensToBox(def) ? 'box' : 'ring')
    const modeOf = (u: ShapeUse) =>
      u.focus === 'keep'
        ? 'keep'
        : u.focus === 'ring' && u.ring !== false
          ? 'ring'
          : own === 'ring' && u.ring === false
            ? 'keep'
            : (u.focus ?? own)
    const focusSel = (u: ShapeUse) => join(u.selector, u.focusOn ?? ':focus-visible')
    const rings = mine.filter((u) => modeOf(u) === 'ring').map(focusSel)
    if (rings.length)
      out.push(
        rule(rings.join(',\n'), {
          [shapeVar(BORDER)]: `${FOCUS_RING_PX}px`,
          '--greese-shape-ring': 'var(--greese-color-focus-ring)',
          // The ring is the focus indicator; an outline would be clipped anyway.
          'outline-color': 'transparent',
        })
      )
    // The bleed (the clip opening past the box) waits until the shape has
    // opened, so no background shows past its cuts: the last transition.
    const byLength = new Map<number, string[]>()
    for (const u of mine.filter((m) => modeOf(m) === 'box')) {
      const n = u.still ? 0 : transitionsOf(u).length
      byLength.set(n, [...(byLength.get(n) ?? []), focusSel(u)])
    }
    for (const [n, focusSels] of byLength)
      out.push(
        rule(focusSels.join(',\n'), {
          ...Object.fromEntries(shapeParams(def).map((p) => [shapeVar(p), '0px'])),
          [shapeVar(BLEED)]: `${BLEED_PX}px`,
          ...(n && {
            'transition-delay': [
              ...Array<string>(n - 1).fill('0s'),
              'var(--greese-duration-normal)',
            ].join(', '),
          }),
        })
      )
  }
  return out.filter(Boolean).join('\n')
}

/** One shape on one element: `shapesCss` for a single use. */
export const shapeCss = (def: ShapeDef, target: ShapeTarget): string =>
  shapesCss({ shape: def }, [{ ...target, shape: 'shape' }])

const fast = (...properties: string[]) =>
  properties.map((p) => `${p} var(--greese-duration-fast) var(--greese-easing-standard)`)

/**
 * How each component takes a shape: which element, whether a pseudo-element
 * is free for the border, how it shows focus, its own transitions. A
 * component not listed takes the defaults (its root, `::after`, the border
 * token). Clipping removes shadows and anything drawn outside the box, so an
 * entry also says what replaces them.
 */
export const SHAPE_TARGETS: Record<string, Omit<ShapeTarget, 'selector'>> = {
  // ::before draws the loading spinner and ::after the touch target, which a
  // shaped button doesn't need: it is 44px on touch screens anyway.
  Button: {
    pseudo: '::after',
    touch: true,
    borderColor: 'var(--greese-button-border, transparent)',
    transitions: fast('background-color', 'border-color', 'color'),
    scale: {
      '&.greese-Button--size-sm': 0.7,
      '&.greese-Button--size-xs': 0.5,
      '&.greese-IconButton': 0.5,
    },
  },
  Card: {
    hover: '&.greese-Card--interactive:hover',
    active: '&.greese-Card--interactive:active',
    borderColor: 'transparent',
    variants: {
      '&.greese-Card--outline': { '--greese-shape-ring': 'var(--greese-color-border)' },
      // A clip removes the shadow, so elevation is a stronger edge.
      '&.greese-Card--elevated': {
        '--greese-shape-ring': 'var(--greese-color-border-strong)',
      },
    },
    // Only an interactive card moves on its own (it lifts when hovered), as
    // without a shape: on every card, `translate` would lag the runtime's
    // effects behind their masks (a pocket's window would drift with it).
    variantTransitions: {
      '&.greese-Card--interactive': [
        'box-shadow var(--greese-duration-normal) var(--greese-easing-standard)',
        'border-color var(--greese-duration-normal) var(--greese-easing-standard)',
        'translate var(--greese-duration-normal) var(--greese-easing-standard)',
      ],
    },
  },
  Alert: {
    hover: false,
    active: false,
    borderColor: 'color-mix(in oklab, var(--greese-alert-tone) 30%, transparent)',
  },
  Badge: {
    hover: false,
    active: false,
    borderColor: 'color-mix(in oklab, var(--greese-badge-tone) 35%, transparent)',
  },
  Chip: {
    borderColor: 'var(--greese-color-border)',
    touch: true,
    transitions: fast('background-color', 'color'),
  },
  Tile: { hover: false, active: false, borderColor: 'var(--greese-color-border)' },
  // Fields stay focused while they're used: focus is a ring inside the shape.
  Input: {
    hover: false,
    active: false,
    focus: 'ring',
    focusOn: ':has(:focus-visible)',
    borderColor: 'var(--greese-color-border-strong)',
    variants: {
      '&:hover': { '--greese-shape-ring': 'var(--greese-color-fg-muted)' },
      '&[aria-invalid=true], &[data-invalid]': {
        '--greese-shape-ring': 'var(--greese-color-negative)',
      },
    },
    transitions: fast('box-shadow'),
  },
  SegmentedControl: {
    select: '.greese-SegmentedControl-track',
    hover: false,
    active: false,
    borderColor: 'var(--greese-color-border)',
  },
  Segment: {
    hover: false,
    active: false,
    focus: 'ring',
    focusOn: ':has(:focus-visible)',
    borderColor: 'transparent',
    transitions: fast('background-color', 'color'),
  },
  Tab: {
    ring: false,
    focus: 'keep',
    active: false,
    transitions: fast('color', 'background-color', 'box-shadow'),
  },
  AccordionItem: {
    hover: false,
    active: false,
    borderColor: 'var(--greese-color-border)',
  },
  // A pulsing status draws its pulse outside the dot: it keeps its own round.
  Status: {
    select: '.greese-Status:not(.greese-Status--pulse)',
    ring: false,
    still: true,
  },
  // In a group, avatars are separated by a ring drawn outside them: those stay round.
  Avatar: {
    select: '.greese-Avatar:not(.greese-AvatarGroup-item > .greese-Avatar)',
    ring: false,
    still: true,
  },
  SpeedDial: {
    select: '.greese-SpeedDial-trigger',
    ring: false,
    touch: true,
    transitions: fast('background-color'),
  },
  // Overlays move as the theme says (ADR 0025): a transition here would
  // replace the one that keeps them rendered while they leave, so their
  // shapes stay still.
  Dialog: {
    positioned: true,
    still: true,
    borderColor: 'var(--greese-color-border)',
  },
  // These scroll their own content, and a border layer inside a scroller
  // would scroll with it: they're only clipped, their own border kept.
  Popover: { positioned: true, still: true, ring: false },
  Menu: { positioned: true, still: true, ring: false },
  Tooltip: { positioned: true, still: true, ring: false },
  Toast: { still: true, borderColor: 'var(--greese-color-border-strong)' },
}

/** The element a component's shape goes on. */
export const shapeSelector = (component: string): string =>
  SHAPE_TARGETS[component]?.select ?? `.greese-${component}`

/** The class that gives any element a shape: `greese-shape-<name>`. */
export const shapeClass = (name: string): string => `greese-shape-${name}`

/** A component's target for a shape, or the default for an element with the shape's class. */
export const shapeTarget = (component?: string): Omit<ShapeTarget, 'selector'> =>
  (component && SHAPE_TARGETS[component]) || {}

// ---------------------------------------------------------------------------
// Presets: starting points for the Studio and the shape themes.
// ---------------------------------------------------------------------------

const P = (x: ShapeLength, y: ShapeLength, round?: number | string): ShapePoint =>
  round === undefined ? { x, y } : { x, y, round }
const end = (px = 0, param?: string, k = -1): ShapeLength => ({ pct: 100, px, param, k })
const start = (px = 0, param?: string, k = 1): ShapeLength => ({ pct: 0, px, param, k })
const mid = (param?: string, k = 1): ShapeLength => ({ pct: 50, param, k })

/** The box itself. */
export const rectangle = (): ShapeDef => ({
  points: [P(start(), start()), P(end(), start()), P(end(), end()), P(start(), end())],
})

/** Corners cut on the diagonal: `a` top-start and bottom-end, `b` the other two. */
export const bevel = (a = 12, b = 0): ShapeDef => ({
  points: [
    P(start(0, 'a'), start()),
    P(end(0, 'b'), start()),
    P(end(), start(0, 'b')),
    P(end(), end(0, 'a')),
    P(end(0, 'a'), end()),
    P(start(0, 'b'), end()),
    P(start(), end(0, 'b')),
    P(start(), start(0, 'a')),
  ],
  params: { a, b },
})

/** Square notches out of every corner. */
export const notch = (n = 10): ShapeDef => ({
  points: [
    P(start(0, 'n'), start()),
    P(end(0, 'n'), start()),
    P(end(0, 'n'), start(0, 'n')),
    P(end(), start(0, 'n')),
    P(end(), end(0, 'n')),
    P(end(0, 'n'), end(0, 'n')),
    P(end(0, 'n'), end()),
    P(start(0, 'n'), end()),
    P(start(0, 'n'), end(0, 'n')),
    P(start(), end(0, 'n')),
    P(start(), start(0, 'n')),
    P(start(0, 'n'), start(0, 'n')),
  ],
  params: { n },
})

/** A tag: square at the start, pointed at the end by `t`. */
export const tag = (t = 12): ShapeDef => ({
  points: [
    P(start(), start()),
    P(end(0, 't'), start()),
    P(end(), mid()),
    P(end(0, 't'), end()),
    P(start(), end()),
  ],
  params: { t },
  mirror: true,
})

/** Pointed at both ends: a hexagon, `h` deep. */
export const hexagon = (h = 10): ShapeDef => ({
  points: [
    P(start(0, 'h'), start()),
    P(end(0, 'h'), start()),
    P(end(), mid()),
    P(end(0, 'h'), end()),
    P(start(0, 'h'), end()),
    P(start(), mid()),
  ],
  params: { h },
})

/** Leaning like italic type: top edge shifted by `s` toward the end. */
export const slant = (s = 8): ShapeDef => ({
  points: [
    P(start(0, 's'), start()),
    P(end(), start()),
    P(end(0, 's'), end()),
    P(start(), end()),
  ],
  params: { s },
  mirror: true,
})

/** The top-end corner folded down by `f`. */
export const dogEar = (f = 18): ShapeDef => ({
  points: [
    P(start(), start()),
    P(end(0, 'f'), start()),
    P(end(), start(0, 'f')),
    P(end(), end()),
    P(start(), end()),
  ],
  params: { f },
  mirror: true,
})

/** A ticket: a half-round notch `r` deep in each side, halfway down. */
export const ticket = (r = 12): ShapeDef => {
  // Each notch is a half circle flattened into points around (side, 50%): k·r from it.
  const arc = (side: 'start' | 'end'): ShapePoint[] =>
    Array.from({ length: 9 }, (_, i) => {
      const a = (Math.PI * i) / 8
      // Down the end side (top to bottom), up the start side.
      const dy = side === 'end' ? -Math.cos(a) : Math.cos(a)
      const dx = Math.sin(a)
      return P(
        side === 'end' ? { pct: 100, param: 'r', k: -dx } : { pct: 0, param: 'r', k: dx },
        { pct: 50, param: 'r', k: dy }
      )
    })
  return {
    points: [
      P(start(), start()),
      P(end(), start()),
      ...arc('end'),
      P(end(), end()),
      P(start(), end()),
      ...arc('start'),
    ],
    params: { r },
  }
}

/** Top corners cut by `c`: a tab, or a folder's. */
export const tabTop = (c = 8): ShapeDef => ({
  points: [
    P(start(0, 'c'), start()),
    P(end(0, 'c'), start()),
    P(end(), start(0, 'c')),
    P(end(), end()),
    P(start(), end()),
    P(start(), start(0, 'c')),
  ],
  params: { c },
})

/** A zigzag hem along the bottom edge: `teeth` teeth, `z` deep. */
export const zigzag = (z = 6, teeth = 16): ShapeDef => ({
  points: [
    P(start(), start()),
    P(end(), start()),
    P(end(), end(0, 'z')),
    ...Array.from({ length: teeth * 2 - 1 }, (_, i) => {
      const k = teeth * 2 - 1 - i
      return P({ pct: (100 * k) / (teeth * 2) }, k % 2 ? end() : end(0, 'z'))
    }),
    P(start(), end(0, 'z')),
  ],
  params: { z },
})

/** A diamond: the midpoints of the box's sides, for marks (avatars, status dots). */
export const diamond = (): ShapeDef => ({
  points: [
    P({ pct: 50 }, { pct: 0 }),
    P({ pct: 100 }, { pct: 50 }),
    P({ pct: 50 }, { pct: 100 }),
    P({ pct: 0 }, { pct: 50 }),
  ],
})

/** A shield: free-form, in percentages, rounded at the top corners. */
export const shield = (): ShapeDef => ({
  points: [
    P({ pct: 0 }, { pct: 0 }, 'r'),
    P({ pct: 100 }, { pct: 0 }, 'r'),
    P({ pct: 100 }, { pct: 55 }),
    P({ pct: 50 }, { pct: 100 }),
    P({ pct: 0 }, { pct: 55 }),
  ],
  params: { r: 10 },
})

/** The presets by name, for pickers. */
export const SHAPE_PRESETS: Record<string, () => ShapeDef> = {
  rectangle,
  bevel: () => bevel(),
  notch: () => notch(),
  tag: () => tag(),
  hexagon: () => hexagon(),
  slant: () => slant(),
  'dog-ear': () => dogEar(),
  ticket: () => ticket(),
  'tab-top': () => tabTop(),
  zigzag: () => zigzag(),
  diamond,
  shield,
}
