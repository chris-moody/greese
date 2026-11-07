'use client'
import {
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { EditableField, IconButton } from '@greese/react'
import { PlusIcon, TrashIcon } from '@greese/icons'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import {
  colorAtOffset,
  gradientStopsCss,
  MIN_GRADIENT_STOPS,
  sortStops,
  type GradientColorStop,
} from '../../core/paint/gradient.ts'

export interface GradientStopBarProps {
  /** The gradient's color stops. */
  stops: readonly GradientColorStop[]
  /** Called with the stops, in order, after any change. */
  onChange: (stops: GradientColorStop[]) => void
  /** Stops every change and dims it. */
  disabled?: boolean
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const percent = (offset: number) => Math.round(offset * 100)

/**
 * A gradient's stops on a preview of it. Click the track to add a stop
 * there; drag a stop, or focus it and use the arrows (Shift for 10%), Home
 * and End, to move it; Delete removes it. The chosen stop's color and an Add
 * button sit below. Each stop is a slider with its offset as its value.
 *
 * ```tsx
 * <GradientStopBar stops={gradient.stops} onChange={(stops) => setGradient({ ...gradient, stops })} />
 * ```
 */
export const GradientStopBar = ({
  stops,
  onChange,
  disabled,
}: GradientStopBarProps): JSX.Element => {
  const sorted = sortStops(stops)
  const [selected, setSelected] = useState(0)
  const index = Math.min(selected, sorted.length - 1)
  const current = sorted[index]
  const track = useRef<HTMLDivElement>(null)
  const handles = useRef<(HTMLDivElement | null)[]>([])
  const canDelete = !disabled && sorted.length > MIN_GRADIENT_STOPS

  /** Replaces the stop at `at` and keeps the selection on it through the re-sort. */
  const commit = (at: number, stop: GradientColorStop | null, focus = false) => {
    const next = sorted.filter((_, i) => i !== at)
    if (stop) next.push(stop)
    const ordered = sortStops(next)
    const moved = stop ? ordered.indexOf(stop) : Math.max(0, at - 1)
    setSelected(moved)
    onChange(ordered)
    if (focus) requestAnimationFrame(() => handles.current[moved]?.focus())
  }

  const offsetAt = (clientX: number) => {
    const box = track.current?.getBoundingClientRect()
    return box && box.width > 0 ? clamp01((clientX - box.left) / box.width) : 0
  }

  const add = (offset: number) => {
    if (disabled) return
    commit(-1, { offset, color: colorAtOffset(sorted, offset) }, true)
  }

  const onTrackClick = (event: MouseEvent<HTMLDivElement>) => add(offsetAt(event.clientX))

  const onAdd = () => {
    // Halfway to the next stop, or the previous one from the last.
    const next = sorted[index + 1] ?? sorted[index - 1]
    add(current && next ? (current.offset + next.offset) / 2 : 0.5)
  }

  const startDrag = (at: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return
    event.stopPropagation()
    setSelected(at)
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      onMove: (move) => {
        const stop = { ...sorted[at]!, offset: offsetAt(move.clientX) }
        const next = sortStops([...sorted.filter((_, i) => i !== at), stop])
        setSelected(next.indexOf(stop))
        onChange(next)
      },
    })
  }

  const onHandleKey = (at: number) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const stop = sorted[at]!
    const step = event.shiftKey ? 0.1 : 0.01
    const moves: Record<string, number> = {
      ArrowRight: stop.offset + step,
      ArrowUp: stop.offset + step,
      ArrowLeft: stop.offset - step,
      ArrowDown: stop.offset - step,
      Home: 0,
      End: 1,
    }
    if (event.key in moves) {
      event.preventDefault()
      commit(at, { ...stop, offset: clamp01(moves[event.key]!) }, true)
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && canDelete) {
      // Also kept from a window-level Delete (the timeline's), which would
      // delete the selected layers too.
      event.preventDefault()
      event.stopPropagation()
      commit(at, null, true)
    }
  }

  return (
    <div className="greese-GradientStopBar" data-disabled={disabled || undefined}>
      <div className="greese-GradientStopBar-track" ref={track}>
        {/* The pointer's way to add a stop; Add below is the keyboard's. */}
        <div
          className="greese-GradientStopBar-preview"
          aria-hidden="true"
          style={
            { '--greese-gradient-preview': gradientStopsCss(sorted) } as CSSProperties
          }
          onClick={onTrackClick}
        />
        {sorted.map((stop, at) => (
          <div
            key={at}
            ref={(el) => {
              handles.current[at] = el
            }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Stop ${at + 1}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent(stop.offset)}
            aria-valuetext={`${percent(stop.offset)}%, ${stop.color}`}
            aria-disabled={disabled || undefined}
            className="greese-GradientStopBar-stop"
            data-selected={at === index || undefined}
            style={{ insetInlineStart: `${stop.offset * 100}%`, background: stop.color }}
            onFocus={() => setSelected(at)}
            onPointerDown={startDrag(at)}
            onKeyDown={onHandleKey(at)}
          />
        ))}
      </div>
      {current && (
        <div className="greese-GradientStopBar-footer">
          <EditableField
            type="color"
            label={`Stop ${index + 1} color`}
            hideLabel
            size="sm"
            value={current.color}
            disabled={disabled}
            onValueChange={(color) => color && commit(index, { ...current, color })}
          />
          <IconButton size="sm" label="Add stop" disabled={disabled} onClick={onAdd}>
            <PlusIcon />
          </IconButton>
          <IconButton
            size="sm"
            label={`Delete stop ${index + 1}`}
            disabled={!canDelete}
            onClick={() => commit(index, null)}
          >
            <TrashIcon />
          </IconButton>
        </div>
      )}
    </div>
  )
}
