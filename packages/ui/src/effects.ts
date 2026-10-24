import { kebab } from './kebab.ts'

/**
 * The built-in effects of the `greese` prop: the one place they are defined.
 *
 * - **Base effects** animate one property each (opacity, scale, a translation,
 *   a filter…) and take optional parameters: `start`, `end` and whatever else
 *   they need, each with a default. `fadeIn` fades from 0 to 1; `fadeIn(0.25,
 *   0.8)` or `fadeIn({ end: 0.8 })` changes that.
 * - **Combo effects** are made of base effects, by name (typed against
 *   `baseEffects`), each placed in time as a share of the combo: `popIn` is
 *   `pop` plus a `fadeIn` over its first 60%.
 *
 * Every call also takes the timing keys `duration` and `offset` (seconds) and
 * `ease`, after the effect's own parameters when given by position:
 * `someEffect(start, end, duration, offset, ease)`.
 *
 * Nothing else lists the effects. The runtime plays what this file says; the
 * build writes every effect that ends at the element's resting state as CSS
 * (`@keyframes greese-<name>`) and every one that ends away from it as an
 * overlay exit (`dist/_maps.scss`); the name types and Theme Studio's lists are
 * derived; an effect Studio defines is turned into the same CSS by the same
 * `cssPlan()`. To add an effect, add it here.
 *
 * Keep this file free of imports but `kebab.ts` (which imports nothing, so the
 * runtime chunk carries no tokens): the build script runs it directly under
 * Node's type stripping.
 */

type Value = string | number

/** greese.js keyframes: property → values spread over 0–1, or a list of frames. */
export type EffectFrames =
  | { readonly [property: string]: Value | readonly Value[] }
  | ReadonlyArray<{ readonly [property: string]: Value | undefined; offset?: number }>

/**
 * How far an effect travels, in the form its player needs. In JavaScript these
 * are plain lengths flipped for the writing direction; in CSS they are
 * `calc()`s over `--greese-motion-distance` and `--greese-motion-dir`.
 */
export interface Reach {
  /** The `distance` option. */
  distance: string
  /** A length the other way. */
  negate: (length: string) => string
  /** A length towards the inline start (left in LTR). */
  start: (length: string) => string
  /** A length towards the inline end. */
  end: (length: string) => string
}

/** Keys every call accepts, in the order positional arguments fill them. */
export const timingKeys = ['duration', 'offset', 'ease'] as const

/** What a call may set about its timing, as parsed: seconds, and an ease name. */
export interface Timing {
  /** Seconds this effect takes. Overrides the instance's `duration`. */
  duration?: number
  /** Seconds after its step starts. */
  offset?: number
  /** A greese.js ease. */
  ease?: string
}

type Stop = readonly [offset: number, value: Value]
type Params = Readonly<Record<string, Value>>

interface BaseDefinition<P extends Params = Params> {
  /** The one property it animates, as greese.js names it (`opacity`, `y`, `scale`…). */
  property: string
  /** Every parameter and its default; `start` and `end` come first. */
  params: P
  /** Where the values sit in time, 0–1. Default: `start` at 0, `end` at 1. */
  stops?(params: P): readonly Stop[]
  /** A parameter as the property's value (`8` → `blur(8px)`). */
  format?(value: Value): Value
  /** Properties that hold one value throughout, beside the animated one (a mask's image). */
  fixed?: Readonly<Record<string, Value>>
}

const base = <const P extends Params>(definition: BaseDefinition<P>) => definition

const px = (fn: string) => (value: Value) =>
  `${fn}(${typeof value === 'number' ? `${value}px` : value})`
const plain = (fn: string) => (value: Value) => `${fn}(${value})`

const ZERO = '0px'

/**
 * Wipes and pockets: a mask that shows everything, anchored at one side (or
 * the middle), sized from `start` to `end`. A mask, not `clip-path`, because
 * the clip belongs to the element's shape and a mask composes with it (ADR
 * 0024); it exists only while the effect plays.
 */
// Colors by name, not `#000`: greese.js interpolates the numbers in a value,
// and would write `#000` back as `#0`, dropping the mask.
const SOLID = 'linear-gradient(black, black)'
const WHOLE = '100% 100%'
const masked = (position: string, start: string, end: string) =>
  base({
    property: 'maskSize',
    params: { start, end },
    fixed: { maskImage: SOLID, maskRepeat: 'no-repeat', maskPosition: position },
  })

/** The directions wipes and pockets go in (physical, like the slides): x, y. */
const DIRECTIONS = {
  Right: [1, 0],
  Left: [-1, 0],
  Up: [0, -1],
  Down: [0, 1],
  DownRight: [1, 1],
  DownLeft: [-1, 1],
  UpRight: [1, -1],
  UpLeft: [-1, -1],
} as const
type Direction = keyof typeof DIRECTIONS

