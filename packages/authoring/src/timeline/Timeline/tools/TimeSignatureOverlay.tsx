'use client'
import { useEffect, useMemo, type MouseEvent, type JSX } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { timeSignatureActions } from '../../../state/timeSignature.slice.ts'
import {
  selectActiveTimeSignatureChanges,
  selectActiveTimelineScope,
  selectFrameCount,
} from '../../../state/selectors.ts'
import {
  barBoundaryTicks,
  buildSignatureBarTable,
} from '../../../core/timeline/resolutions/timeSignature.helpers.ts'
import { useTimelineResolution } from '../../useTimelineResolution.ts'
import { EditableSelect } from '../../../components/EditableSelect/EditableSelect.tsx'

export interface TimeSignatureOverlayProps {
  width: number
  /** Overlay height — the scroll viewport's height, matching the Rate tool. */
  height: number
  pixelsPerTick: number
  /** Ticks per raw `FrameBase.frame` grid unit — converts `frameCount` to ticks. */
  ticksPerUnit: number
}

const NUMERATOR_OPTIONS = [2, 3, 4, 5, 6, 7, 9, 12].map((n) => ({
  value: n,
  label: String(n),
}))
const DENOMINATOR_OPTIONS = [2, 4, 8, 16].map((n) => ({ value: n, label: String(n) }))

/**
 * Time-signature editor overlay (Sound Studio only) — reuses
 * `TimelineLevelEditor`'s dark backdrop styling/token (not its point graph)
 * with vertical bar dividers; double-click adds a 4/4 change at the nearest
 * beat, each existing change gets an inline numerator/denominator chip.
 */
export const TimeSignatureOverlay = ({
  width,
  height,
  pixelsPerTick,
  ticksPerUnit,
}: TimeSignatureOverlayProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const changes = useAuthoringSelector(selectActiveTimeSignatureChanges)
  const frameCount = useAuthoringSelector(selectFrameCount)
  // Beat/bar math needs the TPQ structural constant (960), NOT the frame-grid
  // bridge `ticksPerUnit` prop — tick-native shells pass 1 there.
  const ticksPerQuarter = useTimelineResolution().ticksPerUnit

  const table = useMemo(
    () => buildSignatureBarTable(changes, ticksPerQuarter),
    [changes, ticksPerQuarter]
  )
  const dividers = useMemo(
    () =>
      barBoundaryTicks(table, ticksPerQuarter, {
        startTick: 0,
        endTick: Math.max(0, frameCount - 1) * ticksPerUnit,
      }),
    [table, ticksPerQuarter, ticksPerUnit, frameCount]
  )

  // Seed a real 4/4 change at tick 0 so the chip is editable from the start.
  // The selector returns a virtual DEFAULT_TIME_SIGNATURE_CHANGE (id='default')
  // when no stored changes exist for this scope — that sentinel change cannot be
  // updated because it isn't in the store. Dispatching addChange once makes it real.
  useEffect(() => {
    if (changes[0]?.id === 'default') {
      dispatch(
        timeSignatureActions.addChange({ scope, tick: 0, numerator: 4, denominator: 4 })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  const onDoubleClick = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const rawTick = (event.clientX - rect.left) / pixelsPerTick
    // Snap the new change to the nearest beat.
    const tick = Math.max(0, Math.round(rawTick / ticksPerQuarter) * ticksPerQuarter)
    dispatch(
      timeSignatureActions.addChange({ scope, tick, numerator: 4, denominator: 4 })
    )
  }

  return (
    <div
      className={'greese-TimelineLevelEditor-backdrop'}
      style={{ width, height, cursor: 'crosshair' }}
      title="Double-click to add a time-signature change"
      onDoubleClick={onDoubleClick}
    >
      {dividers.map((tick) => (
        <div
          className={'greese-TimeSignatureOverlay-divider'}
          key={tick}
          style={{ left: tick * pixelsPerTick }}
        />
      ))}
      {changes.map((change) => (
        <div
          className={'greese-TimeSignatureOverlay-chip'}
          key={change.id}
          style={{ left: change.tick * pixelsPerTick }}
        >
          <EditableSelect
            label="Beats per bar"
            value={change.numerator}
            options={NUMERATOR_OPTIONS}
            onChange={(value) =>
              dispatch(
                timeSignatureActions.updateChange({
                  scope,
                  id: change.id,
                  numerator: value,
                  denominator: change.denominator,
                })
              )
            }
          />
          /
          <EditableSelect
            label="Beat unit"
            value={change.denominator}
            options={DENOMINATOR_OPTIONS}
            onChange={(value) =>
              dispatch(
                timeSignatureActions.updateChange({
                  scope,
                  id: change.id,
                  numerator: change.numerator,
                  denominator: value,
                })
              )
            }
          />
        </div>
      ))}
    </div>
  )
}
