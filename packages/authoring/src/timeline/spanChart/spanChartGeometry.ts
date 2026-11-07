/**
 * Pure mapping from a chart adapter's content-space result
 * (`SpanChartAdapterResult`) to span-local pixel geometry, reusing the same
 * clamp/scale/loop math the playback resolvers use
 * (`resolveSpanRepeatGeometry`/`computeSpanRepeatTiles`) so a chart's
 * windowing always matches what will actually play.
 */
import { useMemo } from 'react'
import {
  resolveSpanRepeatGeometry,
  computeSpanRepeatTiles,
} from '../../core/timeline/spanPlayback.ts'
import type { SpanPlaybackProperties } from '../../core/types/frame.types.ts'
import type { SpanChartAdapterResult } from '../../core/timeline/spanChart.types.ts'

export interface SpanChartLineGeometry {
  id: string
  label?: string
  colorIndex?: number
  /** Pixel-space points; `y` normalized `0..1` within this line's own value range. */
  points: Array<{ x: number; y: number }>
}

export interface SpanChartRowGeometry {
  id: string
  label?: string
  /** Pixel-space `[x, x + width)` segments. */
  segments: Array<{ x: number; width: number }>
}

export interface SpanChartGeometry {
  lines?: SpanChartLineGeometry[]
  rows?: SpanChartRowGeometry[]
  /** Pixel-space x of every repeat boundary after the first, for a thin separator. */
  tileBoundaries: number[]
}

export const mapAdapterResultToChartGeometry = (
  result: SpanChartAdapterResult,
  spanDuration: number,
  playback: SpanPlaybackProperties,
  frameWidth: number
): SpanChartGeometry => {
  const { unitStart, unitLength } = resolveSpanRepeatGeometry({
    spanDuration,
    contentLength: result.contentLength,
    playback,
  })
  const unitEnd = unitStart + unitLength
  const tiles = computeSpanRepeatTiles({
    spanDuration,
    contentLength: result.contentLength,
    playback,
  })

  const lines = result.lines?.map((line): SpanChartLineGeometry => {
    const values = line.points.map((p) => p.v)
    const vMin = Math.min(0, ...values)
    const vMax = Math.max(1, ...values)
    const vRange = vMax - vMin || 1

    const points: Array<{ x: number; y: number }> = []
    for (const tile of tiles) {
      for (const p of line.points) {
        if (p.t < unitStart || p.t >= unitEnd) continue
        const x =
          (tile.spanOffsetStart + (p.t - unitStart) * tile.scaleFactor) * frameWidth
        const y = (p.v - vMin) / vRange
        points.push({ x, y })
      }
    }
    return { id: line.id, label: line.label, colorIndex: line.colorIndex, points }
  })

  const rows = result.rows?.map((row): SpanChartRowGeometry => {
    const segments: Array<{ x: number; width: number }> = []
    for (const tile of tiles) {
      for (const seg of row.segments) {
        const start = Math.max(seg.start, unitStart)
        const end = Math.min(seg.end, unitEnd)
        if (start >= end) continue
        const x =
          (tile.spanOffsetStart + (start - unitStart) * tile.scaleFactor) * frameWidth
        const width = (end - start) * tile.scaleFactor * frameWidth
        segments.push({ x, width })
      }
    }
    return { id: row.id, label: row.label, segments }
  })

  const tileBoundaries = tiles.slice(1).map((t) => t.spanOffsetStart * frameWidth)

  return { lines, rows, tileBoundaries }
}

export const useSpanChartGeometry = (
  result: SpanChartAdapterResult,
  spanDuration: number,
  playback: SpanPlaybackProperties,
  frameWidth: number
): SpanChartGeometry =>
  useMemo(
    () => mapAdapterResultToChartGeometry(result, spanDuration, playback, frameWidth),
    [result, spanDuration, playback, frameWidth]
  )