/** The directions wipes and pockets go in, by name: `Right`, `DownLeft`… */
export const effectDirections = Object.keys(DIRECTIONS) as Direction[]

/** `50% 0%` for a side: where a direction comes from (`-1`) or goes to (`1`). */
const side = (dx: number, dy: number, toward: 1 | -1) =>
  `${50 + 50 * dx * toward}% ${50 + 50 * dy * toward}%`
/** The mask's size with the moving axes at `amount`. */
const sized = (dx: number, dy: number, amount: string) =>
  `${dx ? amount : '100%'} ${dy ? amount : '100%'}`

/**
 * A wipe in `direction`: arriving, the edge sweeps that way and reveals the
 * element from the side it leaves; leaving, it sweeps that way and covers it.
 */
const wipes = Object.fromEntries(
  Object.entries(DIRECTIONS).flatMap(([name, [dx, dy]]) => [
    [`wipe${name}`, masked(side(dx, dy, -1), sized(dx, dy, '0%'), WHOLE)],
    [`wipeOut${name}`, masked(side(dx, dy, 1), WHOLE, sized(dx, dy, '0%'))],
  ])
) as unknown as Record<`wipe${Direction}` | `wipeOut${Direction}`, BaseDefinition>

/**
 * An iris: an opening the element's shape (an ellipse in its proportions)
 * that grows from, or shrinks to, a point: the middle, a side or a corner. The
 * mask is anchored at that point, so it stays put while the opening changes
 * size. `IRIS_OPEN` is where it just covers the farthest corner from any of
 * those points, so the whole run is visible change, in and out alike.
 */
const iris = (at: string, start: string, end: string) =>
  base({
    property: 'maskSize',
    params: { start, end },
    fixed: {
      maskImage: `radial-gradient(${at === '50% 50%' ? 'closest-side' : `farthest-side at ${at}`}, black 98%, transparent)`,
      maskRepeat: 'no-repeat',
      maskPosition: at,
    },
  })
// √2: an ellipse in the element's proportions reaches its far corner at 141.4%.
const OPEN = '142% 142%'
const SHUT = '0% 0%'
/**
 * Leaving, the opening closes toward the side it goes to; arriving, it plays
 * that backwards, opening from the same side, so an entrance is its exit
 * reversed.
 */
const irises = Object.fromEntries(
  Object.entries(DIRECTIONS).flatMap(([name, [dx, dy]]) => [
    [`iris${name}`, iris(side(dx, dy, 1), SHUT, OPEN)],
    [`irisOut${name}`, iris(side(dx, dy, 1), OPEN, SHUT)],
  ])
) as unknown as Record<`iris${Direction}` | `irisOut${Direction}`, BaseDefinition>

/**
 * Three-dimensional turns and depth: `transform`, with its own perspective, so
 * they foreshorten wherever they play, with no `perspective` on a parent. Not
 * the individual `translate`/`rotate`/`scale` the other effects animate, so
 * they compose with those, and never with a shape's clip-path (applied before
 * the transform, it turns with the element).
 */
const PERSPECTIVE = 'perspective(800px)'
const turn = (axis: 'X' | 'Y', start: number, end: number, origin?: string) =>
  base({
    property: 'transform',
    params: { start, end },
    format: (v: Value) => `${PERSPECTIVE} rotate${axis}(${v}deg)`,
    ...(origin && { fixed: { transformOrigin: origin } }),
  })

