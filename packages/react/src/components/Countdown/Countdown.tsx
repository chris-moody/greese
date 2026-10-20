'use client'
import { useEffect, useRef, useState, type ComponentPropsWithRef, type JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds'

const SECONDS: Record<CountdownUnit, number> = {
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
}
const SHORT: Record<CountdownUnit, string> = {
  days: 'd',
  hours: 'h',
  minutes: 'm',
  seconds: 's',
}

/**
 * Splits whole seconds into the given units, largest first; the largest
 * takes whatever doesn't fit in the others (`[100, 0]` hours for 100 h).
 */
export const splitDuration = (
  seconds: number,
  units: CountdownUnit[]
): Array<[CountdownUnit, number]> => {
  let rest = Math.max(0, Math.floor(seconds))
  const ordered = (Object.keys(SECONDS) as CountdownUnit[]).filter((u) =>
    units.includes(u)
  )
  return ordered.map((unit) => {
    const size = SECONDS[unit]
    const amount = Math.floor(rest / size)
    rest -= amount * size
    return [unit, amount]
  })
}

/** A spoken form, for `aria-label`: "1 hour, 2 minutes, 5 seconds". */
export const durationText = (parts: Array<[CountdownUnit, number]>): string =>
  parts.map(([unit, n]) => `${n} ${n === 1 ? unit.slice(0, -1) : unit}`).join(', ')

export interface CountdownProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** Seconds left. Counting restarts from here whenever it changes. */
  seconds: number
  /** Count down; `false` freezes it. @default true */
  running?: boolean
  /**
   * Which units to show, largest first. The largest takes whatever the others
   * can't hold.
   * @default ['hours', 'minutes', 'seconds']
   */
  units?: CountdownUnit[]
  /** `clock` (01:02:05) or `labels` (1h 2m 5s). @default 'clock' */
  format?: 'clock' | 'labels'
  /** Called once when it reaches zero. */
  onComplete?: () => void
}

/**
 * A live countdown, as a `role="timer"` (not announced every second; its
 * spoken form is its label). Ticks against the clock, so it doesn't drift.
 *
 * ```tsx
 * <Countdown seconds={3725} onComplete={() => setDone(true)} />
 * ```
 */
export const Countdown = ({
  greese,
  seconds,
  running = true,
  units = ['hours', 'minutes', 'seconds'],
  format = 'clock',
  onComplete,
  className,
  ...props
}: CountdownProps): JSX.Element => {
  const [left, setLeft] = useState(seconds)
  // A new `seconds` restarts the count: reset during render, React's
  // pattern for state derived from a prop.
  const [from, setFrom] = useState(seconds)
  if (from !== seconds) {
    setFrom(seconds)
    setLeft(seconds)
  }
  const current = useRef(left)
  current.current = left
  const complete = useRef(onComplete)
  complete.current = onComplete

  // Ticks against an end time rather than counting intervals, so a slow tab
  // doesn't make it drift. Resuming continues from what's left.
  useEffect(() => {
    if (!running || current.current <= 0) return
    const end = Date.now() + current.current * 1000
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setLeft(next)
      if (next === 0) {
        clearInterval(timer)
        complete.current?.()
      }
    }, 250)
    return () => clearInterval(timer)
  }, [running, from])

  const parts = splitDuration(left, units)
  return withGreese(
    <span
      role="timer"
      aria-label={durationText(parts)}
      {...props}
      className={cx('greese-Countdown', `greese-Countdown--${format}`, className)}
    >
      {parts.map(([unit, n], i) => (
        <span key={unit} className="greese-Countdown-unit" aria-hidden="true">
          {format === 'clock' ? (
            <>
              {i > 0 && <span className="greese-Countdown-separator">:</span>}
              {i === 0 ? n : String(n).padStart(2, '0')}
            </>
          ) : (
            <>
              {n}
              <span className="greese-Countdown-label">{SHORT[unit]}</span>
            </>
          )}
        </span>
      ))}
    </span>,
    greese
  )
}
