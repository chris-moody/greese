import { memo, type MouseEvent, type PointerEvent, type JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectFrameCount } from '../../../state/selectors.ts'
import type {
  TimeMode,
  TimelineResolution,
} from '../../../core/types/resolution.types.ts'
import { pickLabelTier } from '../../../core/timeline/rulerTiers.ts'

export interface TimelineRulerProps {
  frameWidth: number
  /** Zoom level in ticks — `frameWidth = pixelsPerTick * ticksPerUnit`. */
  pixelsPerTick: number
  /** Ticks per raw `FrameBase.frame` unit — see `TimelineProps.resolution`. */
  ticksPerUnit: number
  resolution: TimelineResolution
  timeMode: TimeMode
  firstFrame: number
  lastFrame: number
  /** Click/drag anywhere on the ruler to scrub the playhead. */
  onScrubStart: (event: PointerEvent<HTMLElement>) => void
  /** Double-click adds a marker at the clicked frame (Marker tool only). */
  onDoubleClick: (event: MouseEvent<HTMLElement>) => void
}

/**
 * Frame ruler: windowed ticks + labels; the strip is a scrub surface. Markers
 * render as full-height objects in `TimelineMarkers` (their tabs stick over
 * the ruler). The playback bound handles visually sit on the ruler too but
 * render as their own siblings of `Playhead` in `Timeline.tsx`, not nested
 * here — see `PlaybackBoundHandle`'s doc comment for why.
 */
export const TimelineRuler = memo(function TimelineRuler({
  frameWidth,
  pixelsPerTick,
  ticksPerUnit,
  resolution,
  timeMode,
  firstFrame,
  lastFrame,
  onScrubStart,
  onDoubleClick,
}: TimelineRulerProps): JSX.Element | null {
  const frameCount = useAuthoringSelector(selectFrameCount)
  const width = frameCount * frameWidth

  const range = {
    startTick: firstFrame * ticksPerUnit,
    endTick: lastFrame * ticksPerUnit,
  }
  const points = pickLabelTier(
    resolution.getSnapPoints(range, pixelsPerTick),
    pixelsPerTick
  )

  return (
    <div
      className={'greese-TimelineRuler-ruler'}
      style={{ width }}
      onPointerDown={onScrubStart}
      onDoubleClick={onDoubleClick}
    >
      {points.map((point) => (
        <div
          className={'greese-TimelineRuler-tick'}
          key={point.tick}
          style={{ left: point.tick * pixelsPerTick }}
        >
          {resolution.format(point.tick, timeMode)}
        </div>
      ))}
    </div>
  )
})
