import type { Ease, Keyframes } from '@greese-ui/greese'
import type { GreeseEffectRegistry } from '../../utils/greese.ts'

/** What an effect defined as a function is told about the element it animates. */
export interface GreeseEffectContext {
  /** The element (or, with `stagger`, the child) being animated. */
  el: Element
  /** The `distance` option. @default '1rem' */
  distance: string
  /** Whether the element is laid out right to left. */
  rtl: boolean
}

/** Keyframes, or a function returning them for the element in hand. */
export type GreeseEffectKeyframes = Keyframes | ((ctx: GreeseEffectContext) => Keyframes)

/** Keyframes with their own default `duration` and `ease`; a `greese` prop's options still win. */
export interface GreeseEffectWithDefaults {
  keyframes: GreeseEffectKeyframes
  /** Seconds. */
  duration?: number
  ease?: Ease
}

/** An effect: keyframes, a function returning them, or keyframes with defaults. */
export type GreeseEffect = GreeseEffectKeyframes | GreeseEffectWithDefaults

// Lives outside the lazy runtime so defining an effect never loads greese.js;
// the runtime chunk shares this module and reads it when it attaches.
const effects = new Map<string, GreeseEffect>()

/**
 * Names an effect for the `greese` prop. It can then be played anywhere an
 * effect can (`enter`, `inView`, `hover`, `press`, `focus`) and composed in
 * sequences. Call it in client code that runs before the element mounts,
 * such as your app's entry. Built-in names can't be redefined.
 *
 * ```ts
 * defineGreeseEffect('wobble', {
 *   keyframes: { rotate: [0, -6, 6, -3, 0] },
 *   duration: 0.6,
 * })
 * <Card greese="fadeIn,wobble" />
 * ```
 */
export const defineGreeseEffect = (
  name: Extract<keyof GreeseEffectRegistry, string> | (string & {}),
  effect: GreeseEffect
): void => {
  effects.set(name, effect)
}

/** A defined effect, for the runtime. */
export const definedEffect = (name: string): GreeseEffect | undefined => effects.get(name)
