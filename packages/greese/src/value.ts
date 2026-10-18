/** Anything greese.js can animate between: a number, or any CSS-ish string. */
export type Value = number | string

/** Interpolates between two fixed values: `t` 0 gives `from`, 1 gives `to`. */
export type Mixer = (t: number) => Value

/** A number and its unit, if any: `-1.5rem`, `50%`, `0.25`, `1e-3s`. */
const NUMBER_UNIT = /(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([a-z%]*)/gi
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
// Six significant decimals: finer is invisible, and float noise
// ("0.30000000000000004px") shouldn't reach the DOM.
const round = (n: number): number => Math.round(n * 1e6) / 1e6

type Rgba = [number, number, number, number]

const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const RGB = /^rgba?\(([^)]+)\)$/i

/** Parses `#rgb[a]`, `#rrggbb[aa]`, `rgb()`/`rgba()` and `transparent`. */
export const parseColor = (input: string): Rgba | undefined => {
  const s = input.trim()
  if (s === 'transparent') return [0, 0, 0, 0]
  const hex = HEX.exec(s)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1]
  }
  const rgb = RGB.exec(s)?.[1]
  if (!rgb) return undefined
  const parts = rgb.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return undefined
  const channel = (p: string, max: number) =>
    p.endsWith('%') ? (parseFloat(p) / 100) * max : parseFloat(p)
  return [
    channel(parts[0]!, 255),
    channel(parts[1]!, 255),
    channel(parts[2]!, 255),
    parts[3] === undefined ? 1 : channel(parts[3], 1),
  ]
}

// sRGB <-> OKLab (Björn Ottosson). Mixing in OKLab keeps transitions
// perceptually even and free of the muddy midpoints of sRGB mixing; GLOP's
// Pixels mixes in OKLCH for the same reason.
const toLinear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = (v: number) =>
  255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

const toOklab = ([r, g, b, a]: Rgba): Rgba => {
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    a,
  ]
}

const fromOklab = ([L, A, B, a]: Rgba): string => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, fromLinear(v))))
  const r = c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const b = c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return `rgb(${r} ${g} ${b} / ${round(a)})`
}

/** Values that mean "not shown": CSS keeps the shown end for the whole tween. */
const HIDDEN = new Set(['none', 'hidden'])

const discrete = (a: Value, b: Value): Mixer => {
  if (HIDDEN.has(String(a)) !== HIDDEN.has(String(b))) {
    const shown = HIDDEN.has(String(a)) ? b : a
    return (t) => (t <= 0 ? a : t >= 1 ? b : shown)
  }
  return (t) => (t < 0.5 ? a : b)
}

/**
 * Text: counts between numbers (keeping the target's decimals), types on or
 * deletes when one string extends the other, and otherwise deletes the old
 * text then types the new.
 */
export const mixText = (from: Value, to: Value): Mixer => {
  const a = String(from)
  const b = String(to)
  // Empty counts as 0, so a blank element counts up to a number.
  const na = Number(a.trim() || 0)
  const nb = Number(b.trim() || 0)
  if ((a.trim() || b.trim()) && Number.isFinite(na) && Number.isFinite(nb)) {
    const decimals = b.split('.')[1]?.length ?? 0
    return (t) => lerp(na, nb, t).toFixed(decimals)
  }
  if (b.startsWith(a)) return (t) => b.slice(0, Math.round(lerp(a.length, b.length, t)))
  if (a.startsWith(b)) return (t) => a.slice(0, Math.round(lerp(a.length, b.length, t)))
  return (t) =>
    t < 0.5
      ? a.slice(0, Math.round(a.length * (1 - t * 2)))
      : b.slice(0, Math.round(b.length * (t * 2 - 1)))
}

/**
 * A mixer for any two values:
 *
 * - numbers, and strings with the same shape whose numbers differ
 *   (`10px` → `40px`, `blur(0px)` → `blur(8px)`, `inset(0 0 0 0)` → …);
 *   a bare number takes the other end's unit (`0` → `12rem`);
 * - different units, per number: `16px` → `2rem`, `0px` → `50%`,
 *   `100px` → `50vw`, `200ms` → `1s`, blended with `calc()` so the browser
 *   converts them exactly where the value is used (no measuring);
 * - colours, mixed in OKLab;
 * - anything else switches halfway, except that `none`/`hidden` give way to
 *   the shown value for the whole tween (as CSS does for `display`).
 */
export const mix = (from: Value, to: Value): Mixer => {
  if (typeof from === 'number' && typeof to === 'number') {
    return (t) => round(lerp(from, to, t))
  }
  const a = String(from)
  const b = String(to)
  const ca = parseColor(a)
  const cb = ca && parseColor(b)
  if (ca && cb) {
    const [la, lb] = [toOklab(ca), toOklab(cb)]
    return (t) => fromOklab(la.map((v, i) => lerp(v, lb[i]!, t)) as Rgba)
  }
  // Numbers with their units: `16px`, `2rem`, `50%`, `0.5`, `90deg`.
  const tokens = (s: string): Array<[number, string]> =>
    [...s.matchAll(NUMBER_UNIT)].map((m) => [Number(m[1]), m[2]!.toLowerCase()])
  const shape = (s: string) => s.replace(NUMBER_UNIT, '#')
  // An unset value (an undeclared custom property reads as '') starts from
  // zero in the other end's shape.
  const ta = a.trim() ? tokens(a) : tokens(b).map(([, u]): [number, string] => [0, u])
  const tb = b.trim() ? tokens(b) : ta.map(([, u]): [number, string] => [0, u])
  const template = shape(b.trim() ? b : a)
  if (!ta.length || ta.length !== tb.length) return discrete(from, to)
  if (a.trim() && b.trim() && shape(a) !== template) return discrete(from, to)
  const parts = template.split('#')
  const pairs = ta.map(([va, ua], i) => {
    const [vb, ub] = tb[i]!
    // A unitless number takes the other end's unit (`0` against `12rem`).
    return { va, vb, ua: ua || ub, ub: ub || ua }
  })
  return (t) =>
    parts.reduce((out, part, i) => {
      const p = pairs[i]
      if (!p) return out + part
      if (p.ua === p.ub) return out + part + round(lerp(p.va, p.vb, t)) + p.ua
      // Different units (px → rem, px → %, px → vw, ms → s): CSS blends them
      // exactly, in the context the value is used in.
      if (t <= 0) return out + part + p.va + p.ua
      if (t >= 1) return out + part + p.vb + p.ub
      return `${out}${part}calc(${p.va}${p.ua} * ${round(1 - t)} + ${p.vb}${p.ub} * ${round(t)})`
    }, '')
}
