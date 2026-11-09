'use client'
import { useEffect, useRef, type RefObject } from 'react'
import { wheelGesture } from '../core/stage/viewportMath.ts'

export interface WheelZoomOptions {
  /** Whether the wheel zooms and pans. @default true */
  enabled?: boolean
  /** Zooms by `factor` (above 1 is in) about a point, in client coordinates. */
  onZoom: (factor: number, clientX: number, clientY: number) => void
  /** Pans the view by a wheel's travel, in screen pixels: what scrolling would move. */
  onPan: (dx: number, dy: number) => void
}

/**
 * The stage's wheel, as Pixels has it: a plain wheel zooms at the pointer,
 * a horizontal swipe or Shift pans (`wheelGesture`). The listener isn't
 * passive, so the page doesn't scroll as well. Every stage in the shell uses
 * it (`StageHost` does by default); `enabled: false` leaves the wheel to the
 * browser.
 *
 * ```ts
 * useWheelZoom(stageRef, { onZoom: zoomAbout, onPan: (dx, dy) => el.scrollBy(dx, dy) })
 * ```
 */
export const useWheelZoom = (
  ref: RefObject<HTMLElement | null>,
  { enabled = true, onZoom, onPan }: WheelZoomOptions
): void => {
  // The latest callbacks, without listening again on every render.
  const latest = useRef({ onZoom, onPan })
  useEffect(() => {
    latest.current = { onZoom, onPan }
  })
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const onWheel = (event: WheelEvent) => {
      const gesture = wheelGesture(event)
      if (!gesture) return
      event.preventDefault()
      if (gesture.kind === 'pan') latest.current.onPan(gesture.x, gesture.y)
      else latest.current.onZoom(gesture.factor, event.clientX, event.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ref, enabled])
}
