/**
 * Renders a span's activity chart (see `spanChart.types.ts`) inside its
 * `SpanBar` — either a multiline "tween activity" view (`variant: 'lines'`)
 * or a note-row plot (`variant: 'rows'`). Pure function of pre-computed pixel
 * geometry (`SpanChartGeometry`, from `mapAdapterResultToChartGeometry`) —
 * no Redux subscription of any kind, so it never re-renders on a playback
 * tick (the same isolation pattern as `SpanPlayingHighlight` — see
 * `docs/plans/sound-studio-timeline-perf-plan.md` Phase 2b).
 */
import { memo, type JSX } from 'react'
import type { SpanChartGeometry } from './spanChartGeometry.ts'

export interface SpanActivityChartProps {
  variant: 'lines' | 'rows'
  geometry: SpanChartGeometry
  width: number
  height: number
}

/**
 * Cycled by a line's `colorIndex` — distinct, theme-aware colors.
 *
 * These are `var()` references rather than resolved values: SVG `stroke` and
 * `fill` are presentation attributes, so the browser resolves the token at
 * paint. That means no hook, no palette read in JavaScript, and no re-render
 * when the color scheme flips — which matters here, because this component is
 * deliberately isolated from every re-render source it can be (see the file's
 * doc comment).
 */
const LINE_COLORS = [
  'var(--greese-color-secondary)',
  'var(--greese-color-info)',
  'var(--greese-color-warning)',
  'var(--greese-color-positive)',
  'var(--greese-color-negative)',
] as const

const ROW_GAP = 1

export const SpanActivityChart = memo(function SpanActivityChart({
  variant,
  geometry,
  width,
  height,
}: SpanActivityChartProps): JSX.Element | null {
  if (width <= 0 || height <= 0) return null

  return (
    <div className={'greese-TimelineSpanChart'}>
      {/* eslint-disable-next-line no-restricted-syntax -- an activity chart, not an icon */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {variant === 'lines' &&
          geometry.lines?.map((line, i) => {
            const color = LINE_COLORS[(line.colorIndex ?? i) % LINE_COLORS.length]!
            const pointsAttr = line.points
              .map((p) => `${p.x},${height - p.y * height}`)
              .join(' ')
            return (
              <polyline
                key={line.id}
                points={pointsAttr}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}
        {variant === 'rows' &&
          geometry.rows?.map((row, i) => {
            const rowCount = geometry.rows!.length
            const bandHeight = height / rowCount
            const y = i * bandHeight + ROW_GAP / 2
            const segHeight = Math.max(1, bandHeight - ROW_GAP)
            return (
              <g key={row.id}>
                {row.segments.map((seg, si) => (
                  <rect
                    key={si}
                    x={seg.x}
                    y={y}
                    width={Math.max(1, seg.width)}
                    height={segHeight}
                    rx={1}
                    fill="var(--greese-color-secondary)"
                  />
                ))}
              </g>
            )
          })}
        {geometry.tileBoundaries.map((x) => (
          <line
            key={x}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="var(--greese-color-border)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        ))}
      </svg>
    </div>
  )
})
SpanActivityChart.displayName = 'SpanActivityChart'
