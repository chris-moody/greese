'use client'
import { useCallback, useEffect, useRef, type MouseEvent } from 'react'

export interface HoldRepeatOptions {
  /** Milliseconds held before it starts repeating. @default 400 */
  initialDelay?: number
  /** Milliseconds between repeats. @default 90 */
  interval?: number
}

/**
 * Handlers for a button that repeats while held: once on press, then every
 * `interval` after `initialDelay`, until it's released or the pointer
 * leaves. Pointer events, so touch repeats too; a keyboard press (a click
 * with no pointer) runs it once. Glop's took only mouse down, so neither the
 * keyboard nor touch could use it.
 */
export const useHoldRepeat = (
  callback: () => void,
  { initialDelay = 400, interval = 90 }: HoldRepeatOptions = {}
) => {
  const latest = useRef(callback)
  useEffect(() => {
    latest.current = callback
  })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (repeat.current) clearInterval(repeat.current)
    timer.current = repeat.current = null
  }, [])

  const start = useCallback(() => {
    stop()
    latest.current()
    timer.current = setTimeout(() => {
      repeat.current = setInterval(() => latest.current(), interval)
    }, initialDelay)
  }, [initialDelay, interval, stop])

  useEffect(() => stop, [stop])

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    // Enter and Space click without a pointer: `detail` is 0.
    onClick: (event: MouseEvent) => {
      if (event.detail === 0) latest.current()
    },
  }
}
