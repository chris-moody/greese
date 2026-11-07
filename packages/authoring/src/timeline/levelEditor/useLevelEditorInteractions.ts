import { nanoid } from '@reduxjs/toolkit'
import { useCallback, useState, type PointerEvent, type RefObject } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import { selectLevelPointSelection } from '../../state/selectors.ts'
import {
  pointsInRect,
  usableHeight,
  type LevelEditorScale,
} from '../../core/timeline/levelEditor.ts'
import type { LevelPoint } from '../../core/timeline/levelEditor.types.ts'

export interface LevelEditorMarquee {
  left: number
  top: number
  width: number
  height: number
}

export interface LevelEditorInteractions {
  marquee: LevelEditorMarquee | null
  /** Live preview of `points` during a drag — render this instead of `points` when non-null. */
  dragPreview: LevelPoint[] | null
  /** Click empty graph area adds a point; press-drag marquee-selects (Shift adds, ⌘/Ctrl subtracts). */
  onBackdropPointerDown: (event: PointerEvent<Element>) => void
  /** Press a point: selects it (⌘/Shift toggles/multi-selects), press-drag moves it. */
  onPointPointerDown: (event: PointerEvent<Element>, pointId: string) => void
  /** Press the polyline (not a point): shifts every point's value by the drag delta. */
  onLinePointerDown: (event: PointerEvent<Element>) => void
}

/**
 * `TimelineLevelEditor` point interactions — structurally mirrors
 * `useFrameInteractions`/`useMarkerInteractions`. `containerRef` is the
 * overlay's root element, used to map pointer position to local tick/value.
 */
export const useLevelEditorInteractions = (
  points: LevelPoint[],
  onPointsChange: (points: LevelPoint[]) => void,
  scale: LevelEditorScale,
  containerRef: RefObject<HTMLElement | null>
): LevelEditorInteractions => {
  const dispatch = useAuthoringDispatch()
  const selection = useAuthoringSelector(selectLevelPointSelection)
  const [marquee, setMarquee] = useState<LevelEditorMarquee | null>(null)
  const [dragPreview, setDragPreview] = useState<LevelPoint[] | null>(null)

  const localXY = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      return rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 0, y: 0 }
    },
    [containerRef]
  )

  const tickAtX = useCallback(
    (x: number) => Math.max(0, Math.round(x / scale.pixelsPerTick)),
    [scale]
  )

  const valueAtY = useCallback(
    (y: number) => {
      const paddingY = scale.paddingY ?? 0
      const usable = usableHeight(scale) || 1e-6
      const t = 1 - (y - paddingY) / usable
      return Math.max(
        scale.min,
        Math.min(scale.max, scale.min + t * (scale.max - scale.min))
      )
    },
    [scale]
  )

  const onBackdropPointerDown = useCallback(
    (event: PointerEvent<Element>) => {
      if (event.button !== 0) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const startX = event.clientX
      const startY = event.clientY
      const baseSelection = new Set(selection)
      const additive = event.shiftKey
      const subtractive = event.metaKey || event.ctrlKey

      beginPointerDrag(event, {
        threshold: 4,
        onMove: (e) => {
          const box: LevelEditorMarquee = {
            left: Math.min(startX, e.clientX) - rect.left,
            top: Math.min(startY, e.clientY) - rect.top,
            width: Math.abs(e.clientX - startX),
            height: Math.abs(e.clientY - startY),
          }
          setMarquee(box)
          const hits = pointsInRect(points, box, scale)
          const next =
            additive || subtractive ? new Set(baseSelection) : new Set<string>()
          if (subtractive) hits.forEach((id) => next.delete(id))
          else hits.forEach((id) => next.add(id))
          dispatch(timelineActions.setLevelPointSelection([...next]))
        },
        onEnd: (e, _d, didDrag) => {
          setMarquee(null)
          if (didDrag) return
          // A plain click on empty graph area adds a point at the cursor's tick/value.
          const { x, y } = localXY(e.clientX, e.clientY)
          const newPoint: LevelPoint = {
            id: nanoid(),
            tick: tickAtX(x),
            value: valueAtY(y),
          }
          onPointsChange([...points, newPoint])
          dispatch(timelineActions.setLevelPointSelection([newPoint.id]))
        },
      })
    },
    [
      containerRef,
      selection,
      points,
      onPointsChange,
      dispatch,
      localXY,
      tickAtX,
      valueAtY,
      scale,
    ]
  )

  const onPointPointerDown = useCallback(
    (event: PointerEvent<Element>, pointId: string) => {
      event.stopPropagation()
      if (event.button !== 0) return
      const toggled = event.metaKey || event.ctrlKey || event.shiftKey
      if (toggled) {
        dispatch(timelineActions.toggleLevelPoint(pointId))
      } else if (!selection.has(pointId)) {
        dispatch(timelineActions.setLevelPointSelection([pointId]))
      }

      const original = points
      const pressed = original.find((p) => p.id === pointId)
      if (!pressed) return
      // Drag the whole selection when the pressed point belongs to it (plain
      // press) — a modifier press only toggled membership, so it drags nothing.
      if (toggled) return
      const dragIds = selection.has(pointId) ? new Set(selection) : new Set([pointId])
      let current = original

      beginPointerDrag(event, {
        onMove: (e) => {
          const { x, y } = localXY(e.clientX, e.clientY)
          const deltaTick = tickAtX(x) - pressed.tick
          const deltaValue = valueAtY(y) - pressed.value
          current = original.map((p) =>
            dragIds.has(p.id)
              ? {
                  ...p,
                  tick: Math.max(0, p.tick + deltaTick),
                  value: Math.max(scale.min, Math.min(scale.max, p.value + deltaValue)),
                }
              : p
          )
          setDragPreview(current)
        },
        onEnd: (_e, _d, didDrag) => {
          setDragPreview(null)
          if (didDrag) onPointsChange(current)
        },
      })
    },
    [selection, points, dispatch, localXY, tickAtX, valueAtY, onPointsChange, scale]
  )

  const onLinePointerDown = useCallback(
    (event: PointerEvent<Element>) => {
      if (event.button !== 0) return
      const original = points
      const valueRange = scale.max - scale.min
      const usable = usableHeight(scale) || 1e-6
      let current = original

      beginPointerDrag(event, {
        onMove: (_e, d) => {
          const deltaValue = -(d.dy / usable) * valueRange
          current = original.map((p) => ({
            ...p,
            value: Math.max(scale.min, Math.min(scale.max, p.value + deltaValue)),
          }))
          setDragPreview(current)
        },
        onEnd: (_e, _d, didDrag) => {
          setDragPreview(null)
          if (didDrag) onPointsChange(current)
        },
      })
    },
    [points, scale, onPointsChange]
  )

  return {
    marquee,
    dragPreview,
    onBackdropPointerDown,
    onPointPointerDown,
    onLinePointerDown,
  }
}
