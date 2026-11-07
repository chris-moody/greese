import { useMemo, type JSX } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { rateCurveActions } from '../../../state/rateCurve.slice.ts'
import {
  selectActiveRateCurve,
  selectActiveTimelineScope,
} from '../../../state/selectors.ts'
import { TimeDomain } from '../../../core/types/resolution.types.ts'
import { useTimelineResolution } from '../../useTimelineResolution.ts'
import { TimelineLevelEditor } from '../../levelEditor/TimelineLevelEditor.tsx'
import { sampleLevelCurve } from '../../../core/timeline/levelEditor.ts'
import type { LevelPoint } from '../../../core/timeline/levelEditor.types.ts'

export interface RateToolOverlayProps {
  width: number
  /** Chart height — the scroll viewport's height (values normalize to it). */
  height: number
  /** Horizontal scroll offset — pins the chart's floating y-axis. */
  scrollLeft: number
  pixelsPerTick: number
}

const DEFAULT_RATE_MIN = 1
const DEFAULT_RATE_MAX = 960
/** Vertical inset (px) so points at the axis extremes don't touch the chart edges. */
const CHART_VERTICAL_PADDING = 16

/** Stable id for the implicit tick-0 anchor materialized on first edit. */
const RATE_ORIGIN_ID = 'rate-origin'

/** Axis ceilings snap up to this increment (e.g. data max 240 → axis 300). */
const AXIS_STEP = 50
/** Headroom multiplier above the data max so points aren't pinned to the top. */
const AXIS_HEADROOM = 1.25

/**
 * Rate-curve editor overlay — wraps `TimelineLevelEditor` with the active
 * scope's rate curve (`rateCurve.slice.ts`).
 *
 * The y-axis is normalized to the DATA, not the configured rate bounds: 0 sits
 * at the bottom and a round ceiling just above the highest point sits at the
 * top (240bpm → 0..300), so typical curves fill the chart instead of hugging
 * the bottom of a 20-999 span. Committed values still clamp to
 * `config.timelineTools`'s rateMin/rateMax.
 *
 * The chart always shows a point at tick 0 — the starting tempo/framerate.
 * When the stored curve lacks one it renders as a synthetic anchor (the curve
 * sampled at 0, or the shell's flat rate when the curve is empty) and is
 * materialized into the stored curve by the first edit that includes it.
 */
export const RateToolOverlay = ({
  width,
  height,
  scrollLeft,
  pixelsPerTick,
}: RateToolOverlayProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const { config } = useAuthoringEnvironment()
  const resolution = useTimelineResolution()
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const points = useAuthoringSelector(selectActiveRateCurve)
  const rateMin = config.timelineTools?.rateMin ?? DEFAULT_RATE_MIN
  const rateMax = config.timelineTools?.rateMax ?? DEFAULT_RATE_MAX

  const displayPoints = useMemo((): LevelPoint[] => {
    if (points.length === 0) {
      // Flat curve: derive the shell's current rate from the resolution (one
      // frame unit's real duration — 60/s per beat for musical, 1/s for frames).
      const secondsPerUnit = resolution.tickToSeconds(resolution.ticksPerUnit)
      const rate =
        (resolution.domain === TimeDomain.Musical ? 60 : 1) /
        Math.max(1e-9, secondsPerUnit)
      return [
        {
          id: RATE_ORIGIN_ID,
          tick: 0,
          value: Math.max(rateMin, Math.min(rateMax, Math.round(rate))),
        },
      ]
    }
    if (points.some((p) => p.tick === 0)) return points
    return [
      { id: RATE_ORIGIN_ID, tick: 0, value: sampleLevelCurve(points, 0) },
      ...points,
    ]
  }, [points, resolution, rateMin, rateMax])

  // Data-normalized axis: 0 at the bottom, a round ceiling with headroom at the
  // top, never exceeding the configured max.
  const axisMax = useMemo(() => {
    const dataMax = Math.max(...displayPoints.map((p) => p.value), 1)
    return Math.min(
      rateMax,
      Math.max(AXIS_STEP, Math.ceil((dataMax * AXIS_HEADROOM) / AXIS_STEP) * AXIS_STEP)
    )
  }, [displayPoints, rateMax])

  const onPointsChange = (next: LevelPoint[]) => {
    // The chart's drag range is the display axis (0..axisMax); committed values
    // clamp to the real rate bounds so the resolutions never see rate 0.
    const clamped = next.map((p) => ({
      ...p,
      value: Math.max(rateMin, Math.min(rateMax, p.value)),
    }))
    dispatch(rateCurveActions.setRateCurve({ scope, points: clamped }))
  }

  return (
    <TimelineLevelEditor
      points={displayPoints}
      min={0}
      max={axisMax}
      width={width}
      height={height}
      scrollLeft={scrollLeft}
      paddingY={CHART_VERTICAL_PADDING}
      pixelsPerTick={pixelsPerTick}
      onPointsChange={onPointsChange}
    />
  )
}
