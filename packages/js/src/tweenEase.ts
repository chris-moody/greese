import { ease, type Ease, type EaseFn } from './ease.ts'

/**
 * How `easeIn`, `easeOut` and `easeInOut` are drawn: quadratic (`power1`), as
 * rigs, sound and game code have always played them, or CSS's keyword curves
 * (`ease-in` …), as Pixels has.
 */
export type TweenKeywords = 'quad' | 'css'

export interface TweenEaseOptions {
  /** The control points of a `bezier` tween. @default [0.25, 0.1, 0.25, 1] (CSS `ease`) */
  bezier?: readonly [number, number, number, number]
  /** What the `easeIn`, `easeOut` and `easeInOut` names mean. @default 'quad' */
  keywords?: TweenKeywords
}

/*
 * An editor tween's names (authoring's TweenType, and what saved documents and
 * game code hold, older spellings included) as greese.js eases. `back` pulls
 * back at the start, and `elastic` and `bounce` settle at the end, as they
 * always have.
 */
const NAMES: Record<string, string> = {
  linear: 'linear',
  step: 'steps(1)',
  stepped: 'steps(1)',
  easeIn: 'power1.in',
  easeOut: 'power1.out',
  easeInOut: 'power1.inOut',
  easeInQuad: 'power1.in',
  easeOutQuad: 'power1.out',
  easeInOutQuad: 'power1.inOut',
  elastic: 'elastic.out',
  bounce: 'bounce.out',
  back: 'back.in',
}

const CSS: Record<string, string> = {
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
}

/**
 * A tween's type as a greese.js ease, for a timeline or for storing. Any
 * greese.js name passes through (`'power3.out'`), and anything unknown is
 * `linear`, as it always played: a saved document never stops loading over a
 * name.
 *
 * ```ts
 * tweenEaseName('back') // 'back.in'
 * tweenEaseName('easeIn', { keywords: 'css' }) // 'ease-in'
 * ```
 */
export const tweenEaseName = (
  type: string | undefined,
  { bezier, keywords }: TweenEaseOptions = {}
): Ease => {
  if (type === 'bezier') return bezier ?? [0.25, 0.1, 0.25, 1]
  const name = (keywords === 'css' && CSS[type!]) || NAMES[type!] || type
  if (name)
    try {
      ease(name)
      return name
    } catch {
      // Not a name greese.js knows either.
    }
  return 'linear'
}

/**
 * A tween's type as an easing function `(t: 0..1) => 0..1`.
 *
 * ```ts
 * const curve = tweenEase(tween.type, { bezier: tween.bezier })
 * ```
 */
export const tweenEase = (type: string | undefined, options?: TweenEaseOptions): EaseFn =>
  ease(tweenEaseName(type, options))
