'use client'
import {
  useCallback,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type JSX,
} from 'react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { beginPointerDrag } from '../../../core/pointerDrag.ts'
import {
  playbackBoundsActions,
  type PlaybackBounds,
} from '../../../state/playbackBounds.slice.ts'
import {
  selectActiveTimelineScope,
  selectActiveTimelineTool,
  selectFrameCount,
  selectPlaybackBounds,
} from '../../../state/selectors.ts'
import { TimelineToolId } from '../../../state/timelineTools.slice.ts'
import type { AuthoringRootState } from '../../../state/createAuthoringStore.ts'

export interface PlaybackBoundHandleProps {
  side: 'start' | 'end'
  frameWidth: number
}

/**
 * One playback in/out bracket handle, pinned to the ruler's top (its own
 * `position: sticky`, not nesting inside `RulerRoot` — see `BoundHandleRoot`'s
 * doc comment) and rendered as a sibling of `Playhead` so it paints in front
 * of it (z-index 6 vs. 5) rather than being capped by the ruler's own
 * stacking context. Visible/interactive under the Frame or Marker tool. Plain
 * press-drag moves this bound (min 1-unit gap from the other); double-click
 * snaps it to its respective timeline end; ⌘/Ctrl-drag shifts both bounds
 * together, preserving the gap.
 *
 * A bound returned to the full `[0, frameCount - 1]` range clears the stored
 * override entirely, so the end bound re-locks to the timeline end and keeps
 * tracking frame-count growth (recording, Add Frames) instead of freezing at
 * whatever the count was when it was last touched.
 */
export const PlaybackBoundHandle = ({
  side,
  frameWidth,
}: PlaybackBoundHandleProps): JSX.Element | null => {
  const { store } = useAuthoringEnvironment()
  const dispatch = useAuthoringDispatch()
  const activeTool = useAuthoringSelector(selectActiveTimelineTool)
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const bounds = useAuthoringSelector(selectPlaybackBounds)
  const count = useAuthoringSelector(selectFrameCount)
  // Local drag preview instead of a per-pointermove dispatch — mirrors
  // useMarkerInteractions' pattern (see sound-studio-timeline-perf-plan.md
  // Phase 3). Only the dragged handle previews; the other bracket in a
  // shift-both drag stays put visually until both commit together on release.
  const [previewBounds, setPreviewBounds] = useState<PlaybackBounds | null>(null)

  const commit = useCallback(
    (next: PlaybackBounds) => {
      const count = selectFrameCount(store.getState() as AuthoringRootState)
      if (next.start <= 0 && next.end >= count - 1) {
        dispatch(playbackBoundsActions.clearBounds({ scope }))
      } else {
        dispatch(playbackBoundsActions.setBounds({ scope, bounds: next }))
      }
    },
    [dispatch, scope, store]
  )

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.stopPropagation()
      const state = store.getState() as AuthoringRootState
      const origin = selectPlaybackBounds(state)
      const count = selectFrameCount(state)
      const shiftBoth = event.metaKey || event.ctrlKey

      let current = origin
      setPreviewBounds(origin)

      beginPointerDrag(event, {
        onMove: (_e, d) => {
          const delta = Math.round(d.dx / frameWidth)
          if (shiftBoth) {
            const gap = origin.end - origin.start
            const start = Math.max(0, Math.min(count - 1 - gap, origin.start + delta))
            current = { start, end: start + gap }
          } else if (side === 'start') {
            const start = Math.max(0, Math.min(origin.end - 1, origin.start + delta))
            current = { start, end: origin.end }
          } else {
            const end = Math.min(
              count - 1,
              Math.max(origin.start + 1, origin.end + delta)
            )
            current = { start: origin.start, end }
          }
          setPreviewBounds(current)
        },
        onEnd: () => {
          setPreviewBounds(null)
          if (current.start !== origin.start || current.end !== origin.end)
            commit(current)
        },
      })
    },
    [store, frameWidth, side, commit]
  )

  const onDoubleClick = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const count = selectFrameCount(state)
    if (side === 'start') commit({ start: 0, end: bounds.end })
    else commit({ start: bounds.start, end: Math.max(0, count - 1) })
  }, [store, side, bounds, commit])

  // A slider (WAI-ARIA APG): arrows move the bound a frame, Page keys ten,
  // Home and End as far as it goes. It keeps a frame's gap from the other.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const min = side === 'start' ? 0 : bounds.start + 1
    const max = side === 'start' ? bounds.end - 1 : Math.max(0, count - 1)
    const value = side === 'start' ? bounds.start : bounds.end
    const by: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -10,
      PageUp: 10,
    }
    let next: number | undefined
    if (event.key === 'Home') next = min
    else if (event.key === 'End') next = max
    else if (by[event.key] !== undefined)
      next = value + by[event.key]! * (event.shiftKey ? 10 : 1)
    if (next === undefined) return
    event.preventDefault()
    next = Math.max(min, Math.min(max, next))
    if (next === value) return
    commit(
      side === 'start'
        ? { start: next, end: bounds.end }
        : { start: bounds.start, end: next }
    )
  }

  if (activeTool !== TimelineToolId.frame && activeTool !== TimelineToolId.marker)
    return null

  const shown = previewBounds ?? bounds
  // Bounds are inclusive: the start bracket sits at its frame's left edge, the
  // end bracket at its frame's RIGHT edge — `bounds.end * frameWidth` would put
  // the end bracket a full frame short of the range it actually plays.
  const left = side === 'start' ? shown.start * frameWidth : (shown.end + 1) * frameWidth

  return (
    <div className={'greese-TimelineRuler-boundHandleRoot'} style={{ left }}>
      <div
        className={'greese-TimelineRuler-boundHandleFlag'}
        data-side={side}
        data-active={previewBounds !== null ? 'true' : undefined}
        role="slider"
        tabIndex={0}
        aria-label={side === 'start' ? 'Playback start' : 'Playback end'}
        aria-orientation="horizontal"
        aria-valuemin={side === 'start' ? 0 : shown.start + 1}
        aria-valuemax={side === 'start' ? shown.end - 1 : Math.max(0, count - 1)}
        aria-valuenow={side === 'start' ? shown.start : shown.end}
        aria-valuetext={`Frame ${(side === 'start' ? shown.start : shown.end) + 1}`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
      />
    </div>
  )
}