export const baseEffects = {
  fadeIn: base({ property: 'opacity', params: { start: 0, end: 1 } }),
  fadeOut: base({ property: 'opacity', params: { start: 1, end: 0 } }),
  scaleIn: base({ property: 'scale', params: { start: 0, end: 1 } }),
  scaleOut: base({ property: 'scale', params: { start: 1, end: 0 } }),
  blurIn: base({ property: 'filter', params: { start: 8, end: 0 }, format: px('blur') }),
  blurOut: base({ property: 'filter', params: { start: 0, end: 8 }, format: px('blur') }),
  slideUp: base({ property: 'y', params: { start: '100%', end: '0%' } }),
  slideDown: base({ property: 'y', params: { start: '-100%', end: '0%' } }),
  // Right and left are physical: the direction the element moves.
  slideRight: base({ property: 'x', params: { start: '-100%', end: '0%' } }),
  slideLeft: base({ property: 'x', params: { start: '100%', end: '0%' } }),
  // A springy scale: past `end` by `peak` at `peakAt` (a share of the effect).
  pop: base({
    property: 'scale',
    params: { start: 1, end: 1, peak: 1.075, peakAt: 0.6 },
    stops: (p) => [
      [0, p.start],
      [Number(p.peakAt), p.peak],
      [1, p.end],
    ],
  }),
  squish: base({ property: 'scale', params: { start: 1, end: 0.96 } }),
  tilt: base({ property: 'rotate', params: { start: 0, end: -2 } }),
  glow: base({
    property: 'filter',
    params: { start: 1, end: 1.12 },
    format: plain('brightness'),
  }),
  // Wipes, every direction (`wipeRight`, `wipeOutUp`, `wipeDownLeft`…),
  // then from and to the middle.
  ...wipes,
  wipeOpenX: masked('50% 50%', '0% 100%', WHOLE),
  wipeOpenY: masked('50% 50%', '100% 0%', WHOLE),
  wipeCloseX: masked('50% 50%', WHOLE, '0% 100%'),
  wipeCloseY: masked('50% 50%', WHOLE, '100% 0%'),
  // Irises, from and to the middle, then every direction (`irisRight`, `irisOutUpLeft`…).
  irisIn: iris('50% 50%', SHUT, OPEN),
  irisOut: iris('50% 50%', OPEN, SHUT),
  ...irises,
  // In three dimensions: a turn about the horizontal (`turnX`) or vertical
  // (`turnY`) axis through the middle, and a move along the line of sight
  // (`depth`, in px: negative is away).
  turnX: turn('X', 0, 0),
  turnY: turn('Y', 0, 0),
  depth: base({
    property: 'transform',
    params: { start: 0, end: 0 },
    format: (v: Value) => `${PERSPECTIVE} translateZ(${v}px)`,
  }),
  // A hinge along the top edge, like a sign swinging down into place.
  hinge: turn('X', 0, 0, '50% 0%'),
} as const satisfies Record<string, BaseDefinition>

export type BaseEffect = keyof typeof baseEffects

type ParamsOf<K extends BaseEffect> = (typeof baseEffects)[K]['params']

/** What a call to a base effect may set: any of its parameters. */
export type BaseArgs<K extends BaseEffect> = { [P in keyof ParamsOf<K>]?: Value }

/** A base effect inside a combo, and where in the combo's time it plays. */
interface Part {
  effect: BaseEffect
  args: Record<string, Value | undefined>
  /** The share of the combo it spans, `[from, to]` in 0–1. Default: all of it. */
  at: readonly [from: number, to: number]
}

/** `effect` must be a base effect's name: a typo, or a combo, fails to compile. */
const part = <K extends BaseEffect>(
  effect: K,
  args: BaseArgs<K> = {},
  at: readonly [number, number] = [0, 1]
): Part => ({ effect, args, at })

interface ComboDefinition {
  /** Every parameter and its default; it may read how far things travel. */
  params: (reach: Reach) => Params
  parts: (params: Params, reach: Reach) => readonly Part[]
}

const combo = (definition: ComboDefinition) => definition

const away = ({ distance }: Reach) => ({ distance })

/**
 * A pocket: the element moves out of (or into) an invisible slot at one of
 * its own edges. It slides `distance` (its whole size, by default, so it
 * starts or ends out of sight) while a mask anchored where it's going grows or
 * shrinks by the same amount, so the window it shows through stays where the
 * element rests. Arriving, it moves `direction`; leaving, it moves on that
 * way, into the slot on that side.
 */
const pocket = (direction: Direction, leaving: boolean): ComboDefinition => {
  const [dx, dy] = DIRECTIONS[direction]
  return {
    params: () => ({ distance: '100%' }),
    parts: ({ distance }) => {
      const far = (sign: number) => (sign > 0 ? String(distance) : negate(String(distance)))
      const slide = (axis: 'x' | 'y', sign: number) => {
        const travel = { start: leaving ? ZERO : far(-sign), end: leaving ? far(sign) : ZERO }
        return axis === 'x' ? part('slideRight', travel) : part('slideDown', travel)
      }
      // A share of its size (the default, 100%) is plain percentages, which
      // every engine transitions; any other length is calc() at both ends,
      // the same shape, so greese.js interpolates them.
      const share = /^(-?[\d.]+)%$/.exec(String(distance).trim())
      const short = sized(dx, dy, share ? `${100 - Number(share[1])}%` : `calc(100% - ${distance})`)
      const full = sized(dx, dy, share ? '100%' : 'calc(100% - 0px)')
      return [
        ...(dx ? [slide('x', dx)] : []),
        ...(dy ? [slide('y', dy)] : []),
        // Arriving, the window is anchored at the side it moves toward; leaving, the side it leaves.
        leaving
          ? part(`wipe${direction}`, { start: full, end: short })
          : part(`wipeOut${direction}`, { start: short, end: full }),
      ]
    },
  }
}

