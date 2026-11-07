import { memo, useState, type PointerEvent, type JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectMarkers, selectMarkerSelection } from '../../../state/selectors.ts'
import type { MarkerInteractions } from '../useMarkerInteractions.ts'

export interface TimelineMarkersProps {
  frameWidth: number
  interactions: MarkerInteractions
}

/**
 * Timeline markers — each marker is ONE object spanning the whole frames
 * column, exactly like the {@link Playhead}: a ruler tab (sticky at the top)
 * over a full-height line, with an invisible full-height hit strip so the
 * entire line is grabbable. Press selects (⌘/Ctrl/Shift toggles under the
 * Marker tool) and drags the marker selection; hover shows the label. The
 * line sits at the frame's left edge (`frame * frameWidth`), matching
 * `useMarkerInteractions`' own floor-based pointer→frame math and
 * `TimelineCursor`'s snapped grid-line position — not centered on the frame.
 */
export const TimelineMarkers = memo(function TimelineMarkers({
  frameWidth,
  interactions,
}: TimelineMarkersProps): JSX.Element | null {
  const markers = useAuthoringSelector(selectMarkers)
  const selectedMarkers = useAuthoringSelector(selectMarkerSelection)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { dragPreview, onMarkerPointerDown } = interactions

  return (
    <>
      {markers.map((marker) => {
        const frame =
          dragPreview?.ids.has(marker.id) === true
            ? Math.max(0, marker.frame + dragPreview.delta)
            : marker.frame
        const selected = selectedMarkers.has(marker.id)
        const hovered = hoveredId === marker.id
        const onPointerDown = (event: PointerEvent<HTMLDivElement>) =>
          onMarkerPointerDown(event, marker.id, marker.frame)
        return (
          <div
            className={'greese-TimelineMarkers-marker'}
            key={marker.id}
            style={{ left: frame * frameWidth }}
          >
            <div
              className={'greese-TimelineMarkers-tab'}
              data-selected={selected ? 'true' : undefined}
              data-hovered={hovered ? 'true' : undefined}
              onPointerDown={onPointerDown}
              onPointerEnter={() => setHoveredId(marker.id)}
              onPointerLeave={() => setHoveredId((id) => (id === marker.id ? null : id))}
            />
            <div
              className={'greese-TimelineMarkers-line'}
              data-selected={selected ? 'true' : undefined}
              data-hovered={hovered ? 'true' : undefined}
            />
            <div
              className={'greese-TimelineMarkers-hitStrip'}
              onPointerDown={onPointerDown}
              onPointerEnter={() => setHoveredId(marker.id)}
              onPointerLeave={() => setHoveredId((id) => (id === marker.id ? null : id))}
            />
            {hovered && (
              <div className={'greese-TimelineMarkers-label'}>
                {marker.label ?? `Marker ${marker.frame}`}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
})
