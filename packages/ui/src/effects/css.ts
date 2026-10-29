/** Effects as CSS: keyframe steps, the plan of what's animated, and the rules the build writes. */
import { kebab } from '../kebab.ts'
import {
  cssReach,
  effectNames,
  ZERO,
  type BuiltInEffect,
  type EffectFrames,
} from './definitions.ts'
import { effectFrames, round } from './frames.ts'

/** One step of CSS keyframes: `from`, `to` or a percentage, and its declarations. */
export type CssStep = [at: string, declarations: Record<string, string>]

export const length = (v: unknown): string =>
  typeof v === 'number' ? `${v}px` : String(v)

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
export const transient = (property: string): boolean => property.includes('mask')

/** A mask's size that shows the whole element: every percentage 100 or more, every length 0. */
export const whole = (size: string) =>
  (size.match(/-?[\d.]+[a-z%]*/gi) ?? []).every((n) =>
    n.endsWith('%') ? parseFloat(n) >= 100 : parseFloat(n) === 0
  )

export const atRest = (property: string, value: string): boolean => {
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
  /**
   * When it ends away from rest, its whole `@keyframes`, from the element's
   * resting state to where it ends: what a page transition's old snapshot
   * plays to leave (ADR 0029). An overlay's exit doesn't use them; it
   * transitions to `exit`'s values.
   */
  leave?: CssStep[]
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
    return {
      enter:
        at === 'to' && !Object.keys(last!).some(transient) ? steps.slice(0, -1) : steps,
      exit: {},
    }
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
    leave: steps,
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
  const keyframes = plan.enter ?? plan.leave
  if (keyframes)
    rules.push(
      `@media (prefers-reduced-motion: no-preference) {\n${block(
        `@keyframes greese-${kebabName}`,
        keyframes.map(([at, declarations]) =>
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

export const plans = new Map<string, CssPlan>()

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
