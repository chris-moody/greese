'use client'
import { useEffect } from 'react'
import { timeline } from '@greese/js'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../environment/environment.tsx'
import { playbackActions } from '../state/playback.slice.ts'
import { selectPlaybackBounds } from '../state/selectors.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { TimelineResolution } from '../core/types/resolution.types.ts'
import { useTimelineResolution } from './useTimelineResolution.ts'

/** A frame-grid unit's start, in seconds, through the resolution (its rate curve included). */
const secondsAt = (resolution: TimelineResolution, unit: number) =>
  resolution.tickToSeconds(resolution.unitToTicks(unit))

/**
 * Drives the playhead while playing, on a greese.js timeline (ADR 0036):
 * one that animates nothing, spans the document in seconds, and plays
 * between the playback bounds (`bounds()`, looping with the overshoot
 * carried, so laps keep exact time against a continuous clock). Its time maps
 * back to a frame through the resolution, which is where a rate curve or
 * tempo lives, so the clock itself runs at a constant `speed`.
 *
 * It subscribes to `playing`, `loop`, `speed` and the bounds, not the
 * frame, reading that from the store when play starts, so advancing the
 * playhead doesn't re-render the timeline's host. While playing, it listens
 * to the store for a frame set from elsewhere and seeks there.
 */
export const usePlaybackClock = (): void => {
  const { store } = useAuthoringEnvironment()
  const dispatch = useAuthoringDispatch()
  const resolution = useTimelineResolution()
  const playing = useAuthoringSelector(
    (state: AuthoringRootState) => state.playback.playing
  )
  const loop = useAuthoringSelector((state: AuthoringRootState) => state.playback.loop)
  const speed = useAuthoringSelector((state: AuthoringRootState) => state.playback.speed)
  const bounds = useAuthoringSelector(selectPlaybackBounds)

  // Keep the playhead inside the bounds when they move (a handle dragged past it).
  useEffect(() => {
    const current = (store.getState() as AuthoringRootState).playback.currentFrame
    if (current < bounds.start) dispatch(playbackActions.setCurrentFrame(bounds.start))
    else if (current > bounds.end) dispatch(playbackActions.setCurrentFrame(bounds.end))
  }, [bounds, store, dispatch])

  useEffect(() => {
    if (!playing) return
    // The bounds' last frame plays for its whole length.
    const start = secondsAt(resolution, bounds.start)
    const end = secondsAt(resolution, bounds.end + 1)
    let shown = (store.getState() as AuthoringRootState).playback.currentFrame
    const clock = timeline({
      paused: true,
      // The editor's playhead moves for any user: it's the tool, not decoration.
      reducedMotion: 'ignore',
      timeScale: Math.max(1e-6, speed),
      onUpdate: (tl) => {
        const frame = Math.min(
          bounds.end,
          Math.max(
            bounds.start,
            Math.floor(resolution.ticksToUnit(resolution.secondsToTick(tl.time())) + 1e-9)
          )
        )
        if (frame === shown) return
        shown = frame
        dispatch(playbackActions.setCurrentFrame(frame))
      },
      onComplete: () => {
        dispatch(playbackActions.setCurrentFrame(bounds.end))
        dispatch(playbackActions.pause())
      },
    })
      // Nothing animates; a cue at the end gives the timeline its length.
      .call(() => {}, end)
      .bounds(start, end, { loop })
    clock.play(Math.min(end, Math.max(start, secondsAt(resolution, shown))))
    // A frame set from elsewhere while playing (a scrub, a ruler click, a
    // key) moves the clock there, rather than being overwritten next tick.
    const unsubscribe = (
      store as unknown as { subscribe: (listener: () => void) => () => void }
    ).subscribe(() => {
      const frame = (store.getState() as AuthoringRootState).playback.currentFrame
      if (frame === shown) return
      shown = frame
      clock.seek(Math.min(end, Math.max(start, secondsAt(resolution, frame))))
    })
    return () => {
      unsubscribe()
      clock.kill()
    }
  }, [playing, loop, speed, bounds, resolution, dispatch, store])
}
