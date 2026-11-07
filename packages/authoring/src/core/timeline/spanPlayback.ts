/**
 * Pure resolution math for `SpanPlaybackProperties` (clamp/scaleMode/
 * loopCount/loopDelay) — the "outer span plays an inner timeline" model
 * shared by Armature's `SkinAnimationSpan` and Sound Studio's
 * `AmpArrangementSpan`. Both media mirror the property shape onto
 * their own persisted schema (see `SpanPlaybackProperties`'s doc comment)
 * and either import this resolver directly (web-app, which can depend on
 * `@beta/ui`) or keep a package-local mirror of it (`packages/armature`,
 * which can't).
 *
 * Composition order: clamp defines the content unit → scaleMode picks a
 * target length that unit (repeated `loopCount` times, gapped by
 * `loopDelay`) is scaled to fill → the outer frame is mapped back through
 * that scale factor to a content-local frame. See
 * `docs/plans/span-playback-properties-and-chart-plan.md`'s "Composition
 * semantics" section for the full derivation and rationale.
 */
import type { SpanPlaybackProperties } from '../types/frame.types.ts'

export interface SpanRepeatGeometry {
  /** Clamp start, in content-space. */
  unitStart: number
  /** Clamp length (`unitEnd - unitStart`), in content-space. */
  unitLength: number
  /** Content-space → span-space multiplier applied by the active scale mode. */
  scaleFactor: number
  /** Span-space length of one repeat, content + trailing delay. */
  periodLength: number
  /** Finite repeat count, or `Infinity` for `loopCount: -1`. */
  repeats: number
}

/**
 * The scale/period math shared by {@link resolveSpanContentFrame} (point
 * sampling) and {@link computeSpanRepeatTiles} (chart geometry) — exported
 * for any other consumer that needs to enumerate repeats itself (e.g. Sound
 * Studio's offline mixdown compiler, which forward-schedules each note's
 * repeat copies rather than sampling a single frame at a time).
 */
export const resolveSpanRepeatGeometry = ({
  spanDuration,
  contentLength,
  playback,
}: {
  spanDuration: number
  contentLength: number
  playback: SpanPlaybackProperties
}): SpanRepeatGeometry => {
  const unitStart = playback.clamp?.start ?? 0
  const unitEnd = playback.clamp?.end ?? contentLength
  const unitLength = Math.max(0, unitEnd - unitStart)

  const scaleMode = playback.scaleMode ?? { type: 'none' as const }
  const targetLength =
    scaleMode.type === 'scaleToFit'
      ? spanDuration
      : scaleMode.type === 'scaleWithin'
        ? scaleMode.targetFrames
        : unitLength

  const loopCount = playback.loopCount ?? -1
  const loopDelay = playback.loopDelay ?? 0
  const infinite = loopCount < 0
  const repeats = infinite ? Infinity : Math.max(1, loopCount + 1)

  let scaleFactor: number
  if (unitLength <= 0) {
    scaleFactor = 1
  } else if (infinite) {
    // No finite sum to solve for — a single unit sets the rate, and repeats
    // simply keep tiling for as long as the span (or, for the chart, the
    // visible width) lasts.
    scaleFactor = targetLength / unitLength
  } else {
    const totalUnits = repeats * unitLength + (repeats - 1) * loopDelay
    scaleFactor = totalUnits > 0 ? targetLength / totalUnits : 1
  }

  const periodLength = (unitLength + loopDelay) * scaleFactor

  return { unitStart, unitLength, scaleFactor, periodLength, repeats }
}

export interface ResolveSpanContentFrameArgs {
  /** Frame/tick being sampled, in the outer (span-owning) timeline. */
  outerFrame: number
  /** The span's own start, in the outer timeline. */
  spanStart: number
  /** The span's own authored duration. */
  spanDuration: number
  /** Total length of the inner content (clip duration / loop length). */
  contentLength: number
  playback: SpanPlaybackProperties
}

/**
 * Maps an outer-timeline frame to a content-local frame, applying clamp,
 * scale, and loop/delay in one pass. A frame that lands inside a
 * `loopDelay` gap (or past a finite loop's last repeat) resolves to a
 * content position just past the unit's clamped end — never colliding with
 * real content, so callers need no special "gap"/"exhausted" case: sampling
 * that holds past its last keyframe (Armature) or finds no note at that
 * position (Sound Studio) already does the right thing.
 */
export const resolveSpanContentFrame = ({
  outerFrame,
  spanStart,
  spanDuration,
  contentLength,
  playback,
}: ResolveSpanContentFrameArgs): number => {
  const { unitStart, unitLength, scaleFactor, periodLength, repeats } =
    resolveSpanRepeatGeometry({ spanDuration, contentLength, playback })
  if (unitLength <= 0 || scaleFactor <= 0) return unitStart

  const offset = Math.max(0, outerFrame - spanStart)
  let repeatIndex = periodLength > 0 ? Math.floor(offset / periodLength) : 0
  const lastRepeatIndex = repeats === Infinity ? repeatIndex : repeats - 1
  if (repeatIndex > lastRepeatIndex) repeatIndex = lastRepeatIndex

  const offsetWithinRepeat = offset - repeatIndex * periodLength
  return unitStart + offsetWithinRepeat / scaleFactor
}

export interface SpanRepeatTile {
  /** 0-based repeat index. */
  index: number
  /** This tile's content start, in span-local space. */
  spanOffsetStart: number
  /** This tile's scaled content length (excludes the trailing delay gap). */
  contentSpanLength: number
  /** Content-space → span-space multiplier, same as the resolver used. */
  scaleFactor: number
}

/**
 * Chart-facing companion to {@link resolveSpanContentFrame}: the list of
 * repeat tiles that start before `spanDuration`, for drawing each loop
 * repetition as a distinct visual copy. Capped at `maxTiles` for the
 * infinite case — playback itself never needs a cap since it only ever
 * evaluates one frame at a time.
 */
export const computeSpanRepeatTiles = ({
  spanDuration,
  contentLength,
  playback,
  maxTiles = 64,
}: {
  spanDuration: number
  contentLength: number
  playback: SpanPlaybackProperties
  maxTiles?: number
}): SpanRepeatTile[] => {
  const { unitLength, scaleFactor, periodLength, repeats } = resolveSpanRepeatGeometry({
    spanDuration,
    contentLength,
    playback,
  })
  if (unitLength <= 0 || scaleFactor <= 0 || periodLength <= 0) return []

  const contentSpanLength = unitLength * scaleFactor
  const tileCount =
    repeats === Infinity
      ? Math.min(maxTiles, Math.max(1, Math.ceil(spanDuration / periodLength)))
      : Math.min(maxTiles, repeats)

  const tiles: SpanRepeatTile[] = []
  for (let index = 0; index < tileCount; index++) {
    const spanOffsetStart = index * periodLength
    if (spanOffsetStart >= spanDuration) break
    tiles.push({ index, spanOffsetStart, contentSpanLength, scaleFactor })
  }
  return tiles
}
