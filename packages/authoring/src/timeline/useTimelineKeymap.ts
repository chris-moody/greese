import { useEffect, useRef } from 'react'
import { ownsDeleteKey } from '../core/keyboard.ts'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import { playbackActions } from '../state/playback.slice.ts'
import { timelineActions } from '../state/timeline.slice.ts'
import { RecordMode, recordingActions } from '../state/recording.slice.ts'
import {
  selectActiveTimelineTool,
  selectFrameCount,
  selectPlaybackBounds,
} from '../state/selectors.ts'
import { TimelineToolId } from '../state/timelineTools.slice.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import { ticksForStepDivision } from '../core/timeline/resolutions/index.ts'
import { useTimelineEditing } from './useTimelineEditing.ts'
import { useTimelineResolution } from './useTimelineResolution.ts'

/** Mutable state for Compose's Space-hold scrub — lives in a ref (see below). */
interface ComposeScrubState {
  active: boolean
  raf: number
  /** Virtual seconds accumulator, seeded from the playhead at scrub start. */
  time: number
  lastNow: number
  lastDispatchedFrame: number
}

const sortedKeyframeFrames = (state: AuthoringRootState): number[] => {
  const frames = new Set<number>()
  state.layers.layers.forEach((layer) =>
    layer.timeline.frames.forEach((f) => frames.add(f.frame))
  )
  return [...frames].sort((a, b) => a - b)
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true)
  )
}

/** True when the stage canvas has keyboard focus (arrow keys belong to stage nudging). */
const isStageFocused = (): boolean => document.activeElement?.tagName === 'CANVAS'

/**
 * Keyboard-first timeline controls (§20b). Scoped: modifier clipboard shortcuts
 * only intercept when there's a timeline selection/clipboard, so ⌘C/⌘V still work
 * normally elsewhere. Undo/redo (⌘Z) is handled separately by `useUndoRedoKeymap`.
 *
 * @param hideRecording — mirrors `TimelineProps.hideRecording`: when true, the
 *   Space-to-record shortcut is suppressed regardless of `state.recording.enabled`
 *   — otherwise recording armed on one screen (e.g. a Sound Studio Loop) but left
 *   enabled while switching to a screen whose header hides the Record toggle
 *   (e.g. Arrangement) would still silently start capturing on Space.
 */
