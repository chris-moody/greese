'use client'
import { useState, type DependencyList } from 'react'
import type { Timeline, TimelineOptions } from '@greese-ui/greese'
import { useGreese } from './useGreese.ts'

/**
 * A greese.js timeline built after mount (so refs are set) and before
 * paint, rebuilt when `deps` change, and killed on unmount, which restores
 * what it animated. For several animations, scoped selectors or animations
 * started in handlers, use {@link useGreese}.
 *
 * ```tsx
 * const box = useRef<HTMLDivElement>(null)
 * const tl = useTimeline((tl) => tl.to(box.current, { x: 120 }), [], { paused: true })
 * <Button onClick={() => tl?.play()}>Go</Button>
 * ```
 */
export const useTimeline = (
  build: (tl: Timeline) => void,
  deps: DependencyList = [],
  options?: TimelineOptions
): Timeline | undefined => {
  const [tl, setTl] = useState<Timeline>()
  useGreese(
    (g) => {
      const t = g.timeline(options)
      build(t)
      setTl(t)
    },
    { dependencies: deps, revertOnUpdate: true }
  )
  return tl
}
