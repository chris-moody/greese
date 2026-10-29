import { cloneElement, createElement, type CSSProperties, type ReactElement } from 'react'
import type { Ease, Keyframes, Timeline } from '@greese/js'
import { GreeseIsland } from '../components/Motion/GreeseIsland.tsx'
import { effectClass, entranceNames, exitNames } from '@greese/ui/effect-classes'
import type { BuiltInEffect } from '@greese/ui/effects'
import { cx } from './cx.ts'
import { cssEase } from './ease.ts'

export { cssEase } from './ease.ts'

/** Text effects, for elements whose content is plain text. */
export type GreeseTextEffect = 'type' | 'count' | 'split'

/**
 * Names of effects added with `defineGreeseEffect()`. Augment it so they
 * type-check and autocomplete:
 *
 * ```ts
 * declare module '@greese/react' {
 *   interface GreeseEffectRegistry { wobble: true }
 * }
 * ```
 */
export interface GreeseEffectRegistry {}

/** Any effect by name: built in, or defined with `defineGreeseEffect()`. */
export type GreeseEffectName = BuiltInEffect | Extract<keyof GreeseEffectRegistry, string>

/**
 * Effects composed in one string: `+` plays effects together, `,` separates
 * groups that play in turn, and a number is a pause in seconds. A negative
 * number pulls the next group back that many seconds, so it overlaps the one
 * before. `'fadeIn+scaleIn,+2,fadeOut'` fades and scales in, waits 2 s, fades
 * out; `'slideUp,-0.2,pop'` starts the pop 0.2 s before the slide ends.
 *
 * An effect takes arguments in parentheses: its own parameters (`start`, `end`
 * for most, in order or by name) and the timing keys `duration`, `offset` and
 * `ease`, so `'fadeIn(0.25, 0.8)'`, `'fadeIn({ end: 0.8, duration: 1 })'` and
 * `'fadeUp(2rem)+scaleIn(offset: 0.2)'` only change what they name.
 */
export type GreeseSequence =
  `${string},${string}` | `${string}+${string}` | `${string}(${string})`

/**
 * An effect, a sequence, keyframes, or `'theme'`: whatever entrance the theme
 * assigns (`--greese-motion-theme`; `fadeUp` in the base theme). A named
 * effect is that effect in every theme; `'theme'` follows the theme.
 */
export type GreeseMotion = GreeseEffectName | 'theme' | GreeseSequence | Keyframes

/** How a parent sets when the entrances inside it start. */
export interface GreeseScope {
  /** Seconds between neighbouring members, in document order. @default 0.08 */
  stagger?: number
  /** Seconds before the first member starts. @default 0 */
  delay?: number
  /** Hold the members until the scope scrolls into view (they play at once when it already is). */
  inView?: boolean
  /**
   * Change it to play the scope's entrances again, in place and without
   * remounting anything: a counter, say, that a Replay button bumps.
   */
  replay?: number | string
}

export interface GreeseOptions {
  /**
   * Plays when the element appears. A preset alone is pure CSS; custom
   * effects, sequences and keyframes use greese.js.
   */
  enter?: GreeseMotion
  /** Plays when the element scrolls into view (elements already in view stay as they are). */
  inView?: GreeseMotion
  /** `inView` only plays the first time. @default true */
  once?: boolean
  /**
   * How an overlay (Dialog, Popover, Menu, Tooltip) leaves: it fades, and
   * moves and scales to where the effect ends (`fadeOutUp`, `scaleOut`…). Pure CSS.
   */
  exit?: GreeseEffectName
  /** Plays while hovered (fine pointers only), reverses on leave. */
  hover?: GreeseMotion
  /** Plays while pressed, reverses on release. */
  press?: GreeseMotion
  /** Plays while focus is inside, reverses on blur. */
  focus?: GreeseMotion
  /** Animates plain-text content on enter (or on reveal, with `inView`). */
  text?: GreeseTextEffect
  /**
   * Seconds, for each effect. Overrides an effect's own duration. Defaults:
   * 0.5 for entrances, 0.2 for interactions.
   */
  duration?: number
  /** Seconds before the entrance starts. */
  delay?: number
  /** Any greese.js ease. CSS-expressible ones keep presets JavaScript-free. */
  ease?: Ease
  /** How far `fadeUp`/`fadeDown`/`fadeStart`/`fadeEnd` (and `fadeOutUp`/`fadeOutDown`) travel. @default '1rem' */
  distance?: string
  /** Animates the children instead, each `stagger` seconds after the previous. */
  stagger?: number
  /**
   * Makes this element a scope: every entrance (`enter`) inside it, at any
   * depth, starts in document order, `stagger` seconds apart, after `delay`.
   * `true` takes the defaults. A scope inside a scope takes one position in the
   * outer one, and its own members follow it. Client components only: the
   * start times are set after the page renders, and without JavaScript the
   * entrances simply play together. See `GreeseScope`.
   */
  scope?: boolean | GreeseScope
  /**
   * Full control: fill a paused greese.js timeline for this element. It plays
   * on enter, or on reveal with `inView`. Client components only: a function
   * can't cross from a Server Component.
   */
  timeline?: (tl: Timeline, el: HTMLElement) => void
}

