'use client'
import { useLayoutEffect, useRef, type JSX } from 'react'
import { mixSlices, strokeKeyframes, toPath, type Slice } from '@greese/svg'
import { composeRefs } from '../components/Slot/Slot.tsx'
import { sliceProps, type PathProps } from './Path.tsx'

// `from` and `to` are SVG animation attributes too; here they're slices.
export interface DrawPathProps extends Omit<PathProps, 'slice' | 'from' | 'to'> {
  /** The slice it starts from when it first appears. @default { end: 0 } (nothing drawn) */
  from?: Slice
  /**
   * The slice it draws to. Change it and the stroke moves on from wherever it
   * is: `{ end: 100 }` fills it in, `{ start: 100, end: 100 }` drains it.
   * @default { end: 100 } (the whole stroke)
   */
  to?: Slice
  /** Seconds per play. @default 0.8 */
  duration?: number
  /** Seconds before it starts. @default 0 */
  delay?: number
  /** A CSS easing. @default 'ease-out' */
  easing?: string
  /** Plays again this many times; `-1` repeats forever. @default 0 */
  repeat?: number
  /** Every other repeat plays backwards. @default false */
  alternate?: boolean
  /** Holds it where it is. @default false */
  paused?: boolean
  /** Called when a play reaches its `to` slice. */
  onFinish?: () => void
}

const reduced = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A path whose stroke draws itself: on mount from `from` to `to`, and on to
 * each new `to` after that. It renders at `to`, so without JavaScript, and
 * under reduced motion, the stroke simply shows its final state. Runs on Web
 * Animations with `pathLength="100"`: nothing is measured.
 *
 * ```tsx
 * <DrawPath d={signature} to={{ end: 100 }} duration={1.5} stroke="currentColor" fill="none" />
 * ```
 */
export const DrawPath = ({
  d,
  from = { end: 0 },
  to = { end: 100 },
  duration = 0.8,
  delay = 0,
  easing = 'ease-out',
  repeat = 0,
  alternate = false,
  paused = false,
  onFinish,
  style,
  ref,
  ...props
}: DrawPathProps): JSX.Element => {
  const own = useRef<SVGPathElement>(null)
  const state = useRef<{ animation?: Animation; from: Slice; to: Slice } | null>(null)
  const finish = useRef(onFinish)
  finish.current = onFinish
  const key = JSON.stringify(to)

  // Starts a play whenever the target changes; reading `to` through the key
  // keeps a new object with the same slice from restarting it.
  useLayoutEffect(() => {
    const el = own.current
    const target = JSON.parse(key) as Slice
    if (!el || typeof el.animate !== 'function') return
    const previous = state.current
    let start = from
    if (previous) {
      // Carry on from where a running play is now, not from its start.
      const progress = previous.animation?.effect?.getComputedTiming().progress
      start =
        previous.animation?.playState === 'running' && typeof progress === 'number'
          ? mixSlices(previous.from, previous.to, progress)
          : previous.to
    }
    previous?.animation?.cancel()
    state.current = { from: start, to: target }
    if (reduced()) return
    const animation = el.animate(
      strokeKeyframes(start, target) as unknown as Keyframe[],
      {
        duration: duration * 1000,
        delay: delay * 1000,
        easing,
        iterations: repeat < 0 ? Infinity : repeat + 1,
        direction: alternate ? 'alternate' : 'normal',
        // Before the delay ends it shows `from`; after, the inline `to` styles hold.
        fill: 'backwards',
      }
    )
    animation.onfinish = () => finish.current?.()
    state.current.animation = animation
    // `from` only matters on the first play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration, delay, easing, repeat, alternate])

  useLayoutEffect(() => {
    const animation = state.current?.animation
    if (paused) animation?.pause()
    else if (animation?.playState === 'paused') animation.play()
  }, [paused, key])

  useLayoutEffect(() => () => state.current?.animation?.cancel(), [])

  return (
    <path
      d={toPath(d)}
      {...props}
      ref={composeRefs(own, ref)}
      {...sliceProps(to, style)}
    />
  )
}
