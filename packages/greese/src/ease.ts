/** Progress in, eased progress out, both nominally `0`–`1`. */
export type EaseFn = (t: number) => number

/**
 * An easing: a function, CSS-style cubic-bézier control points, or a name.
 *
 * Names: `linear`; the CSS keywords `ease`, `ease-in`, `ease-out`,
 * `ease-in-out`; `steps(n)`; `in`, `out`, `inOut` (power2); or a family with
 * a direction, GSAP-style: `power1`–`power4`, `sine`, `expo`, `circ`, `back`,
 * `elastic`, `bounce`, each `.in`, `.out` or `.inOut`, e.g. `power3.out`,
 * `back.out(2)`, `elastic.out(1.2, 0.4)`.
 */
export type Ease = string | EaseFn | readonly [number, number, number, number]

/**
 * A cubic-bézier easing from CSS-style control points (endpoints fixed at
 * 0,0 and 1,1). Newton–Raphson with a bisection fallback, as browsers do.
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number): EaseFn => {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const solveX = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x
      if (Math.abs(dx) < 1e-6) return t
      const d = (3 * ax * t + 2 * bx) * t + cx
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 24 && Math.abs(sampleX(t) - x) > 1e-6; i++) {
      if (x > sampleX(t)) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }
  return (x) => {
    if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1
    const t = solveX(x)
    return ((ay * t + by) * t + cy) * t
  }
}

const bounceOut: EaseFn = (t) => {
  const n = 7.5625
  const d = 2.75
  if (t < 1 / d) return n * t * t
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
  return n * (t -= 2.625 / d) * t + 0.984375
}

const elasticOut =
  (amplitude = 1, period = 0.3): EaseFn =>
  (t) => {
    if (t <= 0 || t >= 1) return t <= 0 ? 0 : 1
    const a = Math.max(1, amplitude)
    const s = (period / (2 * Math.PI)) * Math.asin(1 / a)
    return a * 2 ** (-10 * t) * Math.sin(((t - s) * 2 * Math.PI) / period) + 1
  }

const mirror =
  (f: EaseFn): EaseFn =>
  (t) =>
    1 - f(1 - t)

/** The "in" form of each family; out and inOut are derived from it. */
const families: Record<string, (a?: number, b?: number) => EaseFn> = {
  power1: () => (t) => t ** 2,
  power2: () => (t) => t ** 3,
  power3: () => (t) => t ** 4,
  power4: () => (t) => t ** 5,
  sine: () => (t) => 1 - Math.cos((t * Math.PI) / 2),
  expo: () => (t) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  circ: () => (t) => 1 - Math.sqrt(1 - t * t),
  back:
    (s = 1.70158) =>
    (t) =>
      t * t * ((s + 1) * t - s),
  elastic: (a, p) => mirror(elasticOut(a, p)),
  bounce: () => mirror(bounceOut),
}

const keywords: Record<string, EaseFn> = {
  linear: (t) => t,
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  'ease-in': cubicBezier(0.42, 0, 1, 1),
  'ease-out': cubicBezier(0, 0, 0.58, 1),
  'ease-in-out': cubicBezier(0.42, 0, 0.58, 1),
}

const cache = new Map<string, EaseFn>()

const byName = (name: string): EaseFn => {
  const keyword = keywords[name]
  if (keyword) return keyword
  const steps = /^steps\((\d+)\)$/.exec(name)
  if (steps) {
    const n = Number(steps[1])
    return (t) => (t >= 1 ? 1 : Math.floor(t * n) / n)
  }
  // `family.direction(a, b)`; a bare direction means power2.
  const m = /^(?:(\w+)\.)?(in|out|inOut)(?:\(([^)]*)\))?$/.exec(name)
  const family = m && families[m[1] ?? 'power2']
  if (!m || !family) throw new Error(`greese: unknown ease "${name}"`)
  const [a, b] = (m[3] ?? '').split(',').filter(Boolean).map(Number)
  const easeIn = family(a, b)
  if (m[2] === 'in') return easeIn
  const easeOut = mirror(easeIn)
  return m[2] === 'out'
    ? easeOut
    : (t) => (t < 0.5 ? easeIn(t * 2) / 2 : 0.5 + easeOut(t * 2 - 1) / 2)
}

/** Resolves any {@link Ease} to a function. Named eases are parsed once. */
export const ease = (value: Ease = 'out'): EaseFn => {
  if (typeof value === 'function') return value
  if (typeof value !== 'string') return cubicBezier(...value)
  let fn = cache.get(value)
  if (!fn) cache.set(value, (fn = byName(value)))
  return fn
}