export const useTimelineKeymap = (hideRecording?: boolean): void => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const editing = useTimelineEditing()
  const resolution = useTimelineResolution()
  // True while playback was started by holding Space (recording mode) — the
  // matching keyup pauses it; a Space tap during normal playback does nothing.
  // A ref (not a plain closure variable) so the flag survives this effect being
  // torn down and re-registered mid-hold — e.g. `currentFrame` updating on
  // every rAF tick while playing re-renders `Timeline`, and even a normally
  // stable-looking dependency can still change reference on that re-render.
  const spaceStartedPlaybackRef = useRef(false)
  // Compose's own Space-hold advance loop — never touches `playback.playing`.
  // A ref (not effect-local state) for the same reason as above: the effect
  // below re-registers mid-hold, and the loop must keep running across that
  // teardown/setup rather than freezing. The effect's cleanup deliberately
  // does not cancel an active scrub — only the matching keyup (below) and the
  // unmount-only effect at the bottom of this hook do.
  const composeScrubRef = useRef<ComposeScrubState | null>(null)

  useEffect(() => {
    /**
     * One frame of Compose's Space-hold scrub: advances the virtual seconds
     * accumulator by real elapsed time, converts back to a raw frame, quantizes
     * to the step-division grid (continuous when `off`), and dispatches only
     * when the resulting frame actually changes. Reads `recording`/bounds fresh
     * from the store each tick (not a closure capture) so it stays correct
     * across mode/division changes and effect re-registration mid-hold.
     */
    const runComposeScrubTick = () => {
      const scrub = composeScrubRef.current
      if (!scrub?.active) return
      const now = performance.now()
      const dt = (now - scrub.lastNow) / 1000
      scrub.lastNow = now
      scrub.time += dt
      const rawTick = resolution.secondsToTick(scrub.time)
      let frame = resolution.ticksToUnit(rawTick)

      const state = store.getState() as AuthoringRootState
      const bounds = selectPlaybackBounds(state)
      let reachedEnd = false
      if (frame > bounds.end) {
        frame = bounds.end
        reachedEnd = true
      } else if (frame < bounds.start) {
        frame = bounds.start
      }

      const stepTicks = ticksForStepDivision(
        state.recording.stepDivision,
        resolution.ticksPerUnit
      )
      const quantizedFrame =
        stepTicks > 0
          ? resolution.ticksToUnit(
              Math.floor(resolution.unitToTicks(frame) / stepTicks) * stepTicks
            )
          : frame

      if (quantizedFrame !== scrub.lastDispatchedFrame) {
        scrub.lastDispatchedFrame = quantizedFrame
        dispatch(playbackActions.setCurrentFrame(quantizedFrame))
      }

      if (reachedEnd) {
        scrub.active = false
        dispatch(recordingActions.setComposeScrubActive(false))
        return
      }
      scrub.raf = requestAnimationFrame(runComposeScrubTick)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const state = store.getState() as AuthoringRootState
      const count = selectFrameCount(state)
      const current = state.playback.currentFrame
      const hasSelection = state.timeline.selection.size > 0

      // Recording mode: holding Space advances time while held, releasing it
      // stops — so notes can be recorded against a moving playhead. Live/Step
      // reuse the real transport clock; Compose drives `currentFrame` directly
      // via its own rAF loop (see `runComposeScrubTick` below) so it never sets
      // `playback.playing`.
      if (event.key === ' ') {
        if (event.repeat) return
        if (
          hideRecording ||
          !config.timelineTools?.showRecording ||
          !state.recording.enabled
        )
          return
        event.preventDefault()
        if (state.recording.mode === RecordMode.compose) {
          if (composeScrubRef.current?.active) return
          const now = performance.now()
          composeScrubRef.current = {
            active: true,
            raf: 0,
            time: resolution.tickToSeconds(resolution.unitToTicks(current)),
            lastNow: now,
            lastDispatchedFrame: current,
          }
          composeScrubRef.current.raf = requestAnimationFrame(runComposeScrubTick)
          dispatch(recordingActions.setComposeScrubActive(true))
        } else if (!state.playback.playing) {
          spaceStartedPlaybackRef.current = true
          const handled = config.timelineTools?.onSpaceRecordStart?.()
          if (handled !== false) dispatch(playbackActions.play())
        }
        return
      }
      // Marker-tool clipboard/delete shortcuts only intercept when the Marker
      // tool is active and there's a marker selection, so the shared shortcuts
      // below still target keyframes under the Frame tool.
      const isMarkerToolActive = selectActiveTimelineTool(state) === TimelineToolId.marker
      const hasMarkerSelection = state.timeline.selectedMarkers.size > 0
      const seek = (frame: number) =>
        dispatch(playbackActions.setCurrentFrame(Math.max(0, Math.min(count - 1, frame))))

      // Shift+Arrow extends the cell selection horizontally along the anchor's layer.
      const cellAnchor = state.timeline.cellAnchor
      if (
        event.shiftKey &&
        cellAnchor &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        event.preventDefault()
        const layerId = cellAnchor.slice(0, cellAnchor.lastIndexOf(':'))
        const framesOnLayer = [...state.timeline.cellSelection]
          .filter((c) => c.startsWith(`${layerId}:`))
          .map((c) => Number(c.slice(c.lastIndexOf(':') + 1)))
        if (framesOnLayer.length === 0) return
        const target =
          event.key === 'ArrowRight'
            ? Math.min(count - 1, Math.max(...framesOnLayer) + 1)
            : Math.max(0, Math.min(...framesOnLayer) - 1)
        dispatch(timelineActions.addCells([`${layerId}:${target}`]))
        return
      }

      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'c':
            if (isMarkerToolActive && hasMarkerSelection) {
              event.preventDefault()
              editing.copyMarkers()
              return
            }
            if (!hasSelection) return
            event.preventDefault()
            editing.copy()
            return
          case 'x':
            if (isMarkerToolActive && hasMarkerSelection) {
              event.preventDefault()
              editing.copyMarkers()
              editing.deleteSelectedMarkers()
              return
            }
            if (!hasSelection) return
            event.preventDefault()
            editing.cut()
            return
          case 'v':
            if (isMarkerToolActive && state.timeline.clipboard?.markers?.length) {
              event.preventDefault()
              editing.pasteMarkers()
              return
            }
            if (!state.timeline.clipboard) return
            event.preventDefault()
            editing.paste()
            return
          case 'd':
            if (!hasSelection) return
            event.preventDefault()
            editing.duplicate()
            return
          case 'i':
            if (!event.shiftKey) return
            event.preventDefault()
            editing.insertFrame()
            return
          case 'delete':
          case 'backspace':
            if (!event.shiftKey || ownsDeleteKey(event.target)) return
            event.preventDefault()
            editing.removeFrame()
            return
          case 'arrowleft': {
            event.preventDefault()
            const frames = sortedKeyframeFrames(state).filter((f) => f < current)
            seek(frames.length ? frames[frames.length - 1]! : current)
            return
          }
          case 'arrowright': {
            event.preventDefault()
            const next = sortedKeyframeFrames(state).find((f) => f > current)
            seek(next ?? current)
            return
          }
          default:
            return
        }
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (ownsDeleteKey(event.target)) return
          if (isMarkerToolActive && hasMarkerSelection) {
            event.preventDefault()
            editing.deleteSelectedMarkers()
            return
          }
          if (!hasSelection) return
          event.preventDefault()
          if (event.shiftKey) editing.rippleDelete()
          else editing.deleteSelected()
          return
        case 's':
        case 'S':
          if (!hasSelection) return
          event.preventDefault()
          editing.splitAtPlayhead()
          return
        case 'j':
        case 'J':
          if (!hasSelection) return
          event.preventDefault()
          editing.joinSelected()
          return
        case 't':
        case 'T':
          if (event.shiftKey) {
            if (state.timeline.selectedTweens.size === 0) return
            event.preventDefault()
            editing.removeSelectedTween()
          } else {
            if (!hasSelection) return
            event.preventDefault()
            editing.createTweenFromSelection()
          }
          return
        case 'ArrowLeft':
          // Yield to canvas stage when it has focus (stage handles nudging).
          if (isStageFocused()) return
          event.preventDefault()
          seek(current - 1)
          return
        case 'ArrowRight':
          if (isStageFocused()) return
          event.preventDefault()
          seek(current + 1)
          return
        case 'Escape':
          event.preventDefault()
          dispatch(timelineActions.clearTimelineSelection())
          return
        case 'Home':
          event.preventDefault()
          seek(0)
          return
        case 'End':
          event.preventDefault()
          seek(count - 1)
          return
        default:
          return
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== ' ') return
      if (composeScrubRef.current?.active) {
        composeScrubRef.current.active = false
        cancelAnimationFrame(composeScrubRef.current.raf)
        dispatch(recordingActions.setComposeScrubActive(false))
        return
      }
      if (!spaceStartedPlaybackRef.current) return
      spaceStartedPlaybackRef.current = false
      config.timelineTools?.onSpaceRecordCancel?.()
      dispatch(playbackActions.pause())
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    // Deliberately does not cancel an in-flight Compose scrub — see the
    // `composeScrubRef` comment above; only the matching keyup and the
    // unmount-only effect below stop it.
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [store, dispatch, editing, config, resolution, hideRecording])

  // True-unmount-only cleanup: cancels a still-running Compose scrub when the
  // component actually goes away (not on the re-registration above, which
  // deliberately leaves an active scrub running).
  useEffect(
    () => () => {
      if (composeScrubRef.current?.active) {
        composeScrubRef.current.active = false
        cancelAnimationFrame(composeScrubRef.current.raf)
        dispatch(recordingActions.setComposeScrubActive(false))
      }
    },
    // `dispatch` is the store's, stable for the component's life.
    [dispatch]
  )
}