const pockets = Object.fromEntries(
  (Object.keys(DIRECTIONS) as Direction[]).flatMap((name) => [
    [`pocket${name}`, pocket(name, false)],
    [`pocketOut${name}`, pocket(name, true)],
  ])
) as unknown as Record<`pocket${Direction}` | `pocketOut${Direction}`, ComboDefinition>

/**
 * A flip: the element turns into place about its middle, from `angle` degrees
 * (75 by default) toward the direction it arrives in: `flipUp` rises, its
 * bottom edge leading; `flipRight` swings in from the left. Leaving, it turns
 * back out the same way.
 */
const FLIPS = { Up: ['X', 1], Down: ['X', -1], Left: ['Y', 1], Right: ['Y', -1] } as const
const flips = Object.fromEntries(
  Object.entries(FLIPS).flatMap(([name, [axis, sign]]) => {
    const effect = `turn${axis}` as const
    return [
      [
        `flip${name}`,
        combo({
          params: () => ({ angle: 75 }),
          parts: (p) => [
            part('fadeIn', {}, [0, 0.5]),
            part(effect, { start: sign * Number(p.angle), end: 0 }),
          ],
        }),
      ],
      [
        `flipOut${name}`,
        combo({
          params: () => ({ angle: 75 }),
          parts: (p) => [
            part('fadeOut', {}, [0.5, 1]),
            part(effect, { start: 0, end: sign * Number(p.angle) }),
          ],
        }),
      ],
    ]
  })
) as unknown as Record<`flip${keyof typeof FLIPS}` | `flipOut${keyof typeof FLIPS}`, ComboDefinition>

export const comboEffects = {
  fadeUp: combo({
    params: away,
    parts: (p) => [part('fadeIn'), part('slideUp', { start: p.distance, end: ZERO })],
  }),
  fadeDown: combo({
    params: away,
    parts: (p, r) => [
      part('fadeIn'),
      part('slideDown', { start: r.negate(String(p.distance)), end: ZERO }),
    ],
  }),
  fadeStart: combo({
    params: away,
    parts: (p, r) => [
      part('fadeIn'),
      part('slideRight', { start: r.start(String(p.distance)), end: ZERO }),
    ],
  }),
  fadeEnd: combo({
    params: away,
    parts: (p, r) => [
      part('fadeIn'),
      part('slideLeft', { start: r.end(String(p.distance)), end: ZERO }),
    ],
  }),
  fadeOutUp: combo({
    params: away,
    parts: (p, r) => [
      part('fadeOut'),
      part('slideUp', { start: ZERO, end: r.negate(String(p.distance)) }),
    ],
  }),
  fadeOutDown: combo({
    params: away,
    parts: (p) => [part('fadeOut'), part('slideDown', { start: ZERO, end: p.distance })],
  }),
  popIn: combo({
    params: () => ({ start: 0.8, peak: 1.04, peakAt: 0.6 }),
    parts: (p) => [
      part('pop', { start: p.start, peak: p.peak, peakAt: p.peakAt }),
      part('fadeIn', {}, [0, Number(p.peakAt)]),
    ],
  }),
  popOut: combo({
    params: () => ({ end: 0.8, peak: 1.04, peakAt: 0.4 }),
    parts: (p) => [
      part('pop', { start: 1, end: p.end, peak: p.peak, peakAt: p.peakAt }),
      part('fadeOut', {}, [Number(p.peakAt), 1]),
    ],
  }),
  rise: combo({
    params: () => ({ lift: -4, scale: 1.02 }),
    parts: (p) => [
      part('slideUp', { start: 0, end: p.lift }),
      part('scaleIn', { start: 1, end: p.scale }),
    ],
  }),
  fall: combo({
    params: () => ({ drop: 4, scale: 0.98 }),
    parts: (p) => [
      part('slideDown', { start: 0, end: p.drop }),
      part('scaleOut', { start: 1, end: p.scale }),
    ],
  }),
  // Pockets, every direction, arriving and leaving.
  ...pockets,
  // Flips, depth and swings: three-dimensional, each leaving as its arrival
  // reversed (`flipOutUp` turns back down the way `flipUp` came).
  ...flips,
  depthIn: combo({
    params: () => ({ depth: -240 }),
    parts: (p) => [part('fadeIn', {}, [0, 0.6]), part('depth', { start: p.depth, end: 0 })],
  }),
  depthOut: combo({
    params: () => ({ depth: -240 }),
    parts: (p) => [part('fadeOut', {}, [0.4, 1]), part('depth', { start: 0, end: p.depth })],
  }),
  swingIn: combo({
    params: () => ({ angle: -80 }),
    parts: (p) => [part('fadeIn', {}, [0, 0.5]), part('hinge', { start: p.angle, end: 0 })],
  }),
  swingOut: combo({
    params: () => ({ angle: -80 }),
    parts: (p) => [part('fadeOut', {}, [0.5, 1]), part('hinge', { start: 0, end: p.angle })],
  }),
} as const satisfies Record<string, ComboDefinition>

