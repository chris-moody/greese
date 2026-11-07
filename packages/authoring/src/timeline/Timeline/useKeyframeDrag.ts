import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { layersActions } from '../../state/layers.slice.ts'
import { playbackActions } from '../../state/playback.slice.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import { coalesce } from '../../state/commandsMiddleware.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import { collectSnapTargets, snapFrame } from './snap.ts'

/** Active keyframe move: a preview delta (frames) applied visually until drop. */
export interface KeyframeDrag {
  delta: number
}

interface SelectedKeyframe {
  layerId: string
  frame: number
}

const gatherSelected = (state: AuthoringRootState): SelectedKeyframe[] => {
  const selection = state.timeline.selection
  const rows: SelectedKeyframe[] = []
  state.layers.layers.forEach((layer) =>
    layer.timeline.frames.forEach((frame) => {
      if (selection.has(frame.id)) rows.push({ layerId: layer.id, frame: frame.frame })
    })
  )
  return rows
}

export interface KeyframeDragApi {
  drag: KeyframeDrag | null
  onKeyframePointerDown: (
    event: PointerEvent<HTMLElement>,
    layerId: string,
    frameId: string,
    frame: number
  ) => void
}

/**
 * Press a keyframe → select it (⌘ toggles, Shift ranges within the layer); drag →
 * move the whole selection. The move is a *visual preview* until drop, so passing
 * over other keyframes never erases them — only the final drop overwrites.
 */
export const useKeyframeDrag = (
  frameWidth: number,
  isFrameTool: boolean
): KeyframeDragApi => {
  const { store } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const [drag, setDrag] = useState<KeyframeDrag | null>(null)
  const anchorRef = useRef<{ layerId: string; frame: number } | null>(null)

  const onKeyframePointerDown = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      layerId: string,
      frameId: string,
      frame: number
    ) => {
      event.stopPropagation()
      if (!isFrameTool) return
      if (event.button !== 0) return
      const state = store.getState() as AuthoringRootState
      const selection = state.timeline.selection

      // Clicking a keyframe also moves the playhead to that frame.
      dispatch(playbackActions.setCurrentFrame(frame))
      // A plain keyframe click drops any cell selection (they're separate dimensions).
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        dispatch(timelineActions.clearCellSelection())
      }

      if (event.metaKey || event.ctrlKey) {
        dispatch(timelineActions.toggleTimelineItem(frameId))
        anchorRef.current = { layerId, frame }
      } else if (event.shiftKey && anchorRef.current?.layerId === layerId) {
        const layer = state.layers.layers.get(layerId)
        const lo = Math.min(anchorRef.current.frame, frame)
        const hi = Math.max(anchorRef.current.frame, frame)
        const ids = (layer?.timeline.frames ?? [])
          .filter((f) => f.frame >= lo && f.frame <= hi)
          .map((f) => f.id)
        dispatch(timelineActions.setTimelineSelection(ids))
      } else if (!selection.has(frameId)) {
        dispatch(timelineActions.setTimelineSelection([frameId]))
        anchorRef.current = { layerId, frame }
      } else {
        anchorRef.current = { layerId, frame }
      }

      // Drag preview: shift selected keyframes visually; commit once on drop.
      const dragState = store.getState() as AuthoringRootState
      const originals = gatherSelected(dragState)
      const snapping = dragState.timeline.snapping
      const snapTargets = collectSnapTargets(dragState)
      setDrag({ delta: 0 })
      let currentDelta = 0

      beginPointerDrag(event, {
        onMove: (e, d) => {
          const rawDelta = Math.round(d.dx / frameWidth)
          // Snap the pressed keyframe onto a nearby target; ⌘/Ctrl held bypasses.
          const bypass = e.metaKey || e.ctrlKey
          const delta =
            snapping && !bypass
              ? snapFrame(frame + rawDelta, snapTargets, frameWidth) - frame
              : rawDelta
          if (delta === currentDelta) return
          currentDelta = delta
          setDrag({ delta })
        },
        onEnd: () => {
          setDrag(null)
          if (currentDelta === 0) return
          const moveKey = `move-${Date.now()}`
          const ordered = [...originals].sort((a, b) =>
            currentDelta > 0 ? b.frame - a.frame : a.frame - b.frame
          )
          ordered.forEach((row) =>
            dispatch(
              coalesce(
                layersActions.moveKeyframe({
                  layerId: row.layerId,
                  from: row.frame,
                  to: Math.max(0, row.frame + currentDelta),
                }),
                moveKey
              )
            )
          )
        },
      })
    },
    [store, dispatch, frameWidth, isFrameTool]
  )

  return { drag, onKeyframePointerDown }
}
