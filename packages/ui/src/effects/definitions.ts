/** The built-in effects' definitions: base effects, combos, and how far they reach. */

export type Value = string | number

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

export type Stop = readonly [offset: number, value: Value]
export type Params = Readonly<Record<string, Value>>

export interface BaseDefinition<P extends Params = Params> {
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

export const base = <const P extends Params>(definition: BaseDefinition<P>) => definition

export const px = (fn: string) => (value: Value) =>
  `${fn}(${typeof value === 'number' ? `${value}px` : value})`
export const plain = (fn: string) => (value: Value) => `${fn}(${value})`

export const ZERO = '0px'

/**
 * Wipes and pockets: a mask that shows everything, anchored at one side (or
 * the middle), sized from `start` to `end`. A mask, not `clip-path`, because
 * the clip belongs to the element's shape and a mask composes with it (ADR
 * 0024); it exists only while the effect plays.
 */
// Colors by name, not `#000`: greese.js interpolates the numbers in a value,
// and would write `#000` back as `#0`, dropping the mask.
export const SOLID = 'linear-gradient(black, black)'
export const WHOLE = '100% 100%'
export const masked = (position: string, start: string, end: string) =>
  base({
    property: 'maskSize',
    params: { start, end },
    fixed: { maskImage: SOLID, maskRepeat: 'no-repeat', maskPosition: position },
  })

/** The directions wipes and pockets go in (physical, like the slides): x, y. */
export const DIRECTIONS = {
  Right: [1, 0],
  Left: [-1, 0],
  Up: [0, -1],
  Down: [0, 1],
  DownRight: [1, 1],
  DownLeft: [-1, 1],
  UpRight: [1, -1],
  UpLeft: [-1, -1],
} as const
export type Direction = keyof typeof DIRECTIONS

/** The directions wipes and pockets go in, by name: `Right`, `DownLeft`… */
export const effectDirections = Object.keys(DIRECTIONS) as Direction[]

/** `50% 0%` for a side: where a direction comes from (`-1`) or goes to (`1`). */
export const side = (dx: number, dy: number, toward: 1 | -1) =>
  `${50 + 50 * dx * toward}% ${50 + 50 * dy * toward}%`
/** The mask's size with the moving axes at `amount`. */
export const sized = (dx: number, dy: number, amount: string) =>
  `${dx ? amount : '100%'} ${dy ? amount : '100%'}`

/**
 * A wipe in `direction`: arriving, the edge sweeps that way and reveals the
 * element from the side it leaves; leaving, it sweeps that way and covers it.
 */
export const wipes = Object.fromEntries(
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
export const iris = (at: string, start: string, end: string) =>
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
export const OPEN = '142% 142%'
export const SHUT = '0% 0%'
/**
 * Leaving, the opening closes toward the side it goes to; arriving, it plays
 * that backwards, opening from the same side, so an entrance is its exit
 * reversed.
 */
export const irises = Object.fromEntries(
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
export const PERSPECTIVE = 'perspective(800px)'
export const turn = (axis: 'X' | 'Y', start: number, end: number, origin?: string) =>
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

export type ParamsOf<K extends BaseEffect> = (typeof baseEffects)[K]['params']

/** What a call to a base effect may set: any of its parameters. */
export type BaseArgs<K extends BaseEffect> = { [P in keyof ParamsOf<K>]?: Value }

/** A base effect inside a combo, and where in the combo's time it plays. */
export interface Part {
  effect: BaseEffect
  args: Record<string, Value | undefined>
  /** The share of the combo it spans, `[from, to]` in 0–1. Default: all of it. */
  at: readonly [from: number, to: number]
}

/** `effect` must be a base effect's name: a typo, or a combo, fails to compile. */
export const part = <K extends BaseEffect>(
  effect: K,
  args: BaseArgs<K> = {},
  at: readonly [number, number] = [0, 1]
): Part => ({ effect, args, at })

export interface ComboDefinition {
  /** Every parameter and its default; it may read how far things travel. */
  params: (reach: Reach) => Params
  parts: (params: Params, reach: Reach) => readonly Part[]
}

export const combo = (definition: ComboDefinition) => definition

export const away = ({ distance }: Reach) => ({ distance })

/**
 * A pocket: the element moves out of (or into) an invisible slot at one of
 * its own edges. It slides `distance` (its whole size, by default, so it
 * starts or ends out of sight) while a mask anchored where it's going grows or
 * shrinks by the same amount, so the window it shows through stays where the
 * element rests. Arriving, it moves `direction`; leaving, it moves on that
 * way, into the slot on that side.
 */
export const pocket = (direction: Direction, leaving: boolean): ComboDefinition => {
  const [dx, dy] = DIRECTIONS[direction]
  return {
    params: () => ({ distance: '100%' }),
    parts: ({ distance }) => {
      const far = (sign: number) =>
        sign > 0 ? String(distance) : negate(String(distance))
      const slide = (axis: 'x' | 'y', sign: number) => {
        const travel = {
          start: leaving ? ZERO : far(-sign),
          end: leaving ? far(sign) : ZERO,
        }
        return axis === 'x' ? part('slideRight', travel) : part('slideDown', travel)
      }
      // A share of its size (the default, 100%) is plain percentages, which
      // every engine transitions; any other length is calc() at both ends,
      // the same shape, so greese.js interpolates them.
      const share = /^(-?[\d.]+)%$/.exec(String(distance).trim())
      const short = sized(
        dx,
        dy,
        share ? `${100 - Number(share[1])}%` : `calc(100% - ${distance})`
      )
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

export const pockets = Object.fromEntries(
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
export const FLIPS = {
  Up: ['X', 1],
  Down: ['X', -1],
  Left: ['Y', 1],
  Right: ['Y', -1],
} as const
export const flips = Object.fromEntries(
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
) as unknown as Record<
  `flip${keyof typeof FLIPS}` | `flipOut${keyof typeof FLIPS}`,
  ComboDefinition
>

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
    parts: (p) => [
      part('fadeIn', {}, [0, 0.6]),
      part('depth', { start: p.depth, end: 0 }),
    ],
  }),
  depthOut: combo({
    params: () => ({ depth: -240 }),
    parts: (p) => [
      part('fadeOut', {}, [0.4, 1]),
      part('depth', { start: 0, end: p.depth }),
    ],
  }),
  swingIn: combo({
    params: () => ({ angle: -80 }),
    parts: (p) => [
      part('fadeIn', {}, [0, 0.5]),
      part('hinge', { start: p.angle, end: 0 }),
    ],
  }),
  swingOut: combo({
    params: () => ({ angle: -80 }),
    parts: (p) => [
      part('fadeOut', {}, [0.5, 1]),
      part('hinge', { start: 0, end: p.angle }),
    ],
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

export const isBase = (name: BuiltInEffect): name is BaseEffect =>
  Object.hasOwn(baseEffects, name)

export const PLAIN = /^-?[\d.]+[a-z%]*$/i

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

export const CSS_DIR = 'var(--greese-motion-dir, 1)'

/** The reach for CSS: `--greese-motion-dir` is 1, or -1 in right-to-left (Motion.scss). */
export const cssReach: Reach = {
  distance: 'var(--greese-motion-distance, 1rem)',
  negate,
  start: (length) => `calc(-1 * ${CSS_DIR} * ${length})`,
  end: (length) => `calc(${CSS_DIR} * ${length})`,
}