export type ComboEffect = keyof typeof comboEffects

/** Base effects and combos together: every effect the library ships. */
export const builtInEffects = { ...baseEffects, ...comboEffects }

export type BuiltInEffect = BaseEffect | ComboEffect

/** Every built-in effect name, base effects first. */
export const effectNames = Object.keys(builtInEffects) as BuiltInEffect[]

/** Own keys only, so `constructor` is no effect. */
export const isBuiltInEffect = (name: string): name is BuiltInEffect =>
  Object.hasOwn(builtInEffects, name)

const isBase = (name: BuiltInEffect): name is BaseEffect =>
  Object.hasOwn(baseEffects, name)

const PLAIN = /^-?[\d.]+[a-z%]*$/i

/**
 * A length the other way. Plain ones (`1rem`, `-12px`) flip textually,
 * anything else (`calc(…)`, `var(…)`) through `calc()`.
 */
export const negate = (length: string): string =>
  PLAIN.test(length)
    ? length.startsWith('-')
      ? length.slice(1)
      : `-${length}`
    : `calc(-1 * ${length})`

/** The reach for JavaScript: lengths, flipped when the element is right to left. */
export const jsReach = (distance: string, rtl: boolean): Reach => ({
  distance,
  negate,
  start: (length) => (rtl ? length : negate(length)),
  end: (length) => (rtl ? negate(length) : length),
})

const CSS_DIR = 'var(--greese-motion-dir, 1)'

/** The reach for CSS: `--greese-motion-dir` is 1, or -1 in right-to-left (Motion.scss). */
export const cssReach: Reach = {
  distance: 'var(--greese-motion-distance, 1rem)',
  negate,
  start: (length) => `calc(-1 * ${CSS_DIR} * ${length})`,
  end: (length) => `calc(${CSS_DIR} * ${length})`,
}

type Track = { property: string; stops: Stop[] }

const round = (offset: number): number => Math.round(offset * 10_000) / 10_000

const tracksOf = (
  name: BuiltInEffect,
  args: Record<string, Value | undefined>,
  reach: Reach
): Track[] => {
  const definition = builtInEffects[name]
  const defaults = isBase(name)
    ? baseEffects[name].params
    : (definition as ComboDefinition).params(reach)
  const params: Record<string, Value> = { ...defaults }
  for (const key of Object.keys(defaults))
    if (args[key] !== undefined) params[key] = args[key]
  if (isBase(name)) {
    const { stops, format, property, fixed } = baseEffects[name] as BaseDefinition
    const at = stops
      ? stops(params)
      : ([
          [0, params.start!],
          [1, params.end!],
        ] as const)
    return [
      {
        property,
        stops: at.map(([offset, value]) => [offset, format ? format(value) : value]),
      },
      ...Object.entries(fixed ?? {}).map(([prop, value]) => ({
        property: prop,
        stops: [
          [0, value],
          [1, value],
        ] as Stop[],
      })),
    ]
  }
  return (definition as ComboDefinition).parts(params, reach).flatMap((p) =>
    tracksOf(p.effect, p.args, reach).map(({ property, stops }) => ({
      property,
      stops: stops.map(
        ([offset, value]) =>
          [round(p.at[0] + offset * (p.at[1] - p.at[0])), value] as const
      ),
    }))
  )
}

/** Properties with evenly spaced stops are written as `{ property: [values] }`, else as a list of frames. */
const framesOf = (tracks: Track[]): EffectFrames => {
  const even = tracks.every(
    ({ stops }) =>
      stops.length > 1 &&
      stops.every(([offset], i) => round(offset) === round(i / (stops.length - 1)))
  )
  if (even)
    return Object.fromEntries(
      tracks.map(({ property, stops }) => [property, stops.map(([, value]) => value)])
    )
  const at = new Map<number, Record<string, Value>>()
  for (const { property, stops } of tracks)
    for (const [offset, value] of stops) {
      const key = round(offset)
      at.set(key, { ...at.get(key), [property]: value })
    }
  return [...at]
    .sort(([a], [b]) => a - b)
    .map(([offset, values]) => ({ ...values, offset }))
}

