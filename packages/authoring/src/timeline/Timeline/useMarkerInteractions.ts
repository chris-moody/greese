import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import {
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import {
  selectActiveTimelineScope,
  selectActiveTimelineTool,
  selectFrameCount,
  selectMarkers,
} from '../../state/selectors.ts'
import { TimelineToolId } from '../../state/timelineTools.slice.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'

/** Live preview of a marker drag — a shared frame delta applied to `ids` until drop. */
export interface MarkerDragPreview {
  ids: Set<string>
  delta: number
}

export interface MarkerInteractions {
  isMarkerTool: boolean
  dragPreview: MarkerDragPreview | null
  /** Double-click empty ruler/frames space adds a marker at that frame (Marker tool only). */
  onSurfaceDoubleClick: (event: MouseEvent<HTMLElement>) => void
  /**
   * Press a marker (tab or line): selects it (⌘/Ctrl/Shift toggles, Marker tool
   * only) and press-drag previews-then-commits a move of the whole marker
   * selection — active under both the Marker tool and the Frame tool (dragging
   * a marker out of the way is common while doing ordinary keyframe work).
   */
  onMarkerPointerDown: (
    event: PointerEvent<HTMLElement>,
    markerId: string,
    frame: number
  ) => void
}

/**
 * Marker pointer interactions — structurally mirrors `useFrameInteractions`.
 * `surfaceRef` is the frames body element, used to map pointer x → frame.
 */
export const useMarkerInteractions = (
  frameWidth: number,
  surfaceRef: RefObject<HTMLElement | null>
): MarkerInteractions => {
  const { store } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const activeTool = useAuthoringSelector(selectActiveTimelineTool)
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const isMarkerTool = activeTool === TimelineToolId.marker
  const isFrameTool = activeTool === TimelineToolId.frame
  const [dragPreview, setDragPreview] = useState<MarkerDragPreview | null>(null)

  const frameAt = useCallback(
    (clientX: number): number => {
      const rect = surfaceRef.current?.getBoundingClientRect()
      if (!rect) return 0
      return Math.max(0, Math.floor((clientX - rect.left) / frameWidth))
    },
    [surfaceRef, frameWidth]
  )

  const onSurfaceDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!isMarkerTool) return
      dispatch(timelineActions.addMarker({ scope, frame: frameAt(event.clientX) }))
    },
    [isMarkerTool, dispatch, frameAt, scope]
  )

  const onMarkerPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, markerId: string, frame: number) => {
      event.stopPropagation()
      if (event.button !== 0) return

      if (isMarkerTool) {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
          dispatch(timelineActions.toggleMarker(markerId))
        } else if (
          !(store.getState() as AuthoringRootState).timeline.selectedMarkers.has(markerId)
        ) {
          dispatch(timelineActions.setMarkerSelection([markerId]))
        }
      }

      if (!isMarkerTool && !isFrameTool) return
      const state = store.getState() as AuthoringRootState
      const count = selectFrameCount(state)

      // Drag the whole selection when the pressed marker is part of it (Marker
      // tool); otherwise just the pressed marker.
      const selected = state.timeline.selectedMarkers
      const ids =
        isMarkerTool && selected.has(markerId) ? new Set(selected) : new Set([markerId])
      const dragged = selectMarkers(state).filter((m) => ids.has(m.id))
      const minFrame = Math.min(...dragged.map((m) => m.frame))
      const maxFrame = Math.max(...dragged.map((m) => m.frame))

      let currentDelta = 0
      setDragPreview({ ids, delta: 0 })

      beginPointerDrag(event, {
        onMove: (e) => {
          const raw = frameAt(e.clientX) - frame
          // Clamp the shared delta so no dragged marker leaves [0, count - 1].
          currentDelta = Math.max(-minFrame, Math.min(count - 1 - maxFrame, raw))
          setDragPreview({ ids, delta: currentDelta })
        },
        onEnd: (_e, _d, didDrag) => {
          setDragPreview(null)
          if (didDrag && currentDelta !== 0) {
            dispatch(timelineActions.moveMarkers({ ids: [...ids], delta: currentDelta }))
          }
        },
      })
    },
    [isMarkerTool, isFrameTool, dispatch, store, frameAt]
  )

  // Memoized like useTimelineEditing's return — see useFrameInteractions for why
  // an unmemoized object literal here would defeat any memo(TimelineMarkers).
  return useMemo(
    () => ({ isMarkerTool, dragPreview, onSurfaceDoubleClick, onMarkerPointerDown }),
    [isMarkerTool, dragPreview, onSurfaceDoubleClick, onMarkerPointerDown]
  )
}
