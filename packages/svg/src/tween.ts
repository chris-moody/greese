/** An easing function: progress in, eased progress out. */
export type EaseFunction = (t: number) => number

/** Built-in eases (cubic), or your own function. */
export type Ease = 'linear' | 'in' | 'out' | 'inOut' | EaseFunction

const EASES: Record<Exclude<Ease, EaseFunction>, EaseFunction> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
}

/** Resolves an `Ease` to its function. */
export const toEase = (ease: Ease = 'out'): EaseFunction =>
  typeof ease === 'function' ? ease : EASES[ease]

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
   * Under `prefers-reduced-motion: reduce`, `'reduce'` skips straight to the
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

const prefersReduced = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

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