/**
 * Motion for a component: an effect or sequence played on enter (`'fadeUp'`,
 * `'fadeIn+scaleIn,+2,fadeOut'`) or {@link GreeseOptions}. Respects
 * `prefers-reduced-motion`.
 */
export type GreeseProp = GreeseEffectName | GreeseSequence | GreeseOptions

/** Every greese ui component that renders something visible accepts `greese`. */
export interface GreeseProps {
  /** Motion: entrances, scroll reveals, interactions, text effects, timelines. */
  greese?: GreeseProp
}

/** A CSS preset alone, under a CSS ease: its kebab-case name, else undefined. */
const cssPreset = (motion: GreeseMotion | undefined, css: string | undefined) =>
  css &&
  typeof motion === 'string' &&
  (motion === 'theme' || (entranceNames as readonly string[]).includes(motion))
    ? effectClass(motion)
    : undefined

/** A bare effect or sequence is shorthand for `{ enter }`. */
export const normalizeGreese = (prop: GreeseProp): GreeseOptions =>
  typeof prop === 'string' ? { enter: prop } : prop

/**
 * Whether the prop needs the JavaScript runtime: anything beyond a CSS
 * entrance preset played alone. An overlay exit is CSS for the built-in
 * effects; any other (one from `defineGreeseEffect()`) has the runtime set
 * what it changes on the element.
 */
export const needsRuntime = (o: GreeseOptions): boolean =>
  !!(o.inView || o.hover || o.press || o.focus || o.text || o.timeline) ||
  (o.enter !== undefined && !cssPreset(o.enter, cssEase(o.ease))) ||
  (o.exit !== undefined && !(exitNames as readonly string[]).includes(o.exit))

export interface ResolvedGreese {
  className?: string
  style?: CSSProperties
  /** True when the client runtime (GreeseIsland) must attach. */
  runtime: boolean
}

/**
 * Resolves the `greese` prop to classes and inline custom properties: the
 * CSS presets need nothing else. Pure, so it runs in Server Components.
 */
export const resolveGreese = (prop: GreeseProp | undefined): ResolvedGreese => {
  if (!prop) return { runtime: false }
  const o = normalizeGreese(prop)
  const css = cssEase(o.ease)
  const vars: Array<[string, string | number | undefined]> = [
    ['duration', o.duration !== undefined ? `${o.duration}s` : undefined],
    ['delay', o.delay !== undefined ? `${o.delay}s` : undefined],
    ['distance', o.distance],
    ['stagger', o.stagger !== undefined ? `${o.stagger}s` : undefined],
    ['ease', o.ease !== undefined ? css : undefined],
  ]
  const style: Record<string, string> = {}
  for (const [name, value] of vars)
    if (value !== undefined) style[`--greese-motion-${name}`] = String(value)
  const enter = cssPreset(o.enter, css)
  const view = cssPreset(o.inView, css)
  const className = cx(
    (enter || view || o.exit || o.stagger !== undefined || o.scope) && 'greese-Motion',
    o.scope && 'greese-Motion--scope',
    enter && `greese-Motion--enter greese-Motion--enter-${enter}`,
    view && `greese-Motion--view greese-Motion--view-${view}`,
    o.exit && `greese-Motion--exit-${effectClass(o.exit)}`,
    o.stagger !== undefined && 'greese-Motion--stagger'
  )
  return {
    className: className || undefined,
    style: Object.keys(style).length ? (style as CSSProperties) : undefined,
    runtime: needsRuntime(o),
  }
}

/**
 * Applies the `greese` prop to a component's root element: merges classes
 * and variables, and attaches the client runtime only when the prop needs
 * it. Without a prop it returns the element untouched, at no cost.
 */
export const withGreese = (
  element: ReactElement,
  greese: GreeseProp | undefined
): ReactElement => {
  if (!greese) return element
  const options = normalizeGreese(greese)
  const { className, style, runtime } = resolveGreese(options)
  const props = element.props as { className?: string; style?: CSSProperties }
  const styled =
    className || style
      ? cloneElement(element, {
          className: cx(props.className, className),
          style: style ? { ...style, ...props.style } : props.style,
        } as Partial<typeof props>)
      : element
  return runtime || options.scope
    ? createElement(GreeseIsland, { options, runtime }, styled)
    : styled
}
