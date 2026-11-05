'use client'
import {
  useRef,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { wrapDegrees } from './fieldValues.ts'

/** EditableField's `knob` control. Internal: reached through EditableField. */
export interface DialProps {
  /** The angle in degrees: `0` points up, growing clockwise. */
  value: number
  /** Called with the new angle, already wrapped into 0–360. */
  onValueChange: (value: number) => void
  /** The dial's accessible name. */
  label: string
  /** Stops every interaction and dims it. */
  disabled?: boolean
  /** Extra classes on the dial. */
  className?: string
  /** The dial's id, so a label can point at it. */
  id?: string
}

/**
 * The angle from the dial's centre to a point, in the dial's own convention:
 * `atan2(dx, -dy)` puts 0 at the top and grows clockwise, the way CSS
 * `linear-gradient()` reads an angle.
 */
const angleTo = (box: DOMRect, x: number, y: number): number =>
  wrapDegrees(
    (Math.atan2(x - (box.left + box.width / 2), box.top + box.height / 2 - y) * 180) /
      Math.PI
  )

/**
 * A drag-to-rotate direction dial: a circle with a dot showing where it
 * points. Dragging turns it by however far the pointer travels around the
 * centre, so the dot never jumps to the pointer, and the arrow keys nudge it.
 */
export const Dial = ({
  value,
  onValueChange,
  label,
  disabled,
  className,
  id,
}: DialProps): JSX.Element => {
  // Where the drag started, so the dial turns by the pointer's travel rather
  // than snapping its dot to wherever the pointer went down.
  const from = useRef<{ angle: number; value: number } | null>(null)

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    from.current = {
      angle: angleTo(
        event.currentTarget.getBoundingClientRect(),
        event.clientX,
        event.clientY
      ),
      value,
    }
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = from.current
    if (!origin || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    const now = angleTo(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    )
    // Take the short way round, so crossing 12 o'clock doesn't spin the value.
    let delta = now - origin.angle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    onValueChange(wrapDegrees(origin.value + delta))
  }

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const step = event.shiftKey ? 15 : 1
    const moves: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
    }
    const by = moves[event.key]
    if (by === undefined) return
    event.preventDefault()
    onValueChange(wrapDegrees(value + by))
  }

  const degrees = Math.round(value)
  return (
    <div
      id={id}
      className={cx('greese-EditableField-dial', className)}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={degrees}
      aria-valuetext={`${degrees} degrees`}
      aria-disabled={disabled || undefined}
      style={{ '--greese-editablefield-angle': `${value}deg` } as CSSProperties}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={() => {
        from.current = null
      }}
      onKeyDown={keys}
    >
      <span className="greese-EditableField-dialDot" aria-hidden="true" />
    </div>
  )
}
