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
}

const base = <const P extends Params>(definition: BaseDefinition<P>) => definition

const px = (fn: string) => (value: Value) =>
  `${fn}(${typeof value === 'number' ? `${value}px` : value})`
const plain = (fn: string) => (value: Value) => `${fn}(${value})`

const ZERO = '0px'

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
    const { stops, format, property } = baseEffects[name] as BaseDefinition
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
const atRest = (property: string, value: string): boolean => {
  const numbers = (text: string) => text.match(/-?[\d.]+/g)?.map(Number) ?? []
  switch (property) {
    case 'opacity':
      return Number(value) === 1
    case 'translate':
    case 'rotate':
      return numbers(value).every((n) => n === 0)
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
   * When it ends away from rest, what an overlay's exit changes: the
   * `translate` and `scale` it ends at (opacity is always faded). Empty for a
   * plain fade.
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
  if (Object.entries(end).every(([property, value]) => atRest(property, value)))
    return { enter: steps.at(-1)?.[0] === 'to' ? steps.slice(0, -1) : steps, exit: {} }
  return {
    exit: Object.fromEntries(
      Object.entries(end).filter(([property]) => /^(translate|scale)$/.test(property))
    ),
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
