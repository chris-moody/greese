import { describe, expect, it } from 'vitest'
import { mapAdapterResultToChartGeometry } from './spanChartGeometry.ts'
import type { SpanPlaybackProperties } from '../../core/types/frame.types.ts'
import type { SpanChartAdapterResult } from '../../core/timeline/spanChart.types.ts'

describe('mapAdapterResultToChartGeometry', () => {
  it('maps a single line 1:1 with no clamp/scale/loop, normalizing y within its own range', () => {
    const result: SpanChartAdapterResult = {
      contentLength: 10,
      // t=10 sits exactly on the (exclusive) content-length boundary — see
      // clamp's "end exclusive" convention — and is intentionally excluded.
      lines: [
        {
          id: 'l1',
          points: [
            { t: 0, v: 0 },
            { t: 5, v: 10 },
            { t: 9, v: 5 },
          ],
        },
      ],
    }
    const playback: SpanPlaybackProperties = { loopCount: 0 }
    const geometry = mapAdapterResultToChartGeometry(result, 10, playback, 2)

    expect(geometry.lines).toHaveLength(1)
    const points = geometry.lines![0]!.points
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 1 },
      { x: 18, y: 0.5 },
    ])
  })

  it('excludes points/segments outside the clamp window', () => {
    const result: SpanChartAdapterResult = {
      contentLength: 10,
      lines: [
        {
          id: 'l1',
          points: [
            { t: 1, v: 0 },
            { t: 5, v: 1 },
            { t: 9, v: 1 },
          ],
        },
      ],
      rows: [
        {
          id: 'r1',
          segments: [
            { start: 0, end: 2 },
            { start: 4, end: 6 },
          ],
        },
      ],
    }
    const playback: SpanPlaybackProperties = { clamp: { start: 3, end: 7 }, loopCount: 0 }
    const geometry = mapAdapterResultToChartGeometry(result, 4, playback, 1)

    // Only t=5 falls within [3, 7).
    expect(geometry.lines![0]!.points).toHaveLength(1)
    // Only the [4, 6) segment overlaps [3, 7); it's clipped to [4, 6).
    expect(geometry.rows![0]!.segments).toEqual([{ x: 1, width: 2 }])
  })

  it('produces one tile boundary per extra repeat when looping', () => {
    const result: SpanChartAdapterResult = {
      contentLength: 6,
      rows: [{ id: 'r1', segments: [] }],
    }
    const playback: SpanPlaybackProperties = { loopCount: 2 } // 3 repeats, period 2 (see spanPlayback.helpers.test.ts)
    const geometry = mapAdapterResultToChartGeometry(result, 6, playback, 1)

    expect(geometry.tileBoundaries).toEqual([2, 4])
  })
})
