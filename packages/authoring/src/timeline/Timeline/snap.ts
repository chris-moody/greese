import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import type { TimelineResolution } from '../../core/types/resolution.types.ts'
import type { TimelineTick } from '../../core/timeline/ticks.ts'

/** Pixels within which a dragged frame snaps to a target. */
export const SNAP_PX = 7

/**
 * Snap a raw tick position to the nearest `resolution.getSnapPoints` candidate
 * within a pixel-based tolerance — the tick-space counterpart of {@link snapFrame},
 * used by the {@link import('../../core/timeline/components/TimelineCursor').TimelineCursor} line.
 */
export const snapTick = (
  candidateTick: TimelineTick,
  resolution: TimelineResolution,
  pixelsPerTick: number
): TimelineTick => {
  if (pixelsPerTick <= 0) return candidateTick
  const toleranceTicks = SNAP_PX / pixelsPerTick
  const range = {
    startTick: candidateTick - toleranceTicks,
    endTick: candidateTick + toleranceTicks,
  }
  let best = candidateTick
  let bestDistance = toleranceTicks
  for (const point of resolution.getSnapPoints(range, pixelsPerTick)) {
    const distance = Math.abs(candidateTick - point.tick)
    if (distance <= bestDistance) {
      bestDistance = distance
      best = point.tick
    }
  }
  return best
}

/**
 * Snap `candidate` (a frame index) to the nearest target within a pixel-based
 * tolerance; returns the candidate unchanged if none is close enough.
 */
export const snapFrame = (
  candidate: number,
  targets: number[],
  frameWidth: number
): number => {
  const tolerance = SNAP_PX / frameWidth
  let best = candidate
  let bestDistance = tolerance
  for (const target of targets) {
    const distance = Math.abs(candidate - target)
    if (distance <= bestDistance) {
      bestDistance = distance
      best = target
    }
  }
  return best
}

/**
 * Frames a dragged item can snap to: every keyframe not currently selected (so a
 * group doesn't snap to itself) plus the playhead.
 */
export const collectSnapTargets = (state: AuthoringRootState): number[] => {
  const selection = state.timeline.selection
  const targets = new Set<number>([state.playback.currentFrame])
  state.layers.layers.forEach((layer) =>
    layer.timeline.frames.forEach((frame) => {
      if (!selection.has(frame.id)) targets.add(frame.frame)
    })
  )
  state.timeline.markers.forEach((marker) => targets.add(marker.frame))
  return [...targets]
}
