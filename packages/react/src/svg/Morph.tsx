'use client'
import { useLayoutEffect, useMemo, useRef, type JSX } from 'react'
import {
  morph,
  morphSequence,
  toPath,
  tween,
  type Ease,
  type PathInput,
  type Tween,
} from '@greese/svg'
import { composeRefs } from '../components/Slot/Slot.tsx'
import type { PathProps } from './Path.tsx'
import { varsStyle } from './vars.ts'

// `from` is an SVG animation attribute too; here it's a shape's index.
export interface MorphProps extends Omit<PathProps, 'd' | 'slice' | 'from'> {
  /** The shapes it morphs between: path data or `@greese/svg` shape specs. */
  shapes: readonly PathInput[]
  /** The shape it shows; change it and it morphs there. @default 0 */
  index?: number
  /**
   * The shape it morphs in from when it mounts, as an index into `shapes`.
   * It still renders `index`, so on the server, and under reduced motion, it
   * shows its final shape. Leave it out to appear at `index` with no morph.
   */
  from?: number
  /**
   * Controls the morph directly instead: 0 is the first shape,
   * `shapes.length - 1` the last, and fractions mix neighbours. Overrides
   * `index`, with no animation of its own (scrub it from a scroll position
   * or a timeline). Renders on the server.
   */
  progress?: number
  /** Seconds per morph. @default 0.6 */
  duration?: number
  /** `'linear'`, `'in'`, `'out'`, `'inOut'`, or a function. @default 'out' */
  ease?: Ease
  /**
   * Turns and reverses each target to the pairing whose points travel least,
   * so shapes don't twist on the way. @default true
   */
  align?: boolean
  /** Called when a morph to a new `index` finishes. */
  onFinish?: () => void
}

/**
 * A path that morphs between shapes: set `index` and it morphs to that
 * shape, from wherever it is (mid-morph included); or drive `progress`
 * yourself. Shapes with different points, and different numbers of parts,
 * are matched first. With `from`, it morphs in when it mounts. Jumps
 * straight there under reduced motion.
 *
 * ```tsx
 * <Morph shapes={[{ type: 'star', r: 40 }, { type: 'circle', r: 40 }]} index={on ? 1 : 0} fill="gold" />
 * ```
 */
export const Morph = ({
  shapes,
  index = 0,
  from,
  progress,
  duration = 0.6,
  ease = 'out',
  align = true,
  onFinish,
  vars,
  style,
  ref,
  ...props
}: MorphProps): JSX.Element => {
  const own = useRef<SVGPathElement>(null)
  // What's on screen now: where the next morph starts.
  const shown = useRef<string | null>(null)
  const running = useRef<Tween | null>(null)
  const finish = useRef(onFinish)
  finish.current = onFinish
  const sequence = useMemo(
    () => (progress === undefined ? null : morphSequence(shapes, { align })),
    // A new array with the same shapes shouldn't rebuild the matching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(shapes), align, progress === undefined]
  )
  const at = (i: number) =>
    shapes[Math.min(shapes.length - 1, Math.max(0, Math.round(i)))]
  const target = at(index)
  const targetD = target === undefined ? '' : toPath(target)
  const d = sequence ? sequence(progress!) : targetD

  useLayoutEffect(() => {
    const el = own.current
    // The first morph starts from `from`, if it's given.
    const first = shown.current === null && from !== undefined ? at(from) : undefined
    const start = shown.current ?? (first === undefined ? null : toPath(first))
    shown.current = targetD
    if (!el || sequence || start === null || start === targetD) return
    running.current?.cancel()
    const mixer = morph(start, targetD, { align })
    // React has already written the target: start from what was showing.
    el.setAttribute('d', mixer(0))
    running.current = tween(
      (t) => {
        const next = t >= 1 ? targetD : mixer(t)
        el.setAttribute('d', next)
        shown.current = next
      },
      { duration, ease, onComplete: () => finish.current?.() }
    )
    // `from` only matters on the first morph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetD, sequence])

  useLayoutEffect(() => () => running.current?.cancel(), [])

  return (
    <path d={d} {...props} style={varsStyle(vars, style)} ref={composeRefs(own, ref)} />
  )
}
