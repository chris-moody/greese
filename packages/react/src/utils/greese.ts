import { cloneElement, createElement, type CSSProperties, type ReactElement } from 'react'
import type { Ease, Keyframes, Timeline } from '@greese/js'
import { GreeseIsland } from '../components/Motion/GreeseIsland.tsx'
import type { BuiltInEffect } from '../components/Motion/greeseRuntime.ts'
import { cx } from './cx.ts'

/** Entrance presets: pure CSS when played alone, no JavaScript. */
export type GreesePreset =
  | 'fadeIn'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeStart'
  | 'fadeEnd'
  | 'scaleIn'
  | 'blurIn'
  | 'slideUp'
  | 'pop'

/** Leaving effects. Overlays (Dialog, Popover, Menu, Tooltip) also play these as `exit`, in CSS. */
export type GreeseExit = 'fadeOut' | 'fadeOutUp' | 'fadeOutDown' | 'scaleOut'

/** Interaction presets for `hover`, `press` and `focus`. */
export type GreeseInteraction = 'lift' | 'squish' | 'tilt' | 'glow'

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
 * groups that play in turn, and a number is a pause in seconds.
 * `'fadeIn+scaleIn,+2,fadeOut'` fades and scales in, waits 2 s, fades out.
 */
export type GreeseSequence = `${string},${string}` | `${string}+${string}`

/** What a motion option plays: an effect, a sequence of effects, or greese.js keyframes. */
export type GreeseMotion = GreeseEffectName | GreeseSequence | Keyframes

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
  /** How an overlay leaves (Dialog, Popover, Menu, Tooltip). Pure CSS. */
  exit?: GreeseExit
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

/** Every GreeseUI component that renders something visible accepts `greese`. */
export interface GreeseProps {
  /** Motion: entrances, scroll reveals, interactions, text effects, timelines. */
  greese?: GreeseProp
}

/** Presets CSS plays alone; anything else named is a job for the runtime. */
const CSS_PRESETS = /^(fade(In|Up|Down|Start|End)|scaleIn|blurIn|slideUp|pop)$/

/** The class-name form of an effect name: `fadeUp` → `fade-up`. */
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** A CSS preset alone, under a CSS ease: its kebab-case name, else undefined. */
const cssPreset = (motion: GreeseMotion | undefined, css: string | undefined) =>
  css && typeof motion === 'string' && CSS_PRESETS.test(motion)
    ? kebab(motion)
    : undefined

/** Eases CSS can play: named ones resolve to `--greese-ease-*` (Motion.scss). */
const NAMED_EASES = /^(linear|ease|ease-in|ease-out|ease-in-out|in|out|inOut)$/

/** The CSS form of an ease, or undefined when only greese.js can play it. */
export const cssEase = (ease: Ease | undefined): string | undefined => {
  if (ease === undefined) return 'var(--greese-ease-out)'
  if (typeof ease === 'string')
    return NAMED_EASES.test(ease)
      ? `var(--greese-ease-${ease.replace('O', '-o')})`
      : undefined
  if (Array.isArray(ease)) return `cubic-bezier(${ease.join(', ')})`
  return undefined
}

/** A bare effect or sequence is shorthand for `{ enter }`. */
export const normalizeGreese = (prop: GreeseProp): GreeseOptions =>
  typeof prop === 'string' ? { enter: prop } : prop

/**
 * Whether the prop needs the JavaScript runtime: anything beyond a CSS
 * entrance preset played alone, and overlay exits.
 */
export const needsRuntime = (o: GreeseOptions): boolean =>
  !!(o.inView || o.hover || o.press || o.focus || o.text || o.timeline) ||
  (o.enter !== undefined && !cssPreset(o.enter, cssEase(o.ease)))

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
    (enter || view || o.exit || o.stagger !== undefined) && 'greese-Motion',
    enter && `greese-Motion--enter greese-Motion--enter-${enter}`,
    view && `greese-Motion--view greese-Motion--view-${view}`,
    o.exit && `greese-Motion--exit-${kebab(o.exit)}`,
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
  return runtime ? createElement(GreeseIsland, { options }, styled) : styled
}
