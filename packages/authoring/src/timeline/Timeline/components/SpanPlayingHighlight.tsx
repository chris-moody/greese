'use client'
import { memo, type MouseEvent, type PointerEvent, type ReactNode, type JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectPlayback } from '../../../state/selectors.ts'

export interface SpanPlayingHighlightProps {
  selected: boolean
  start: number
  duration: number
  frameWidth: number
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onContextMenu: (event: MouseEvent<HTMLDivElement>) => void
  onTrimLeftPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onTrimRightPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  /** A `LayerTypeDef.renderSpanChart` result, hosted inside the bar. */
  chart?: ReactNode
}

/**
 * A span bar that owns its own "is the playhead currently inside this span"
 * subscription, so a `currentFrame` tick only re-renders the (typically few)
 * span bars, not the parent `TimelineFrames` map of every layer/keyframe/span.
 * See sound-studio-timeline-perf-plan.md Phase 2b.
 */
export const SpanPlayingHighlight = memo(function SpanPlayingHighlight({
  selected,
  start,
  duration,
  frameWidth,
  onPointerDown,
  onContextMenu,
  onTrimLeftPointerDown,
  onTrimRightPointerDown,
  chart,
}: SpanPlayingHighlightProps): JSX.Element | null {
  const { currentFrame } = useAuthoringSelector(selectPlayback)
  const playing = currentFrame >= start && currentFrame < start + duration

  return (
    <div
      className={'greese-TimelineFrames-spanBar'}
      data-selected={selected ? 'true' : undefined}
      data-playing={playing ? 'true' : undefined}
      data-has-chart={chart ? 'true' : undefined}
      style={{ left: start * frameWidth, width: duration * frameWidth }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      {chart}
      <div
        className={'greese-TimelineFrames-spanHandle'}
        data-side="left"
        onPointerDown={onTrimLeftPointerDown}
      />
      <div
        className={'greese-TimelineFrames-spanHandle'}
        data-side="right"
        onPointerDown={onTrimRightPointerDown}
      />
    </div>
  )
})
