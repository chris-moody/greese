'use client'
import { useEffect, useRef, useState, type DependencyList } from 'react'
import { timeline, type Timeline, type TimelineOptions } from '@greese-ui/greese'

/**
 * A greese.js timeline built after mount (so refs are set), rebuilt when
 * `deps` change, and killed on unmount, which restores what it animated.
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
  const latest = useRef(build)
  latest.current = build
  useEffect(() => {
    const t = timeline(options)
    latest.current(t)
    setTl(t)
    return () => {
      t.kill()
    }
  }, deps)
  return tl
}