/**
 * An effect's keyframes for a reach and arguments (parameter names to values).
 * Defaults to a left-to-right `1rem` and every parameter's default, which is
 * what tools that show or edit the effects want.
 */
export const effectFrames = (
  name: BuiltInEffect,
  reach: Reach = jsReach('1rem', false),
  args: Record<string, Value | undefined> = {}
): EffectFrames => framesOf(tracksOf(name, args, reach))

/** The parameters an effect has, then the timing keys: the order positional arguments fill. */
export const effectParamNames = (name: string): string[] =>
  isBuiltInEffect(name)
    ? [
        ...Object.keys(
          isBase(name) ? baseEffects[name].params : comboEffects[name].params(cssReach)
        ),
        ...timingKeys,
      ]
    : [...timingKeys]

/** One effect in a sequence, with the arguments written for it. */
export interface EffectCall {
  name: string
  args: Record<string, Value>
}

/** A step of a sequence: effects that play together, or a pause in seconds. */
export type EffectStep = EffectCall[] | number

/** Splits at `separator` outside brackets, braces, parentheses and quotes. */
const splitTop = (text: string, separator: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/

const valueOf = (text: string): Value => {
  const value = text.trim().replace(/^(['"])(.*)\1$/, '$2')
  return NUMBER.test(value) ? Number(value) : value
}

const NAMED = /^([A-Za-z_$][\w$]*)\s*[:=]\s*([\s\S]+)$/

/**
 * `0.25, 0.8, { duration: 1 }`: positional values fill the effect's parameters
 * in order, `key: value` (or `key=value`) sets one by name, and an object sets
 * several. Only what is written is set.
 */
const parseArgs = (name: string, text: string): Record<string, Value> => {
  const names = effectParamNames(name)
  const args: Record<string, Value> = {}
  let next = 0
  const set = (key: string, value: string) => {
    args[key] = valueOf(value)
  }
  for (const raw of splitTop(text, ',')) {
    const arg = raw.trim()
    if (!arg) continue
    if (arg.startsWith('{') && arg.endsWith('}')) {
      for (const entry of splitTop(arg.slice(1, -1), ',')) {
        const named = NAMED.exec(entry.trim())
        if (named) set(named[1]!, named[2]!)
      }
    } else {
      const named = NAMED.exec(arg)
      if (named) set(named[1]!, named[2]!)
      else if (names[next]) set(names[next++]!, arg)
    }
  }
  return args
}

const CALL = /^([A-Za-z_$][\w$]*)\s*(?:\(([\s\S]*)\))?$/

/**
 * Parses `'fadeIn(0.25)+scaleIn,+2,fadeOut({ duration: 1 })'`: commas separate
 * steps that play in turn, `+` joins effects that play together, a number is a
 * pause, and a negative one (`-0.2`) backs the next step up, so it overlaps
 * the last. An effect may be followed by arguments in parentheses.
 */
export const parseSequence = (sequence: string): EffectStep[] => {
  const steps: EffectStep[] = []
  for (const raw of splitTop(sequence, ',')) {
    const step = raw.trim()
    if (NUMBER.test(step)) steps.push(Number(step))
    else if (step)
      steps.push(
        splitTop(step, '+')
          .map((call) => call.trim())
          .filter(Boolean)
          .map((call) => {
            const match = CALL.exec(call)
            return match
              ? { name: match[1]!, args: parseArgs(match[1]!, match[2] ?? '') }
              : { name: call, args: {} }
          })
      )
  }
  return steps
}

/** A call's timing keys, apart from the effect's own parameters. */
export const splitTiming = (
  args: Record<string, Value>
): { timing: Timing; params: Record<string, Value> } => {
  const { duration, offset, ease, ...params } = args
  const timing: Timing = {}
  if (duration !== undefined && Number.isFinite(Number(duration)))
    timing.duration = Number(duration)
  if (offset !== undefined && Number.isFinite(Number(offset)))
    timing.offset = Number(offset)
  if (ease !== undefined) timing.ease = String(ease)
  return { timing, params }
}

/** One step of CSS keyframes: `from`, `to` or a percentage, and its declarations. */
export type CssStep = [at: string, declarations: Record<string, string>]

const length = (v: unknown): string => (typeof v === 'number' ? `${v}px` : String(v))

/**
 * greese.js keyframes as CSS keyframes. `x` and `y` become `translate`,
 * `scaleX`/`scaleY` `scale`, `rotate` degrees; other properties pass through,
 * kebab-cased. An object is property → values spread evenly from 0 to 100% (a
 * lone value is the end); a list is one object per frame, at its `offset` or
 * evenly spaced.
 */
export const toCssSteps = (
  frames: EffectFrames | Record<string, unknown> | ReadonlyArray<Record<string, unknown>>
): CssStep[] => {
  const steps = new Map<number, Record<string, unknown>>()
  const at = (offset: number): Record<string, unknown> => {
    const key = round(offset)
    if (!steps.has(key)) steps.set(key, {})
    return steps.get(key)!
  }
  if (Array.isArray(frames)) {
    const list = frames as ReadonlyArray<Record<string, unknown>>
    list.forEach((frame, i) => {
      const { offset, ...values } = frame
      delete values.ease
      Object.assign(
        at(
          typeof offset === 'number'
            ? offset
            : list.length > 1
              ? i / (list.length - 1)
              : 1
        ),
        values
      )
    })
  } else {
    for (const [prop, value] of Object.entries(frames)) {
      const list = Array.isArray(value) ? value : [value]
      list.forEach((v, i) => {
        at(list.length > 1 ? i / (list.length - 1) : 1)[prop] = v
      })
    }
  }
  return [...steps]
    .sort(([a], [b]) => a - b)
    .map(([offset, values]) => {
      const out: Record<string, string> = {}
      const { x, y, scaleX, scaleY, rotate, ...rest } = values
      if (x !== undefined || y !== undefined)
        out.translate = `${x === undefined ? ZERO : length(x)} ${y === undefined ? ZERO : length(y)}`
      if (scaleX !== undefined || scaleY !== undefined)
        out.scale = `${scaleX ?? 1} ${scaleY ?? 1}`
      if (rotate !== undefined)
        out.rotate = typeof rotate === 'number' ? `${rotate}deg` : String(rotate)
      for (const [prop, v] of Object.entries(rest)) out[kebab(prop)] = String(v)
      return [offset === 0 ? 'from' : offset === 1 ? 'to' : `${offset * 100}%`, out]
    })
}

/** Whether a CSS value is the property's resting state, where an element is when nothing animates it. */
/**
 * A mask only exists while an entrance plays: the element has none of its
 * own, so wherever the mask ends, the element is at rest once it's gone.
 * Masks are how an entrance wipes or rises out of a pocket without touching
 * `clip-path`, which belongs to the element's shape (ADR 0024).
 */
const transient = (property: string): boolean => property.includes('mask')

/** A mask's size that shows the whole element: every percentage 100 or more, every length 0. */
const whole = (size: string) =>
  (size.match(/-?[\d.]+[a-z%]*/gi) ?? []).every((n) =>
    n.endsWith('%') ? parseFloat(n) >= 100 : parseFloat(n) === 0
  )

const atRest = (property: string, value: string): boolean => {
  // A mask is at rest when it shows everything: an entrance that ends so
  // arrives, one that ends with the element masked away leaves.
  if (property === 'mask-size') return whole(value)
  if (transient(property)) return true
  // Where a turn pivots moves nothing by itself.
  if (property === 'transform-origin') return true
  const numbers = (text: string) => text.match(/-?[\d.]+/g)?.map(Number) ?? []
  switch (property) {
    case 'opacity':
      return Number(value) === 1
    case 'translate':
    case 'rotate':
      return numbers(value).every((n) => n === 0)
    // A turn or a depth with its perspective: at rest when it turns and moves
    // nowhere (the perspective alone changes nothing).
    case 'transform':
      return (value.match(/(rotate|translate)\w*\([^)]*\)/g) ?? []).every((fn) =>
        numbers(fn.replace(/^\w+\(/, '')).every((n) => n === 0)
      )
    case 'scale':
      return numbers(value).every((n) => n === 1)
    case 'filter':
      return (value.match(/[\w-]+\([^)]*\)|none/g) ?? []).every((fn) => {
        const one = /^(brightness|contrast|saturate|opacity)\(/.test(fn)
        return fn === 'none' || numbers(fn).every((n) => n === (one ? 1 : 0))
      })
    default:
      return false
  }
}

/** How an effect becomes CSS. */
export interface CssPlan {
  /**
   * Its `@keyframes`, when it ends at the element's resting state, so the
   * animation can finish at the element's own styles: every step but the last
   * (the 100% one, which is the resting state).
   */
  enter?: CssStep[]
  /**
   * When it ends away from rest, everything an overlay's exit sets: the
   * `translate`, `scale` and `opacity` it ends at, and its mask (`mask-image`
   * is `none` without one). A wipe, iris or pocket adds the mask it ends at
   * (`mask-size`, `mask-position`, `mask-repeat`) and the size it starts at
   * (`mask-from`): an overlay holds that mask while it closes
   * (styles/_floating.scss). Complete, so nothing falls through to an exit a
   * theme assigns around it.
   */
  exit: Record<string, string>
}

/**
 * Decides, from the keyframes alone, how CSS plays an effect. It is the only
 * place that does, for the built-in effects at build time and for the ones
 * Theme Studio defines.
 */
export const cssPlan = (frames: Parameters<typeof toCssSteps>[0]): CssPlan => {
  const steps = toCssSteps(frames)
  const end: Record<string, string> = {}
  for (const [, declarations] of steps) Object.assign(end, declarations)
  if (Object.entries(end).every(([property, value]) => atRest(property, value))) {
    // The last step is the element's own styles, so it goes, unless it holds
    // a mask: that one has to finish the reveal before the mask disappears.
    const [at, last] = steps.at(-1) ?? []
    return { enter: at === 'to' && !Object.keys(last!).some(transient) ? steps.slice(0, -1) : steps, exit: {} }
  }
  // Everything an overlay's exit sets, so nothing falls back to the theme's
  // default exit (which moves toward the overlay's origin): what the effect
  // doesn't move stays put. A masked exit hides with its mask, so it stays
  // opaque; anything else fades, as overlays always have.
  const masked = 'mask-size' in end
  const mask = Object.entries(end).filter(([property]) => property.startsWith('mask-'))
  return {
    exit: {
      translate: end.translate ?? '0px 0px',
      scale: end.scale ?? '1',
      opacity: end.opacity ?? (masked ? '1' : '0'),
      'mask-image': 'none',
      ...Object.fromEntries(mask),
      // A three-dimensional exit turns or sinks (`transform`, with its own
      // perspective), about its own pivot.
      transform: end.transform ?? 'none',
      ...(end['transform-origin'] && { 'transform-origin': end['transform-origin'] }),
      // What size the mask starts at: the overlay holds it while open (an
      // iris starts just past the far corner, at 142%).
      ...(masked && { 'mask-from': steps[0]?.[1]['mask-size'] ?? '100% 100%' }),
    },
  }
}

/**
 * A plan as CSS text, for a page that can't load a compiled theme: the same
 * rules the kit's `effect()` writes (styles/_effect.scss), a test keeps them equal.
 */
export const effectCss = (name: string, plan: CssPlan): string => {
  const kebabName = kebab(name)
  const block = (selector: string, lines: string[]) =>
    `${selector} {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`
  const rules: string[] = []
  if (plan.enter)
    rules.push(
      block(`.greese-Motion--enter-${kebabName},\n.greese-Motion--view-${kebabName}`, [
        `--greese-motion-name: greese-${kebabName};`,
      ])
    )
  const exit = Object.entries(plan.exit)
  if (exit.length)
    rules.push(
      block(
        `.greese-Motion--exit-${kebabName}`,
        exit.map(([property, value]) => `--greese-motion-exit-${property}: ${value};`)
      )
    )
  if (plan.enter)
    rules.push(
      `@media (prefers-reduced-motion: no-preference) {\n${block(
        `@keyframes greese-${kebabName}`,
        plan.enter.map(([at, declarations]) =>
          block(
            at,
            Object.entries(declarations).map(
              ([property, value]) => `${property}: ${value};`
            )
          )
        )
      )
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n}`
    )
  return rules.join('\n')
}

const plans = new Map<string, CssPlan>()

/** A built-in effect's CSS plan, in the build's reach (`--greese-motion-distance`). */
export const effectPlan = (name: BuiltInEffect): CssPlan => {
  if (!plans.has(name)) plans.set(name, cssPlan(effectFrames(name, cssReach)))
  return plans.get(name)!
}

/** Whether a built-in effect ends invisible: it leaves, where others arrive or add emphasis. */
export const endsHidden = (name: BuiltInEffect): boolean => {
  const end: Record<string, string> = {}
  for (const [, declarations] of toCssSteps(effectFrames(name, cssReach)))
    Object.assign(end, declarations)
  return Number(end.opacity) === 0
}

/** The built-in effects CSS plays alone: those that end at rest. */
export const entranceNames = (): BuiltInEffect[] =>
  effectNames.filter((name) => effectPlan(name).enter)

/** The built-in effects an overlay can leave with: those that end away from rest. */
export const exitNames = (): BuiltInEffect[] =>
  effectNames.filter((name) => !effectPlan(name).enter)

/** The class-name form of an effect name: `fadeUp` → `fade-up`. */
export const effectClass = (name: string): string => kebab(name)
