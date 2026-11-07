import { ease as greeseEase, type Ease as GreeseEase } from '@greese/js'

/** An easing function: progress in, eased progress out. */
export type EaseFunction = (t: number) => number

/**
 * greese.js's eases: `'linear'`, `'in'`, `'out'` and `'inOut'` (cubic), any
 * other name it knows (`'back.out(2)'`, `'ease-in-out'`), bézier points, or
 * your own function. greese.js is the one place curves are defined.
 */
export type Ease = 'linear' | 'in' | 'out' | 'inOut' | GreeseEase

/** Resolves an `Ease` to its function. */
export const toEase = (ease: Ease = 'out'): EaseFunction => greeseEase(ease)

/** Timing for `tween` and the helpers built on it. Times are seconds. */
export interface TweenOptions {
  /** Seconds per play. @default 0.6 */
  duration?: number
  /** Seconds before it starts. @default 0 */
  delay?: number
  /** @default 'out' */
  ease?: Ease
  /** Plays again this many times; `-1` repeats forever. @default 0 */
  repeat?: number
  /** Every other repeat plays backwards. @default false */
  yoyo?: boolean
  /**
   * Under reduced motion (the system's, or `data-greese-motion="reduce"` on
   * the root), `'reduce'` skips straight to the
   * end (a looping tween stays at its start); `'ignore'` plays anyway.
   * @default 'reduce'
   */
  reducedMotion?: 'reduce' | 'ignore'
  /** Called when it finishes (not when it's cancelled). */
  onComplete?: () => void
}

/** A running tween. */
export interface Tween extends PromiseLike<void> {
  /** Stops it where it is. Its promise never resolves after this. */
  cancel(): void
}

// By the system, or by the app (`data-greese-motion="reduce"` on the root).
const prefersReduced = () =>
  (typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  (typeof document !== 'undefined' &&
    document.documentElement.closest("[data-greese-motion='reduce']") !== null)

const frame = (callback: (now: number) => void): number =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback)
    : (setTimeout(() => callback(performance.now()), 16) as unknown as number)

const cancelFrame = (id: number) =>
  typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id)

/**
 * Calls `update` once per frame with eased progress from 0 to 1. A minimal
 * driver for this package's helpers when nothing else animates the page; in
 * an app with greese.js, animate the controls with it instead.
 */
export const tween = (
  update: (progress: number) => void,
  options: TweenOptions = {}
): Tween => {
  const {
    duration = 0.6,
    delay = 0,
    repeat = 0,
    yoyo = false,
    reducedMotion = 'reduce',
    onComplete,
  } = options
  const ease = toEase(options.ease)
  const forever = repeat < 0 || repeat === Infinity
  let id = 0
  let cancelled = false
  let resolve!: () => void
  const done = new Promise<void>((r) => (resolve = r))
  const finish = (progress: number) => {
    update(progress)
    onComplete?.()
    resolve()
  }

  if (reducedMotion === 'reduce' && prefersReduced()) {
    finish(forever ? 0 : yoyo && repeat % 2 ? 0 : 1)
  } else if (duration <= 0 && !forever) {
    finish(yoyo && repeat % 2 ? 0 : 1)
  } else {
    let begin: number | undefined
    const tick = (now: number) => {
      if (cancelled) return
      begin ??= now
      const elapsed = (now - begin) / 1000 - delay
      if (elapsed < 0) {
        id = frame(tick)
        return
      }
      const length = Math.max(duration, 1e-6)
      const play = Math.floor(elapsed / length)
      if (!forever && play > repeat) {
        finish(ease(yoyo && repeat % 2 ? 0 : 1))
        return
      }
      const local = (elapsed - play * length) / length
      update(ease(yoyo && play % 2 ? 1 - local : local))
      id = frame(tick)
    }
    update(ease(0))
    id = frame(tick)
  }

  return {
    cancel() {
      cancelled = true
      cancelFrame(id)
    },
    then: (onFulfilled, onRejected) => done.then(onFulfilled, onRejected),
  }
}
