import { cloneElement, createElement, type CSSProperties, type ReactElement } from 'react'
import type { Ease, Keyframes, Timeline } from '@greese-ui/greese'
import { GreeseIsland } from '../components/Motion/GreeseIsland.tsx'
import { cx } from './cx.ts'

/** Entrance presets: pure CSS, no JavaScript. */
export type GreesePreset =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'fade-start'
  | 'fade-end'
  | 'scale-in'
  | 'blur-in'
  | 'slide-up'
  | 'pop'

/** Exit presets, for overlays (Dialog, Popover, Menu, Tooltip). */
export type GreeseExit = 'fade' | 'fade-down' | 'fade-up' | 'scale-out'

/** Interaction presets for `hover`, `press` and `focus`. */
export type GreeseInteraction = 'lift' | 'squish' | 'tilt' | 'glow'

/** Text effects, for elements whose content is plain text. */
export type GreeseTextEffect = 'type' | 'count' | 'split'

export interface GreeseOptions {
  /** Plays when the element appears. A preset is pure CSS; keyframes use greese.js. */
  enter?: GreesePreset | Keyframes
  /** Plays when the element scrolls into view (elements already in view stay as they are). */
  inView?: GreesePreset | Keyframes
  /** `inView` only plays the first time. @default true */
  once?: boolean
  /** How an overlay leaves (Dialog, Popover, Menu, Tooltip). Pure CSS. */
  exit?: GreeseExit
  /** Plays while hovered (fine pointers only), reverses on leave. */
  hover?: GreeseInteraction | Keyframes
  /** Plays while pressed, reverses on release. */
  press?: GreeseInteraction | Keyframes
  /** Plays while focus is inside, reverses on blur. */
  focus?: GreeseInteraction | Keyframes
  /** Animates plain-text content on enter (or on reveal, with `inView`). */
  text?: GreeseTextEffect
  /** Seconds. Defaults: 0.5 for entrances, 0.2 for interactions. */
  duration?: number
  /** Seconds before the entrance starts. */
  delay?: number
  /** Any greese.js ease. CSS-expressible ones keep presets JavaScript-free. */
  ease?: Ease
  /** How far `fade-up`/`fade-down`/`fade-start`/`fade-end` travel. @default '1rem' */
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
 * Motion for a component: a preset name (`'fade-up'`, played on enter) or
 * {@link GreeseOptions}. Respects `prefers-reduced-motion`.
 */
export type GreeseProp = GreesePreset | GreeseOptions

/** Every GreeseUI component that renders something visible accepts `greese`. */
export interface GreeseProps {
  /** Motion: entrances, scroll reveals, interactions, text effects, timelines. */
  greese?: GreeseProp
}

/** Eases CSS can play: named ones resolve to `--greese-ease-*` (Motion.scss). */
const NAMED_EASES = /^(linear|ease|ease-in|ease-out|ease-in-out|in|out|inOut)$/

/** The CSS form of an ease, or undefined when only greese.js can play it. */
export const cssEase = (ease: Ease | undefined): string | undefined => {
  if (ease === undefined) return 'var(--greese-ease-out)'
  if (typeof ease === 'string')
    return NAMED_EASES.test(ease) ? `var(--greese-ease-${ease.replace('O', '-o')})` : undefined
  if (Array.isArray(ease)) return `cubic-bezier(${ease.join(', ')})`
  return undefined
}

const normalize = (prop: GreeseProp): GreeseOptions =>
  typeof prop === 'string' ? { enter: prop } : prop

/**
 * Whether the prop needs the JavaScript runtime: anything beyond CSS
 * entrance presets and overlay exits.
 */
export const needsRuntime = (o: GreeseOptions): boolean =>
  !!(o.inView || o.hover || o.press || o.focus || o.text || o.timeline) ||
  (o.enter !== undefined && (typeof o.enter !== 'string' || !cssEase(o.ease)))

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
  const o = normalize(prop)
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
  const enter = typeof o.enter === 'string' && css && o.enter
  const view = typeof o.inView === 'string' && css && o.inView
  const className = cx(
    (enter || view || o.exit || o.stagger !== undefined) && 'greese-Motion',
    enter && `greese-Motion--enter-${enter}`,
    view && `greese-Motion--view-${view}`,
    o.exit && `greese-Motion--exit-${o.exit}`,
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
  const { className, style, runtime } = resolveGreese(greese)
  const props = element.props as { className?: string; style?: CSSProperties }
  const styled =
    className || style
      ? cloneElement(element, {
          className: cx(props.className, className),
          style: style ? { ...style, ...props.style } : props.style,
        } as Partial<typeof props>)
      : element
  return runtime ? createElement(GreeseIsland, { greese }, styled) : styled
}
