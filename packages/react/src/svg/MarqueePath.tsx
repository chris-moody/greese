'use client'
import { useLayoutEffect, useRef, type JSX } from 'react'
import { toPath } from '@greese/svg'
import { composeRefs } from '../components/Slot/Slot.tsx'
import type { PathProps } from './Path.tsx'
import { prefersReducedMotion } from '../utils/motion.ts'
import { varsStyle } from './vars.ts'

export interface MarqueePathProps extends Omit<PathProps, 'slice'> {
  /** Dashes, evenly spaced along the path. @default 1 */
  count?: number
  /** Each dash's length, in percent of the path's length. @default 10 */
  size?: number
  /** Seconds for a dash to reach where the next one started. @default 2 */
  duration?: number
  /** Runs backwards along the path. @default false */
  reverse?: boolean
  /** Holds the dashes where they are. @default false */
  paused?: boolean
}

/**
 * Dashes that run along a path without end, like a marquee's lights. The
 * dash pattern divides the path exactly (`pathLength="100"`), so the loop is
 * seamless on a closed path. Still under reduced motion.
 *
 * ```tsx
 * <MarqueePath d={{ type: 'rect', width: 200, height: 80, rx: 12 }} count={6} size={6} stroke="currentColor" fill="none" />
 * ```
 */
export const MarqueePath = ({
  d,
  count = 1,
  size = 10,
  duration = 2,
  reverse = false,
  paused = false,
  vars,
  style,
  ref,
  ...props
}: MarqueePathProps): JSX.Element => {
  const own = useRef<SVGPathElement>(null)
  const animation = useRef<Animation | null>(null)
  const lap = 100 / Math.max(1, Math.floor(count))
  const dash = Math.min(Math.max(0, size), lap)

  useLayoutEffect(() => {
    const el = own.current
    if (
      !el ||
      typeof el.animate !== 'function' ||
      prefersReducedMotion(el) ||
      dash >= lap
    )
      return
    const shift = reverse ? lap : -lap
    animation.current = el.animate(
      [{ strokeDashoffset: '0' }, { strokeDashoffset: String(shift) }],
      { duration: duration * 1000, iterations: Infinity, easing: 'linear' }
    )
    return () => animation.current?.cancel()
  }, [lap, dash, duration, reverse])

  useLayoutEffect(() => {
    if (paused) animation.current?.pause()
    else if (animation.current?.playState === 'paused') animation.current.play()
  }, [paused, lap, dash, duration, reverse])

  return (
    <path
      d={toPath(d)}
      {...props}
      ref={composeRefs(own, ref)}
      pathLength={100}
      // One dash and its gap per lap: the pattern tiles the path exactly.
      style={{
        ...varsStyle(vars),
        strokeDasharray: `${dash} ${lap - dash}`,
        strokeDashoffset: 0,
        ...style,
      }}
    />
  )
}
