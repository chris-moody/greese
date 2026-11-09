'use client'
import { useEffect, useRef, useState, type JSX, type RefObject } from 'react'
import { panelBreakpointAt } from './panelBreakpoints.ts'

/** How long the bar stays once the panel stops changing size, in ms. */
const LINGER = 600

/**
 * Marks a resize gesture on `el` (a split, a floating panel) for its panels'
 * status bars: they show while it's set. Pass `false` to clear it.
 */
export const markResizing = (el: Element | null | undefined, on: boolean): void => {
  if (on) el?.setAttribute('data-resizing', '')
  else el?.removeAttribute('data-resizing')
}

/**
 * A panel's size while it's resized: width × height and the panel breakpoint
 * in effect, along the panel's foot. It renders only while a resize gesture
 * (`markResizing`) changes the panel's size, and a moment after; it slides
 * in and out on the theme's motion. Visual only: the divider being dragged
 * already announces its size.
 */
export const PanelStatusBar = ({
  target,
}: {
  /** The panel's body: the box the panel breakpoints measure. */
  target: RefObject<HTMLElement | null>
}): JSX.Element | null => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const el = target.current
    if (!el || typeof ResizeObserver === 'undefined') return
    // Leaves once the gesture is over; until then, looks again later.
    const check = () => {
      if (el.closest('[data-resizing]')) timer.current = setTimeout(check, LINGER)
      else setLeaving(true)
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || !el.closest('[data-resizing]')) return
      setSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      })
      setLeaving(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(check, LINGER)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer.current)
    }
  }, [target])

  // Gone once its exit has played; at once where motion is reduced to nothing.
  useEffect(() => {
    if (!leaving) return
    const done = setTimeout(() => {
      setSize(null)
      setLeaving(false)
    }, 400)
    return () => clearTimeout(done)
  }, [leaving])

  if (!size) return null
  return (
    <div
      className="greese-PanelGroup-status"
      aria-hidden="true"
      data-leaving={leaving ? '' : undefined}
      onTransitionEnd={(event) => {
        if (leaving && event.target === event.currentTarget) {
          setSize(null)
          setLeaving(false)
        }
      }}
    >
      <span>
        {size.width} × {size.height}
      </span>
      <span>{panelBreakpointAt(size.width)}</span>
    </div>
  )
}
