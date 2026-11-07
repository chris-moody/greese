/**
 * The Temporal Guide's own lightweight clock — separate from `usePlaybackClock`
 * (which owns `currentFrame`), since the guide only needs to know "how long ago
 * was the last boundary of layer X," not drive playback. Call **once**, at
 * `Timeline.tsx` level, and pass the returned handle down to `Playhead`/the
 * pulse overlay — not independently per consumer, so two instances never
 * disagree about crossings read off the same store.
 *
 * The handle is a plain external store, deliberately **not** React state: pulse
 * activity must never re-render the `Timeline` that hosts it (the same
 * discipline `usePlaybackClock` follows for `currentFrame`). Crossings are
 * detected synchronously in a `store.subscribe` callback — so they work during
 * playback, scrubbing, and Compose's Space-hold alike, with zero
 * animation-frame churn of their own — and each visual consumer (`TimelinePulseOverlay`,
 * the playhead echo) subscribes to the handle and runs its own short-lived rAF
 * loop only while its pulses are decaying, re-rendering just that leaf.
 */
import { useEffect, useMemo } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import {
  selectActiveTemporalGuideLayers,
  selectActiveTimeSignatureChanges,
  selectPlaybackBounds,
} from '../state/selectors.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { TimelineTick } from '../core/timeline/ticks.ts'
import {
  crossedBoundaries,
  PulseLayerId,
  type PulseBoundaryContext,
} from '../core/timeline/resolutions/pulseBoundaries.helpers.ts'
import { ticksForStepDivision } from '../core/timeline/resolutions/stepDivisions.ts'
import { buildSignatureBarTable } from '../core/timeline/resolutions/timeSignature.helpers.ts'
import { useTimelineResolution } from './useTimelineResolution.ts'

/** How long a pulse stays in `getRecentPulses()` / drives `phaseFor`'s fade-out. */
export const PULSE_DECAY_MS = 300

export interface PulseEntry {
  layer: PulseLayerId
  tick: TimelineTick
  atMs: number
}

export interface PulseClockHandle {
  /** Pulses still within their decay window, oldest first (pruned on read). Usually empty. */
  getRecentPulses: () => readonly PulseEntry[]
  /** Normalized 0 (just pulsed) .. 1 (fully decayed, or none recently) time since the last boundary of `layer`. */
  phaseFor: (layer: PulseLayerId) => number
  /** Notifies when new pulses land. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void
}

export const usePulseClock = (): PulseClockHandle => {
  const { store } = useAuthoringEnvironment()
  const resolution = useTimelineResolution()

  const internals = useMemo(() => {
    let pulses: PulseEntry[] = []
    let prevTick = resolution.unitToTicks(store.getState().playback.currentFrame)
    const listeners = new Set<() => void>()

    /** Drop decayed entries. Skips the allocation entirely while the oldest entry is still fresh. */
    const prune = (): PulseEntry[] => {
      if (pulses.length === 0) return pulses
      const cutoff = performance.now() - PULSE_DECAY_MS
      if (pulses[0]!.atMs >= cutoff) return pulses
      pulses = pulses.filter((p) => p.atMs >= cutoff)
      return pulses
    }

    const onStateChange = () => {
      const state = store.getState() as AuthoringRootState
      const currentTick = resolution.unitToTicks(state.playback.currentFrame)
      const last = prevTick
      prevTick = currentTick
      if (last === currentTick) return
      const layers = selectActiveTemporalGuideLayers(state)
      if (layers.length === 0) return

      const bounds = selectPlaybackBounds(state)
      const startTick = resolution.unitToTicks(bounds.start)
      const endTick = resolution.unitToTicks(bounds.end)
      const ctx: PulseBoundaryContext = {
        signatureTable: buildSignatureBarTable(
          selectActiveTimeSignatureChanges(state),
          resolution.ticksPerUnit
        ),
        ticksPerUnit: resolution.ticksPerUnit,
        subdivisionTicks: ticksForStepDivision(
          state.recording.stepDivision,
          resolution.ticksPerUnit
        ),
        loopBounds: { start: startTick, end: endTick },
      }

      // A backward jump while playing is the loop wrapping — sweep the tail of
      // the lap and the landing separately, instead of letting the reversed
      // range flash every boundary in the loop at once. A backward jump while
      // paused is a scrub, which `crossedBoundaries` handles as a reverse sweep.
      const wrapped = state.playback.playing && currentTick < last
      const sweeps: [number, number][] = wrapped
        ? [
            [last, endTick],
            [startTick - 1, Math.max(startTick, currentTick)],
          ]
        : [[last, currentTick]]

      const nowMs = performance.now()
      let added = false
      for (const layer of layers) {
        for (const [from, to] of sweeps) {
          for (const tick of crossedBoundaries(from, to, layer, ctx)) {
            pulses.push({ layer, tick, atMs: nowMs })
            added = true
          }
        }
      }
      if (added) {
        prune()
        listeners.forEach((listener) => listener())
      }
    }

    const handle: PulseClockHandle = {
      getRecentPulses: () => prune(),
      phaseFor: (layer) => {
        let latestMs: number | undefined
        for (const pulse of prune()) {
          if (
            pulse.layer === layer &&
            (latestMs === undefined || pulse.atMs > latestMs)
          ) {
            latestMs = pulse.atMs
          }
        }
        if (latestMs === undefined) return 1
        return Math.min(1, (performance.now() - latestMs) / PULSE_DECAY_MS)
      },
      subscribe: (listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
    }

    return { handle, onStateChange }
  }, [store, resolution])

  useEffect(() => store.subscribe(internals.onStateChange), [store, internals])

  return internals.handle
}
