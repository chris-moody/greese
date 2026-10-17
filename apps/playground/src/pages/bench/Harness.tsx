import { useLayoutEffect, useRef, useState, type JSX, type ReactNode } from 'react'

export interface BenchResult {
  /** First Harness render to first paint: React render + style + layout. */
  renderToPaint: number
  /** Navigation start to first paint: also includes downloading and running JS. */
  navToPaint: number
  /** Toggle click to the next paint, measured in-page. */
  updates: number[]
  /** Longest interaction (Event Timing API), the basis of INP. */
  maxInteraction: number
  styleElements: number
}

declare global {
  interface Window {
    __bench?: BenchResult
  }
}

const afterPaint = (fn: () => void) => requestAnimationFrame(() => setTimeout(fn, 0))

let maxInteraction = 0
new PerformanceObserver((list) => {
  for (const e of list.getEntries() as PerformanceEventTiming[]) {
    if (e.interactionId) maxInteraction = Math.max(maxInteraction, e.duration)
  }
}).observe({
  type: 'event',
  buffered: true,
  durationThreshold: 16,
} as PerformanceObserverInit)

/** Times the first paint and each toggle of `dense` for whatever it renders. */
export const Harness = ({
  render,
}: {
  render: (dense: boolean) => ReactNode
}): JSX.Element => {
  const [dense, setDense] = useState(false)
  const renderStart = useRef(performance.now())
  const clickAt = useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    const start = clickAt.current
    afterPaint(() => {
      const now = performance.now()
      const result = (window.__bench ??= {
        renderToPaint: now - renderStart.current,
        navToPaint: now,
        updates: [],
        maxInteraction: 0,
        styleElements: 0,
      })
      if (start !== undefined) result.updates.push(now - start)
      result.maxInteraction = maxInteraction
      result.styleElements = document.querySelectorAll('style').length
    })
  }, [dense])

  return (
    <>
      <button
        type="button"
        data-testid="toggle"
        onClick={() => {
          clickAt.current = performance.now()
          setDense((d) => !d)
        }}
      >
        Toggle density
      </button>
      {render(dense)}
    </>
  )
}

/** 400 cards x 5 Stacks = 2,000 responsive Stacks. */
export const CARDS = Array.from({ length: 400 }, (_, i) => i)
