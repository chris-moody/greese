'use client'
import type { JSX } from 'react'
import { Button } from '@greese/react'
import { EditableField } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { timelineActions } from '../../state/timeline.slice.ts'
import { selectMarkers, selectMarkerSelection } from '../../state/selectors.ts'
import { useTimelineResolution } from '../../timeline/useTimelineResolution.ts'
import { TimeDomain } from '../../core/types/resolution.types.ts'
import { EmptyState } from '../panelParts.tsx'
import { PanelBody } from '../panelParts.tsx'

/**
 * Marker panel — edits the selected marker's label and position (in the
 * shell's native frame-grid unit) and removes it. Mirrors `TweenPanel`'s
 * structure; single-marker-focused since a position field only means "move
 * this one marker here" (no batch/relative editing for a multi-selection).
 */
export const MarkerPanel = (): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const markers = useAuthoringSelector(selectMarkers)
  const selection = useAuthoringSelector(selectMarkerSelection)
  const resolution = useTimelineResolution()

  if (selection.size === 0) return <EmptyState>No marker selected</EmptyState>
  if (selection.size > 1)
    return <EmptyState>{selection.size} markers selected</EmptyState>

  const marker = markers.find((m) => selection.has(m.id))
  if (!marker) return <EmptyState>No marker selected</EmptyState>

  const positionUnit = resolution.domain === TimeDomain.Musical ? 'beat' : 'frame'

  return (
    <PanelBody>
      <EditableField
        type="text"
        label="Label"
        value={marker.label ?? ''}
        onValueChange={(value) =>
          dispatch(timelineActions.setMarkerLabel({ id: marker.id, label: value }))
        }
      />
      <EditableField
        type="number"
        label={`Position (${positionUnit})`}
        value={marker.frame}
        onValueChange={(v) =>
          v !== null &&
          ((value: number) =>
            dispatch(timelineActions.moveMarker({ id: marker.id, frame: value })))(v)
        }
      />
      <Button
        size="sm"
        tone="negative"
        onClick={() => dispatch(timelineActions.removeMarker(marker.id))}
      >
        Remove Marker
      </Button>
    </PanelBody>
  )
}
