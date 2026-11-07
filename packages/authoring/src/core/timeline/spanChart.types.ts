/**
 * Data-adapter contract for a span's activity chart (see `SpanActivityChart`).
 * A media module's adapter reads its own doc-level span content (a clip's
 * keyframe tracks, a loop's notes, a property-tween's automation) and maps it
 * into one of these shapes — the chart itself stays entirely content-agnostic.
 */

/** One line of a multiline "tween activity" chart (variant `'lines'`). */
export interface SpanChartLine {
  id: string
  label?: string
  /** Selects a themed line color by index, cycling for line counts beyond the palette. */
  colorIndex?: number
  /** Content-local time + an arbitrary numeric value, auto-scaled per line. */
  points: Array<{ t: number; v: number }>
}

/** One row of a note-row plot (variant `'rows'`). */
export interface SpanChartRow {
  id: string
  label?: string
  /** Content-local `[start, end)` segments this row is active for. */
  segments: Array<{ start: number; end: number }>
}

/**
 * What a chart adapter resolves for one span. `contentLength` is the inner
 * timeline's own total length (clip duration / loop length) — the same value
 * passed to `resolveSpanContentFrame` as `contentLength`, so the chart's
 * clamp/scale/loop windowing matches playback exactly. Exactly one of
 * `lines`/`rows` is expected for a given chart `variant`.
 */
export interface SpanChartAdapterResult {
  contentLength: number
  lines?: SpanChartLine[]
  rows?: SpanChartRow[]
}
