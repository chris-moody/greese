'use client'
import { useCallback, useState, type PointerEvent, type JSX } from 'react'
import {
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { beginPointerDrag } from '../../../core/pointerDrag.ts'
import { timelineActions } from '../../../state/timeline.slice.ts'
import { selectMarkers } from '../../../state/selectors.ts'
import type { AuthoringRootState } from '../../../state/createAuthoringStore.ts'
import type { MarkerInteractions } from '../useMarkerInteractions.ts'
import type { MarqueeBox } from '../useFrameInteractions.ts'

const DRAG_THRESHOLD = 4 // px before a press becomes a marquee

export interface MarkerToolOverlayProps {
  width: number
  frameWidth: number
  interactions: MarkerInteractions
}

/**
 * Marker-tool input surface over the frame rows (the ruler handles its own
 * double-click). Mirrors the Frame tool's grid gestures, but for markers:
 * press-drag marquee-selects markers by horizontal overlap (Shift adds,
 * ⌘/Ctrl subtracts), a plain press clears the marker selection, and
 * double-click adds a marker at the clicked frame.
 */
export const MarkerToolOverlay = ({
  width,
  frameWidth,
  interactions,
}: MarkerToolOverlayProps): JSX.Element => {
  const { store } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const markers = useAuthoringSelector(selectMarkers)
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null)

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      const surface = event.currentTarget as HTMLElement
      const rect = surface.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      const additive = event.shiftKey
      const subtractive = event.metaKey || event.ctrlKey
      const base = new Set(
        (store.getState() as AuthoringRootState).timeline.selectedMarkers
      )

      beginPointerDrag(event, {
        threshold: DRAG_THRESHOLD,
        onMove: (e) => {
          const box: MarqueeBox = {
            left: Math.min(startX, e.clientX) - rect.left,
            top: Math.min(startY, e.clientY) - rect.top,
            width: Math.abs(e.clientX - startX),
            height: Math.abs(e.clientY - startY),
          }
          setMarquee(box)
          const x1 = box.left + box.width
          const hits = markers
            .filter((m) => {
              // Matches `TimelineMarkers`' actual rendered line position
              // (the frame's left edge, not its center — see that file's
              // doc comment).
              const cx = m.frame * frameWidth
              return cx >= box.left && cx <= x1
            })
            .map((m) => m.id)
          const next = additive || subtractive ? new Set(base) : new Set<string>()
          if (subtractive) hits.forEach((id) => next.delete(id))
          else hits.forEach((id) => next.add(id))
          dispatch(timelineActions.setMarkerSelection([...next]))
        },
        onEnd: (_e, _d, didDrag) => {
          setMarquee(null)
          if (didDrag) return
          // A plain press clears the marker selection (Shift/⌘ presses leave it).
          if (!additive && !subtractive) dispatch(timelineActions.clearMarkerSelection())
        },
      })
    },
    [store, dispatch, markers, frameWidth]
  )

  return (
    <div
      className={'greese-TimelineMarkers-toolBackdrop'}
      style={{ width }}
      onPointerDown={onPointerDown}
      onDoubleClick={interactions.onSurfaceDoubleClick}
    >
      {marquee && (
        <div
          className={'greese-TimelineFrames-marqueeRect'}
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
    </div>
  )
}
