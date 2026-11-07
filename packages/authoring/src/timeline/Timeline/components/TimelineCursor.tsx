'use client'
import { useEffect, useRef, type JSX } from 'react'
import type { TimelineResolution } from '../../../core/types/resolution.types.ts'
import { snapTick } from '../snap.ts'

export interface TimelineCursorProps {
  /** The frames body element to track pointer position over. */
  bodyRef: React.RefObject<HTMLElement | null>
  pixelsPerTick: number
  resolution: TimelineResolution
  /** Hide while a drag interaction (marquee/drag/resize/spanDraft) is active. */
  hidden: boolean
  /**
   * Freeze in place while the context menu is open: stop tracking the
   * pointer and ignore pointerleave (moving onto the menu's portal, which
   * sits outside the frames body, would otherwise fire pointerleave and hide
   * the line) so the cursor stays put at the tick it was at when the menu
   * opened, instead of disappearing.
   */
  frozen?: boolean
}

/**
 * A vertical line tracking the pointer over the frames area, snapped to the
 * nearest ruler tick. Fully inert: `pointer-events: none` and positioned
 * imperatively (a direct style write per pointermove, no React state), so it
 * can never interfere with clicks/drags on the elements beneath it.
 */
export const TimelineCursor = ({
  bodyRef,
  pixelsPerTick,
  resolution,
  hidden,
  frozen = false,
}: TimelineCursorProps): JSX.Element | null => {
  const lineRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ pixelsPerTick, resolution })
  stateRef.current = { pixelsPerTick, resolution }
  const frozenRef = useRef(frozen)
  frozenRef.current = frozen

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    const onMove = (event: PointerEvent) => {
      if (frozenRef.current) return
      const line = lineRef.current
      if (!line) return
      const { pixelsPerTick: ppt, resolution: res } = stateRef.current
      const rect = body.getBoundingClientRect()
      const rawTick = (event.clientX - rect.left) / ppt
      line.style.left = `${snapTick(rawTick, res, ppt) * ppt}px`
      line.style.display = 'block'
    }
    const onLeave = () => {
      if (frozenRef.current) return
      const line = lineRef.current
      if (line) line.style.display = 'none'
    }

    body.addEventListener('pointermove', onMove)
    body.addEventListener('pointerleave', onLeave)
    return () => {
      body.removeEventListener('pointermove', onMove)
      body.removeEventListener('pointerleave', onLeave)
    }
  }, [bodyRef])

  if (hidden) return null
  return (
    <div
      className={'greese-TimelineFrames-cursorLine'}
      ref={lineRef}
      style={{ display: 'none', pointerEvents: 'none' }}
    />
  )
}
